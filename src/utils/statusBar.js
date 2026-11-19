import { Capacitor } from '@capacitor/core'

/**
 * 弹窗打开时，将状态栏背景色改为暗色（与遮罩层配合）
 * @param {boolean} open - true 表示弹窗打开，false 表示弹窗关闭
 */
export async function setStatusBarForDialog(open) {
  try {
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      const StatusBar = Capacitor.Plugins.StatusBar
      if (StatusBar) {
        if (open) {
          await StatusBar.setBackgroundColor({ color: 'rgba(11, 46, 127, 0.9)' })
        } else {
          await StatusBar.setBackgroundColor({ color: 'transparent' })
        }
      }
    }
  } catch (e) {
    console.warn('StatusBar color change failed:', e)
  }
}
