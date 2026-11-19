/**
 * 滚动位置管理器
 * 用于记录和恢复页面滚动位置
 */

// 调试开关（true开启日志，false关闭日志）
const DEBUG_ENABLE = false

// 存储滚动位置的对象
const scrollPositions = {}

// 页面路径映射，用于生成唯一的存储键
const PAGE_KEYS = {
  HOME: 'home',
  MODULE: 'module',
  SET: 'set',
  STATE_DETAIL: 'stateDetail',
  SETTINGS: 'settings',
  SETTINGS_ABOUT: 'settingsAbout',
  UPDATE_LOG: 'updateLog'
}

/**
 * 获取页面的唯一存储键
 * @param {string} pageType - 页面类型
 * @param {number|string} [id] - 页面ID（如模块ID、状态集ID等）
 * @returns {string} 唯一键
 */
function getStorageKey(pageType, id = null) {
  if (id !== null && id !== undefined) {
    return `${pageType}_${id}`
  }
  return pageType
}

/**
 * 记录滚动位置
 * @param {string} pageType - 页面类型
 * @param {number|string} [id] - 页面ID
 * @param {number} scrollTop - 滚动位置
 */
export function saveScrollPosition(pageType, id, scrollTop) {
  const key = getStorageKey(pageType, id)
  scrollPositions[key] = scrollTop
  if (DEBUG_ENABLE) console.log(`[ScrollPosition] 保存滚动位置: ${key} = ${scrollTop}`)
}

/**
 * 获取滚动位置
 * @param {string} pageType - 页面类型
 * @param {number|string} [id] - 页面ID
 * @returns {number} 滚动位置，如果没有记录则返回0
 */
export function getScrollPosition(pageType, id = null) {
  const key = getStorageKey(pageType, id)
  const position = scrollPositions[key] || 0
  if (DEBUG_ENABLE) console.log(`[ScrollPosition] 获取滚动位置: ${key} = ${position}`)
  return position
}

/**
 * 清除指定页面的滚动位置记录
 * @param {string} pageType - 页面类型
 * @param {number|string} [id] - 页面ID
 */
export function clearScrollPosition(pageType, id = null) {
  const key = getStorageKey(pageType, id)
  delete scrollPositions[key]
  if (DEBUG_ENABLE) console.log(`[ScrollPosition] 清除滚动位置: ${key}`)
}

/**
 * 清除所有滚动位置记录
 */
export function clearAllScrollPositions() {
  Object.keys(scrollPositions).forEach(key => {
    delete scrollPositions[key]
  })
  if (DEBUG_ENABLE) console.log('[ScrollPosition] 清除所有滚动位置')
}

export { PAGE_KEYS }
