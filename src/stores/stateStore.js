import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import db from '@/db'
import dayjs from 'dayjs'
import { useCubeModeStore } from './cubeModeStore'

export const useStateStore = defineStore('state', () => {
  const states = ref([])
  const stateSetRels = ref([])
  const loading = ref(false)

  // 缓存标记
  const statesLoaded = ref(false)
  const relsLoaded = ref(false)

  // 当前缓存数据对应的魔方模式
  const cachedMode = ref(null)

  function invalidate() {
    statesLoaded.value = false
    relsLoaded.value = false
    cachedMode.value = null
  }

  function invalidateStates() {
    statesLoaded.value = false
  }

  function invalidateRels() {
    relsLoaded.value = false
  }

  function _currentMode() {
    return useCubeModeStore().currentMode
  }

  // 带公式数量的状态列表
  const statesWithSets = computed(() => {
    return states.value.map(state => {
      const formulaCount = formulaCounts.value[state.id] || 0
      return { ...state, formulaCount }
    })
  })

  const formulaCounts = ref({})

  async function _doFetchStates() {
    const mode = _currentMode()
    loading.value = true
    const list = await db.states.where('cubeMode').equals(mode).toArray()
    states.value = list

    // 获取公式数量（排除打乱公式）
    const formulas = await db.formulas.where('cubeMode').equals(mode).toArray()
    const counts = {}
    formulas.forEach(f => {
      if (!f.isScramble) {
        counts[f.stateId] = (counts[f.stateId] || 0) + 1
      }
    })
    formulaCounts.value = counts

    loading.value = false
    statesLoaded.value = true
  }

  async function _doFetchRels() {
    const mode = _currentMode()
    stateSetRels.value = await db.stateSetRel.where('cubeMode').equals(mode).toArray()
    relsLoaded.value = true
  }

  /** 页面挂载时调用：缓存命中则跳过 DB 查询 */
  async function ensureFetched() {
    const mode = _currentMode()
    if (statesLoaded.value && relsLoaded.value && cachedMode.value === mode) return
    if (!statesLoaded.value || cachedMode.value !== mode) {
      await _doFetchStates()
    }
    if (!relsLoaded.value || cachedMode.value !== mode) {
      await _doFetchRels()
    }
    cachedMode.value = mode
  }

  /** 强制刷新状态数据（写操作后调用） */
  async function fetchStates() {
    await _doFetchStates()
    cachedMode.value = _currentMode()
  }

  /** 强制刷新关联关系（写操作后调用） */
  async function fetchStateSetRels() {
    await _doFetchRels()
    cachedMode.value = _currentMode()
  }

  /** 仅刷新公式计数映射（公式增删改后调用，无需重新加载全部状态） */
  async function refreshFormulaCounts() {
    const mode = _currentMode()
    const formulas = await db.formulas.where('cubeMode').equals(mode).toArray()
    const counts = {}
    formulas.forEach(f => {
      if (!f.isScramble) {
        counts[f.stateId] = (counts[f.stateId] || 0) + 1
      }
    })
    formulaCounts.value = counts
  }

  // 检查模块内是否有同名状态
  async function hasDuplicateNameInModule(name, excludeId = null, moduleId = null) {
    const mode = _currentMode()
    if (!moduleId) {
      // 没有指定模块时，全局检查
      const exists = await db.states
        .where('cubeMode')
        .equals(mode)
        .and(s => s.name === name)
        .count()
      if (excludeId) {
        const existing = await db.states
          .where('cubeMode')
          .equals(mode)
          .and(s => s.name === name)
          .first()
        return existing && existing.id !== excludeId
      }
      return exists > 0
    }

    // 指定模块时，只检查该模块内的状态
    // 1. 获取模块的所有状态集
    const sets = await db.sets
      .where('moduleId')
      .equals(moduleId)
      .and(s => s.cubeMode === mode)
      .toArray()
    const setIds = sets.map(s => s.id)

    if (setIds.length === 0) return false

    // 2. 获取这些状态集中包含的状态
    const rels = await db.stateSetRel
      .where('setId')
      .anyOf(setIds)
      .and(r => r.cubeMode === mode)
      .toArray()
    const stateIdsInModule = [...new Set(rels.map(r => r.stateId))]

    // 3. 检查是否有同名状态
    const moduleStates = states.value.filter(s => stateIdsInModule.includes(s.id))
    const duplicate = moduleStates.find(s => s.name === name && s.id !== excludeId)
    return !!duplicate
  }

  async function addState(data, moduleId = null) {
    const mode = _currentMode()
    // 检查模块内名称是否重复
    const hasDuplicate = await hasDuplicateNameInModule(data.name, null, moduleId)
    if (hasDuplicate) {
      throw new Error('状态名称已存在')
    }

    const id = await db.states.add({
      name: data.name,
      desc: data.desc || '',
      image: data.image || '',
      imageType: data.imageType || '',
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      cubeMode: mode
    })
    await fetchStates()
    return id
  }

  async function updateState(id, data, moduleId = null) {
    if (data.name) {
      const hasDuplicate = await hasDuplicateNameInModule(data.name, id, moduleId)
      if (hasDuplicate) {
        throw new Error('状态名称已存在')
      }
    }
    await db.states.update(id, data)
    await fetchStates()
  }

  async function deleteStates(stateIds) {
    // 删除状态会级联删除公式，需要失效 formulaStore
    const { useFormulaStore } = await import('@/stores/formulaStore')

    await db.transaction('rw', db.states, db.stateSetRel, db.formulas, async () => {
      // 删除关联
      await db.stateSetRel.where('stateId').anyOf(stateIds).delete()
      // 删除公式
      await db.formulas.where('stateId').anyOf(stateIds).delete()
      // 删除状态
      await db.states.bulkDelete(stateIds)
    })
    useFormulaStore().invalidate()
    await fetchStates()
    await fetchStateSetRels()
  }

  async function addStateToSet(stateId, setId) {
    const mode = _currentMode()
    const exists = await db.stateSetRel
      .where({ stateId, setId })
      .and(r => r.cubeMode === mode)
      .count()
    if (exists > 0) {
      throw new Error('状态已在该集合中')
    }
    // 获取该状态集当前最大的 sort 值，新添加的状态排在最后
    const list = await db.stateSetRel.where('setId').equals(setId).sortBy('sort')
    const maxSortRel = list[list.length - 1]
    const sort = maxSortRel ? (maxSortRel.sort || 0) + 1 : 0
    await db.stateSetRel.add({ stateId, setId, sort, cubeMode: mode })
    await fetchStateSetRels()
  }

  async function removeStatesFromSet(stateIds, setId) {
    await db.stateSetRel
      .where('setId')
      .equals(setId)
      .and(r => stateIds.includes(r.stateId))
      .delete()
    await fetchStateSetRels()
  }

  async function updateStateSetRelSort(setId, sortedStates) {
    await db.transaction('rw', db.stateSetRel, async () => {
      for (let i = 0; i < sortedStates.length; i++) {
        const stateId = sortedStates[i].id
        // 使用复合索引查询
        const rels = await db.stateSetRel.where('[setId+stateId]').equals([setId, stateId]).toArray()
        for (const rel of rels) {
          await db.stateSetRel.update(rel.id, { sort: i })
        }
      }
    })
    await fetchStateSetRels()
  }

  return {
    states,
    stateSetRels,
    statesWithSets,
    formulaCounts,
    loading,
    fetchStates,
    fetchStateSetRels,
    ensureFetched,
    invalidate,
    invalidateStates,
    invalidateRels,
    refreshFormulaCounts,
    addState,
    updateState,
    deleteStates,
    addStateToSet,
    removeStatesFromSet,
    updateStateSetRelSort
  }
})
