import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '@/db'
import dayjs from 'dayjs'
import { useCubeModeStore } from './cubeModeStore'

export const useModuleStore = defineStore('module', () => {
  const modules = ref([])
  const loading = ref(false)

  // 初始化锁：确保 initSeedData 完成后再查询数据
  let _initResolve
  const initReady = new Promise(resolve => {
    _initResolve = resolve
  })

  // 缓存标记：数据是否已从 DB 加载过
  const isLoaded = ref(false)

  // 当前缓存数据对应的魔方模式
  const cachedMode = ref(null)

  function notifyInitDone() {
    _initResolve()
  }

  function invalidate() {
    isLoaded.value = false
    cachedMode.value = null
  }

  function _currentMode() {
    return useCubeModeStore().currentMode
  }

  async function _doFetchModules() {
    const mode = _currentMode()
    loading.value = true
    const list = await db.modules
      .where('cubeMode')
      .equals(mode)
      .sortBy('sort')
    modules.value = list
    loading.value = false
    await fixMissingBuiltInSets()
    isLoaded.value = true
    cachedMode.value = mode
  }

  /** 页面挂载时调用：缓存命中则跳过 DB 查询 */
  async function ensureFetched() {
    const mode = _currentMode()
    if (isLoaded.value && cachedMode.value === mode) return
    await initReady
    await _doFetchModules()
  }

  /** 强制刷新（写操作后调用） */
  async function fetchModules() {
    await initReady
    await _doFetchModules()
  }

  // 修复缺失的内置"全部状态"状态集（为已有的自定义模块补充创建）
  async function fixMissingBuiltInSets() {
    const mode = _currentMode()
    const allSets = await db.sets.where('cubeMode').equals(mode).toArray()
    const setsByModule = {}
    allSets.forEach(set => {
      if (!setsByModule[set.moduleId]) {
        setsByModule[set.moduleId] = []
      }
      setsByModule[set.moduleId].push(set)
    })

    const modulesToFix = modules.value.filter(m => {
      const moduleSets = setsByModule[m.id] || []
      return m.type === 'custom' && !moduleSets.some(s => s.type === 'builtIn')
    })

    if (modulesToFix.length > 0) {
      await db.transaction('rw', db.sets, async () => {
        for (const mod of modulesToFix) {
          await db.sets.add({
            moduleId: mod.id,
            name: '全部状态',
            desc: `该模块下所有状态`,
            type: 'builtIn',
            sort: 0,
            createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            cubeMode: mode
          })
        }
      })
    }
  }

  async function addModule(data) {
    const mode = _currentMode()
    const exists = await db.modules
      .where('cubeMode')
      .equals(mode)
      .and(m => m.name === data.name)
      .count()
    if (exists > 0) {
      throw new Error('模块名称已存在')
    }
    const list = await db.modules.where('cubeMode').equals(mode).sortBy('sort')
    const maxSort = list[list.length - 1]
    const sort = maxSort ? maxSort.sort + 1 : 0

    // 在事务中创建模块和其内置的"全部状态"状态集
    await db.transaction('rw', db.modules, db.sets, async () => {
      const moduleId = await db.modules.add({
        ...data,
        type: 'custom',
        sort,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })

      // 创建该模块的内置"全部状态"状态集
      await db.sets.add({
        moduleId,
        name: '全部状态',
        desc: `该模块下所有状态`,
        type: 'builtIn',
        sort: 0,
        createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cubeMode: mode
      })
    })

    // 失效关联 store 缓存（新建模块同时创建了 builtIn set，需同步刷新）
    const { useSetStore } = await import('@/stores/setStore')
    useSetStore().invalidate()

    await fetchModules()
  }

  async function updateModule(id, data) {
    const mode = _currentMode()
    if (data.name) {
      const existing = await db.modules
        .where('cubeMode')
        .equals(mode)
        .and(m => m.name === data.name)
        .first()
      if (existing && existing.id !== id) {
        throw new Error('模块名称已存在')
      }
    }
    await db.modules.update(id, data)
    await fetchModules()
  }

  async function deleteModule(id) {
    // 删除模块会级联删除 sets/states/formulas，需要失效关联 store
    const { useSetStore } = await import('@/stores/setStore')
    const { useStateStore } = await import('@/stores/stateStore')
    const { useFormulaStore } = await import('@/stores/formulaStore')

    await db.transaction('rw', db.modules, db.sets, db.stateSetRel, db.states, db.formulas, async () => {
      const sets = await db.sets.where('moduleId').equals(id).toArray()
      const setIds = sets.map(s => s.id)

      const rels = await db.stateSetRel.where('setId').anyOf(setIds).toArray()
      const stateIds = [...new Set(rels.map(r => r.stateId))]

      for (const stateId of stateIds) {
        await db.formulas.where('stateId').equals(stateId).delete()
        await db.states.delete(stateId)
      }

      await db.stateSetRel.where('setId').anyOf(setIds).delete()
      await db.sets.where('moduleId').equals(id).delete()
      await db.modules.delete(id)
    })
    // 失效关联 store 缓存（下次 ensureFetched 时重新加载）
    useSetStore().invalidate()
    useStateStore().invalidate()
    useFormulaStore().invalidate()
    await fetchModules()
  }

  async function updateSort(sortedModules) {
    await db.transaction('rw', db.modules, async () => {
      for (let i = 0; i < sortedModules.length; i++) {
        await db.modules.update(sortedModules[i].id, { sort: i })
      }
    })
    await fetchModules()
  }

  return {
    modules,
    loading,
    fetchModules,
    ensureFetched,
    invalidate,
    addModule,
    updateModule,
    deleteModule,
    updateSort,
    notifyInitDone
  }
})
