import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ALL_MODES } from '@/config/cubeModes'

const STORAGE_KEY = 'formulaDB_cube_mode'

export const useCubeModeStore = defineStore('cubeMode', () => {
  const currentMode = ref(localStorage.getItem(STORAGE_KEY) || '3x3')

  /**
   * 设置当前魔方模式
   * @param {'2x2' | '3x3' | '4x4'} mode
   */
  function setMode(mode) {
    if (!ALL_MODES.includes(mode)) return
    if (currentMode.value === mode) return
    currentMode.value = mode
    localStorage.setItem(STORAGE_KEY, mode)
  }

  return {
    currentMode,
    setMode
  }
})
