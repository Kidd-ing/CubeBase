/**
 * 主题管理 - 统一的主题配置和应用逻辑
 * 供 App.vue（启动时恢复）和 SettingsThemePage.vue（切换时应用）共同使用
 */

// 主题配置
export const themes = [
  {
    id: 'default',
    name: '默认青色',
    headerGradient: 'linear-gradient(135deg, #88CAC0 0%, #88C4CC 100%)',
    pageBackground: '#F8F6F3',
    headerBg: '#88CAC0',
    pageBg: '#F8F6F3',
    headerShadow: 'rgba(136, 196, 204, 0.25)',
    activeColor: '#88C4CC',
    activeGlow: 'rgba(136, 196, 204, 0.5)'
  },
  {
    id: 'blue',
    name: '清新蓝色',
    headerGradient: 'linear-gradient(135deg, #74A9E8 0%, #5B9BD5 100%)',
    pageBackground: '#F0F5FA',
    headerBg: '#74A9E8',
    pageBg: '#F0F5FA',
    headerShadow: 'rgba(91, 155, 213, 0.25)',
    activeColor: '#5B9BD5',
    activeGlow: 'rgba(91, 155, 213, 0.5)'
  },
  {
    id: 'purple',
    name: '优雅紫色',
    headerGradient: 'linear-gradient(135deg, #B794F6 0%, #9F7AEA 100%)',
    pageBackground: '#FAF5FF',
    headerBg: '#B794F6',
    pageBg: '#FAF5FF',
    headerShadow: 'rgba(159, 122, 234, 0.25)',
    activeColor: '#9F7AEA',
    activeGlow: 'rgba(159, 122, 234, 0.5)'
  },
  {
    id: 'pink',
    name: '温柔粉色',
    headerGradient: 'linear-gradient(135deg, #FC8181 0%, #F687B3 100%)',
    pageBackground: '#FFF5F7',
    headerBg: '#FC8181',
    pageBg: '#FFF5F7',
    headerShadow: 'rgba(246, 135, 179, 0.25)',
    activeColor: '#F687B3',
    activeGlow: 'rgba(246, 135, 179, 0.5)'
  },
  {
    id: 'orange',
    name: '活力橙色',
    headerGradient: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)',
    pageBackground: '#FFFAF0',
    headerBg: '#F6AD55',
    pageBg: '#FFFAF0',
    headerShadow: 'rgba(237, 137, 54, 0.25)',
    activeColor: '#ED8936',
    activeGlow: 'rgba(237, 137, 54, 0.5)'
  },
  {
    id: 'green',
    name: '自然绿色',
    headerGradient: 'linear-gradient(135deg, #68D391 0%, #48BB78 100%)',
    pageBackground: '#F0FFF4',
    headerBg: '#68D391',
    pageBg: '#F0FFF4',
    headerShadow: 'rgba(72, 187, 120, 0.25)',
    activeColor: '#48BB78',
    activeGlow: 'rgba(72, 187, 120, 0.5)'
  },
  {
    id: 'red',
    name: '热情红色',
    headerGradient: 'linear-gradient(135deg, #F87171 0%, #EF4444 100%)',
    pageBackground: '#FEF2F2',
    headerBg: '#F87171',
    pageBg: '#FEF2F2',
    headerShadow: 'rgba(239, 68, 68, 0.25)',
    activeColor: '#EF4444',
    activeGlow: 'rgba(239, 68, 68, 0.5)'
  },
  {
    id: 'white',
    name: '简约纯白',
    headerGradient: 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
    pageBackground: '#FAFAFA',
    headerBg: '#E2E8F0',
    pageBg: '#FAFAFA',
    headerShadow: 'rgba(203, 213, 225, 0.25)',
    activeColor: '#94A3B8',
    activeGlow: 'rgba(148, 163, 184, 0.5)',
    headerTextColor: '#1D2129',
    headerHoverBg: 'rgba(0, 0, 0, 0.08)'
  },
  {
    id: 'dark',
    name: '经典黑金',
    headerGradient: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)',
    pageBackground: '#EDF2F7',
    headerBg: '#4A5568',
    pageBg: '#EDF2F7',
    headerShadow: 'rgba(45, 55, 72, 0.25)',
    activeColor: '#4A5568',
    activeGlow: 'rgba(74, 85, 104, 0.5)'
  }
]

