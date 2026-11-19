/**
 * 滑动操作互斥锁
 * 所有 ModuleCard / Swipeable 组件共享同一个活跃状态，
 * 保证同一时间只有一张卡片处于左滑打开状态。
 *
 * 用法:
 *   import { swipeMutex } from '@/utils/swipeMutex'
 *
 *   // 注册当前实例打开
 *   swipeMutex.register(myCloseFn)
 *
 *   // 关闭任意已打开的卡片（返回 true 表示确实关了一个）
 *   const didClose = swipeMutex.closeAny()
 */

const mutex = {
  /** 当前处于打开状态的卡片的关闭函数 */
  _activeCloser: null,

  /**
   * 注册当前卡片为打开状态
   * @param {Function} closer - 该卡片的关闭函数（用于身份识别）
   */
  register(closer) {
    if (this._activeCloser && this._activeCloser !== closer) {
      this._activeCloser()
    }
    this._activeCloser = closer
  },

  /**
   * 注销当前卡片（仅匹配时才清除）
   * @param {Function} closer - 要注销的关闭函数
   */
  unregister(closer) {
    if (this._activeCloser === closer) {
      this._activeCloser = null
    }
  },

  /**
   * 关闭当前已打开的任意卡片
   * @returns {boolean} 是否确实执行了关闭
   */
  closeAny() {
    if (this._activeCloser) {
      this._activeCloser()
      return true
    }
    return false
  }
}

export default mutex
