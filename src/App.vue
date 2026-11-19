<template>
  <div :id="'app'" :class="{ 'has-wallpaper': wallpaperUrl }">
    <!-- 启动白色遮罩：防止主题/样式加载闪烁 -->
    <div v-if="showSplashScreen" class="splash-screen"></div>

    <router-view />
    <Toast />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { ElMessage } from 'element-plus'
import Toast from '@/components/Toast.vue'
import { initSeedData, fixMissingStateRelations } from '@/db/seed'
import { useModuleStore } from '@/stores/moduleStore'
import { useCubeModeStore } from '@/stores/cubeModeStore'
import { useDialogStore } from '@/stores/dialogStore'
import { initTheme, initNavMode } from '@/utils/theme'
import { getWallpaper } from '@/utils/wallpaper'

const router = useRouter()
const route = useRoute()
const lastBackTime = ref(0)
const moduleStore = useModuleStore()
const cubeModeStore = useCubeModeStore()
const dialogStore = useDialogStore()
const wallpaperUrl = ref(null)
const showSplashScreen = ref(true)

let isProcessingBack = false

// 初始化状态栏
async function initStatusBar() {
  try {
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      const StatusBar = Capacitor.Plugins.StatusBar
      if (StatusBar) {
        await StatusBar.setOverlaysWebView({ overlay: true })
        await StatusBar.setStyle({ style: 'DARK_CONTENT' })
        await StatusBar.setBackgroundColor({ color: 'transparent' })
      }
    }
  } catch (e) {
    console.warn('StatusBar initialization failed:', e)
  }
}

// 获取状态栏高度并设置为 CSS 变量
async function setStatusBarHeight() {
  try {
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      const { StatusBarHeight } = Capacitor.Plugins
      if (StatusBarHeight) {
        const result = await StatusBarHeight.getHeight()
        const height = result.height || 0
        document.documentElement.style.setProperty('--status-bar-height', height + 'px')
      } else {
        document.documentElement.style.setProperty('--status-bar-height', '24px')
      }
    } else {
      document.documentElement.style.setProperty('--status-bar-height', '0px')
    }
  } catch (e) {
    console.warn('Failed to get status bar height:', e)
    const platform = Capacitor.getPlatform()
    if (platform === 'android') {
      document.documentElement.style.setProperty('--status-bar-height', '24px')
    } else {
      document.documentElement.style.setProperty('--status-bar-height', '0px')
    }
  }
}

// 判断当前页面并返回上级页面路径
function getBackPath() {
  const path = route.path
  
  // 首页
  if (path === '/') {
    return null // 需要退出应用
  }
  
  // 设置页 -> 首页
  if (path === '/settings') {
    return '/'
  }
  
  // 备份管理页 -> 数据管理页
  if (path === '/settings/data/backup') {
    return '/settings/data'
  }
  
  // 数据管理页 -> 设置主页
  if (path === '/settings/data') {
    return '/settings'
  }
  
  // 其他设置子页面 -> 设置主页
  if (path.startsWith('/settings/') && path !== '/settings/theme/wallpaper') {
    return '/settings'
  }

  // 壁纸页面 -> 主题页面
  if (path === '/settings/theme/wallpaper') {
    return '/settings/theme'
  }
  
  // 状态详情页 -> 状态集页
  if (path.startsWith('/state/')) {
    const setId = route.query.setId
    const moduleId = route.query.moduleId
    if (setId) {
      return `/set/${setId}?moduleId=${moduleId || ''}`
    }
    return '/'
  }
  
  // 状态集页 -> 模块页
  if (path.startsWith('/set/')) {
    const moduleId = route.query.moduleId
    if (moduleId) {
      return `/module/${moduleId}`
    }
    return '/'
  }
  
  // 模块页 -> 首页
  if (path.startsWith('/module/')) {
    return '/'
  }
  
  // 默认 -> 首页
  return '/'
}

// 处理返回按钮
function handleBack() {
  // 防止重复触发
  if (isProcessingBack) return
  isProcessingBack = true
  
  // 优先：子页面自定义返回处理（如菜单收起、取消多选）
  if (window.__customBackHandler) {
    const handled = window.__customBackHandler()
    if (handled) {
      setTimeout(() => { isProcessingBack = false }, 100)
      return
    }
  }
  
  // 关闭弹窗
  if (dialogStore.isOpen()) {
    dialogStore.pop()
    setTimeout(() => {
      isProcessingBack = false
    }, 100)
    return
  }
  
  const backPath = getBackPath()
  
  if (backPath === null) {
    // 处于首页，退出应用
    const now = Date.now()
    if (now - lastBackTime.value < 2000) {
      // 2秒内再次点击，退出应用
      App.exitApp()
    } else {
      // 第一次点击，显示提示
      lastBackTime.value = now
      ElMessage('再按一次退出应用')
      // 重置标记，允许再次触发
      setTimeout(() => {
        isProcessingBack = false
      }, 2000)
    }
  } else {
    // 回到上级页面
    router.replace(backPath)
  }
  
  // 短暂延迟后重置标记
  setTimeout(() => {
    isProcessingBack = false
  }, 100)
}

// 初始化
onMounted(async () => {
  await initSeedData(cubeModeStore.currentMode)
  await fixMissingStateRelations(cubeModeStore.currentMode)

  // 通知 moduleStore 初始化数据已就绪
  moduleStore.notifyInitDone()

  await initStatusBar()
  await setStatusBarHeight()

  // 恢复已保存的主题
  initTheme()

  // 恢复导航栏样式模式
  initNavMode()

  // 加载壁纸
  await loadWallpaper()

  // 监听 Android 返回键
  initBackButtonHandler()

  // 监听浏览器 popstate
  window.addEventListener('popstate', handlePopState)

  // 阻止浏览器默认返回行为
  if (window.history && window.history.pushState) {
    window.history.pushState(null, '', location.href)
  }

  // 注册全局刷新壁纸方法
  window.__refreshWallpaper = loadWallpaper

  // 等待 DOM 更新完成后隐藏启动遮罩（确保主题/样式/壁纸已完全应用）
  nextTick(() => {
    setTimeout(() => {
      showSplashScreen.value = false
    }, 50)
  })
})

onUnmounted(() => {
  App.removeAllListeners()
  window.removeEventListener('popstate', handlePopState)
  delete window.__refreshWallpaper
})

// 监听浏览器返回按钮
function handlePopState() {
  // 阻止默认行为
  window.history.pushState(null, '', location.href)
  // 使用自定义的返回逻辑
  handleBack()
}

// 初始化返回按钮处理
function initBackButtonHandler() {
  App.addListener('backButton', () => {
    handleBack()
  })
}

// 加载壁纸
async function loadWallpaper() {
  try {
    const url = await getWallpaper()
    wallpaperUrl.value = url
    
    // 同时设置 CSS 变量给 .page-base 使用
    if (url) {
      document.documentElement.style.setProperty('--wallpaper-image', `url(${url})`)
    } else {
      document.documentElement.style.removeProperty('--wallpaper-image')
    }
  } catch (e) {
    console.error('加载壁纸失败:', e)
    wallpaperUrl.value = null
    document.documentElement.style.removeProperty('--wallpaper-image')
  }
}
</script>

<style>
/* 启动白色遮罩：覆盖整个屏幕（包括状态栏区域），防止主题/样式加载闪烁 */
.splash-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #FFFFFF;
  z-index: 99999;
}
</style>
