import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '@/db'
import dayjs from 'dayjs'
import { useCubeModeStore } from './cubeModeStore'

export const useSetStore = defineStore('set', () => {
  const sets = ref([])
  const loading = ref(false)

  // 缓存标记
  const isLoaded = ref(false)

  // 当前缓存数据对应的魔方模式
  const cachedMode = ref(null)

  function invalidate() {
    isLoaded.value = false
    cachedMode.value = null
  }

  function _currentMode() {
    return useCubeModeStore().currentMode
  }

  async function _doFetchSets() {
    const mode = _currentMode()
    loading.value = true
    const list = await db.sets.where('cubeMode').equals(mode).sortBy('sort')
    sets.value = list
    loading.value = false
    isLoaded.value = true
    cachedMode.value = mode
  }

  /** 页面挂载时调用：缓存命中则跳过 DB 查询 */
  async function ensureFetched() {
    const mode = _currentMode()
    if (isLoaded.value && cachedMode.value === mode) return
    await _doFetchSets()
  }

  /** 强制刷新（写操作后调用） */
  async function fetchSets() {
    await _doFetchSets()
  }

  async function fetchSetsByModule(moduleId) {
    return sets.value.filter(s => s.moduleId === moduleId)
  }

  async function addSet(data) {
    const mode = _currentMode()
    // 同模块内名称唯一
    const exists = await db.sets
      .where({ moduleId: data.moduleId, name: data.name })
      .and(s => s.cubeMode === mode)
      .count()
    if (exists > 0) {
      throw new Error('该状态集名称已存在')
    }

    const list = await db.sets.where('moduleId').equals(data.moduleId).sortBy('sort')
    const maxSort = list[list.length - 1]
    const sort = maxSort ? maxSort.sort + 1 : 0

    const id = await db.sets.add({
      ...data,
      type: 'custom',
      sort,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      cubeMode: mode
    })
    await fetchSets()
    return id
  }

  async function updateSet(id, data) {
    const mode = _currentMode()
    if (data.name) {
      const set = await db.sets.get(id)
      // 排除自己，只检查同模块内是否有其他同名状态集
      const existing = await db.sets
        .where({ moduleId: set.moduleId, name: data.name })
        .and(s => s.cubeMode === mode)
        .first()
      if (existing && existing.id !== id) {
        throw new Error('该状态集名称已存在')
      }
    }
    await db.sets.update(id, data)
    await fetchSets()
  }

  async function deleteSet(id) {
    await db.transaction('rw', db.sets, db.stateSetRel, async () => {
      // 仅删除关联关系，不删除状态实体
      await db.stateSetRel.where('setId').equals(id).delete()
      await db.sets.delete(id)
    })
    await fetchSets()
  }

  async function updateSort(sortedSets) {
    await db.transaction('rw', db.sets, async () => {
      for (let i = 0; i < sortedSets.length; i++) {
        await db.sets.update(sortedSets[i].id, { sort: i })
      }
    })
    await fetchSets()
  }

  return {
    sets,
    loading,
    fetchSets,
    ensureFetched,
    invalidate,
    fetchSetsByModule,
    addSet,
    updateSet,
    deleteSet,
    updateSort
  }
})
