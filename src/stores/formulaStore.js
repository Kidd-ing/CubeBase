import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '@/db'
import dayjs from 'dayjs'
import { useStateStore } from '@/stores/stateStore'
import { useCubeModeStore } from './cubeModeStore'

export const useFormulaStore = defineStore('formula', () => {
  const formulas = ref([])
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

  async function _doFetchFormulas() {
    const mode = _currentMode()
    loading.value = true
    formulas.value = await db.formulas.where('cubeMode').equals(mode).sortBy('sort')
    loading.value = false
    isLoaded.value = true
    cachedMode.value = mode
  }

  /** 页面挂载时调用：缓存命中则跳过 DB 查询 */
  async function ensureFetched() {
    const mode = _currentMode()
    if (isLoaded.value && cachedMode.value === mode) return
    await _doFetchFormulas()
  }

  /** 强制刷新（写操作后调用） */
  async function fetchFormulas() {
    await _doFetchFormulas()
  }

  async function addFormula(data) {
    const mode = _currentMode()
    const list = await db.formulas.where('cubeMode').equals(mode).sortBy('sort')
    const id = await db.formulas.add({
      stateId: data.stateId,
      content: data.content,
      hand: data.hand || '',
      remark: data.remark || '',
      mastered: data.mastered || false,
      isScramble: data.isScramble || false,
      sort: list.length,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      cubeMode: mode
    })
    await fetchFormulas()
    await useStateStore().refreshFormulaCounts()
    return id
  }

  async function updateFormula(id, data) {
    await db.formulas.update(id, data)
    await fetchFormulas()
    await useStateStore().refreshFormulaCounts()
  }

  async function deleteFormula(id) {
    await db.formulas.delete(id)
    await fetchFormulas()
    await useStateStore().refreshFormulaCounts()
  }

  async function updateSort(sortedFormulas) {
    await db.transaction('rw', db.formulas, async () => {
      for (let i = 0; i < sortedFormulas.length; i++) {
        await db.formulas.update(sortedFormulas[i].id, { sort: i })
      }
    })
    await fetchFormulas()
    await useStateStore().refreshFormulaCounts()
  }

  return {
    formulas,
    loading,
    fetchFormulas,
    ensureFetched,
    invalidate,
    addFormula,
    updateFormula,
    deleteFormula,
    updateSort
  }
})