const THEME_STORAGE_KEY = 'app-theme'
const NAV_MODE_KEY = 'app-nav-mode' // opaque | translucent | transparent

/**
 * 应用主题：通过设置 CSS 变量全局生效
 * @param {string} themeId - 主题ID
 */
export function applyTheme(themeId) {
  const theme = themes.find(t => t.id === themeId)
  if (!theme) return

  const root = document.documentElement

  root.style.setProperty('--theme-page-bg', theme.pageBackground)
  root.style.setProperty('--theme-header-gradient', theme.headerGradient)
  root.style.setProperty('--theme-header-shadow', theme.headerShadow)
  root.style.setProperty('--theme-bottom-active-color', theme.activeColor)
  root.style.setProperty('--theme-bottom-active-glow', theme.activeGlow)

  // 导航栏文字颜色（白色主题特殊处理：深色文字）
  if (theme.headerTextColor) {
    root.style.setProperty('--theme-header-text-color', theme.headerTextColor)
    root.style.setProperty('--theme-header-hover-bg', theme.headerHoverBg || 'rgba(0, 0, 0, 0.08)')
  } else {
    // 其他主题使用默认的白色文字
    root.style.setProperty('--theme-header-text-color', 'white')
    root.style.setProperty('--theme-header-hover-bg', 'rgba(255, 255, 255, 0.15)')
  }

  // 如果当前处于半透明/全透明模式，更新导航栏文字颜色为新主题色
  const currentMode = getNavMode()
  if (currentMode === NAV_MODES.TRANSLUCENT || currentMode === NAV_MODES.TRANSPARENT) {
    updateNavTextColor(root)
  }
}

/**
 * 获取当前保存的主题ID
 * @returns {string} 主题ID
 */
export function getSavedTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || 'default'
}

/**
 * 保存主题到 localStorage 并立即应用
 * @param {string} themeId - 主题ID
 */
export function saveAndApplyTheme(themeId) {
  localStorage.setItem(THEME_STORAGE_KEY, themeId)
  applyTheme(themeId)
}

/**
 * 初始化主题：从 localStorage 读取并应用（应用启动时调用）
 */
export function initTheme() {
  const savedTheme = getSavedTheme()
  applyTheme(savedTheme)
}

// ========== 导航栏样式模式 ==========

/**
 * 导航栏模式枚举
 */
export const NAV_MODES = {
  OPAQUE: 'opaque',      // 不透明（默认）
  TRANSLUCENT: 'translucent',  // 半透明（毛玻璃）
  TRANSPARENT: 'transparent'   // 全透明（伪透明，显示背景/壁纸）
}

/**
 * 获取当前导航栏模式
 * @returns {string} 导航栏模式
 */
export function getNavMode() {
  return localStorage.getItem(NAV_MODE_KEY) || NAV_MODES.OPAQUE
}

/**
 * 保存导航栏模式并立即应用
 * @param {string} mode - 导航栏模式 (opaque/translucent/transparent)
 */
export function saveNavMode(mode) {
  localStorage.setItem(NAV_MODE_KEY, mode)
  applyNavMode(mode)
}

/**
 * 应用导航栏模式样式
 * @param {string} mode - 导航栏模式
 */
export function applyNavMode(mode) {
  const root = document.documentElement
  const body = document.body

  // 移除所有模式 class
  body.classList.remove('nav-translucent', 'nav-transparent')

  if (mode === NAV_MODES.TRANSLUCENT) {
    // 半透明模式：毛玻璃效果
    body.classList.add('nav-translucent')
    updateNavTextColor(root)
  } else if (mode === NAV_MODES.TRANSPARENT) {
    // 全透明模式：伪透明（显示背景/壁纸）
    body.classList.add('nav-transparent')
    updateNavTextColor(root)
  } else {
    // 不透明模式：移除自定义颜色
    root.style.removeProperty('--nav-text-color')
  }
}

/**
 * 更新导航栏文字颜色为主题色
 */
function updateNavTextColor(root) {
  const themeColor = getComputedStyle(root).getPropertyValue('--theme-bottom-active-color').trim()
  root.style.setProperty('--nav-text-color', themeColor || '#88C4CC')
}

/**
 * 初始化导航栏模式：从 localStorage 读取并应用（应用启动时调用）
 */
export function initNavMode() {
  applyNavMode(getNavMode())
}
