import { defineStore } from 'pinia'
import { ref } from 'vue'
import db from '@/db'

// 模式前缀正则：匹配 2x2_ / 3x3_ / 4x4_ 开头的 letter 键
const MODE_PREFIX_RE = /^[234]x[234]_/

export const useSettingStore = defineStore('setting', () => {
  const letterImages = ref([])
  const loading = ref(false)

  // 缓存标记
  const isLoaded = ref(false)

  function invalidate() {
    isLoaded.value = false
  }

  /**
   * 获取指定模式下的字母图片映射
   * @param {string} cubeMode - '2x2' | '3x3' | '4x4'
   * @returns {Object} { letter: image } 映射（已去除模式前缀）
   */
  function getLetterImageMap(cubeMode) {
    const prefix = `${cubeMode}_`
    const map = {}
    letterImages.value.forEach(item => {
      if (item.letter.startsWith(prefix)) {
        const letter = item.letter.substring(prefix.length)
        map[letter] = item.image
      }
    })
    return map
  }

  async function _doFetchLetterImages() {
    loading.value = true
    let records = await db.letterImages.toArray()

    // 迁移旧数据：为没有模式前缀的记录添加 3x3_ 前缀
    const oldFormatRecords = records.filter(r => !MODE_PREFIX_RE.test(r.letter))
    if (oldFormatRecords.length > 0) {
      for (const record of oldFormatRecords) {
        const oldKey = record.letter
        const newKey = `3x3_${oldKey}`
        await db.letterImages.delete(oldKey)
        await db.letterImages.add({
          ...record,
          letter: newKey
        })
      }
      records = await db.letterImages.toArray()
    }

    letterImages.value = records
    loading.value = false
    isLoaded.value = true
  }

  /** 页面挂载时调用：缓存命中则跳过 DB 查询 */
  async function ensureFetched() {
    if (isLoaded.value) return
    await _doFetchLetterImages()
  }

  /** 强制刷新（写操作后调用） */
  async function fetchLetterImages() {
    await _doFetchLetterImages()
  }

  /**
   * 设置指定模式下某字母的图片
   * @param {string} letter - 字母成员（如 R, R', R2）
   * @param {string} image - 图片数据URL（空字符串表示删除）
   * @param {string} cubeMode - '2x2' | '3x3' | '4x4'
   */
  async function setLetterImage(letter, image, cubeMode) {
    const storageKey = `${cubeMode}_${letter}`
    const existing = await db.letterImages.where('letter').equals(storageKey).first()
    if (existing) {
      if (image) {
        await db.letterImages.update(storageKey, {
          image,
          imageType: 'image/png',
          updateTime: new Date().toISOString()
        })
      } else {
        await db.letterImages.delete(storageKey)
      }
    } else if (image) {
      await db.letterImages.add({
        letter: storageKey,
        image,
        imageType: 'image/png',
        updateTime: new Date().toISOString()
      })
    }
    await fetchLetterImages()
  }

  return {
    letterImages,
    loading,
    fetchLetterImages,
    ensureFetched,
    invalidate,
    getLetterImageMap,
    setLetterImage
  }
})
