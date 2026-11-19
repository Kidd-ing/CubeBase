<template>
  <div class="page-base theme-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">个性主题</h1>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <!-- 主界面壁纸入口卡片 -->
      <div class="entry-cards">
        <div class="entry-card" @click="goToWallpaperPage">
          <div class="entry-icon" style="background: #E8F0FE;">
            <ImageIcon :size="28" style="color: #165DFF;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">主界面壁纸</span>
            <span class="entry-desc">自定义应用背景壁纸</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>
      </div>

      <!-- 导航栏及卡片样式切换 -->
      <div class="nav-mode-section">
        <div class="theme-list-title">导航栏及卡片样式</div>
        <div class="nav-mode-bar">
          <button
            class="nav-mode-btn"
            :class="{ active: currentNavMode === NAV_MODES.OPAQUE }"
            @click="onNavModeChange(NAV_MODES.OPAQUE)"
          >不透明</button>
          <button
            class="nav-mode-btn"
            :class="{ active: currentNavMode === NAV_MODES.TRANSLUCENT }"
            @click="onNavModeChange(NAV_MODES.TRANSLUCENT)"
          >半透明</button>
          <button
            class="nav-mode-btn"
            :class="{ active: currentNavMode === NAV_MODES.TRANSPARENT }"
            @click="onNavModeChange(NAV_MODES.TRANSPARENT)"
          >全透明</button>
        </div>
      </div>

      <!-- 主题列表 -->
      <div class="theme-list-title">选择主题</div>
      <div class="theme-grid">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="theme-item"
          :class="{ active: currentTheme === theme.id }"
          @click="selectTheme(theme.id)"
        >
          <div class="theme-preview-mini">
            <div class="mini-header" :style="{ background: theme.headerGradient }"></div>
            <div class="mini-body" :style="{ background: theme.pageBackground }"></div>
            <div v-if="currentTheme === theme.id" class="check-badge">
              <Check :size="14" />
            </div>
          </div>
          <span class="theme-name">{{ theme.name }}</span>
        </div>
      </div>

      <div class="h-3 shrink-0"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Check, ChevronRight, ImageIcon } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { themes, getSavedTheme, saveAndApplyTheme, applyTheme, NAV_MODES, getNavMode, saveNavMode } from '@/utils/theme'

const router = useRouter()

const currentTheme = ref(getSavedTheme())
const currentNavMode = ref(getNavMode())

onMounted(() => {
  applyTheme(currentTheme.value)
})

function goBack() {
  router.replace('/settings')
}

function selectTheme(themeId) {
  currentTheme.value = themeId
  saveAndApplyTheme(themeId)
  ElMessage.success('主题已切换')
}

function goToWallpaperPage() {
  router.push('/settings/theme/wallpaper')
}

function onNavModeChange(mode) {
  currentNavMode.value = mode
  saveNavMode(mode)
}
</script>

<style scoped>
/* 个性主题页特有样式 */

/* 入口卡片（与设置页保持一致） */
.entry-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
}

.entry-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #FFFFFF;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.entry-card:active {
  background: #F5F7FA;
  transform: scale(0.98);
}

.entry-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.entry-info {
  flex: 1;
  margin-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.entry-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.entry-desc {
  font-size: 12px;
  color: #86909C;
}

.entry-arrow {
  color: #C0C4CC;
  flex-shrink: 0;
}

/* 主题列表样式 */
.theme-list-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
  padding: 0 16px;
  margin-top: 8px;
  margin-bottom: 12px;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 16px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-item:active {
  transform: scale(0.95);
}

.theme-preview-mini {
  position: relative;
  width: 100%;
  aspect-ratio: 0.75;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.theme-item.active .theme-preview-mini {
  border-color: var(--color-brand, #165DFF);
}

.mini-header {
  height: 35%;
  width: 100%;
}

.mini-body {
  height: 65%;
  width: 100%;
}

.check-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: var(--color-brand, #165DFF);
}

.theme-name {
  font-size: 12px;
  color: #4E5969;
  text-align: center;
}

/* 导航栏样式切换 */
.nav-mode-section {
  margin-top: 8px;
}

.nav-mode-bar {
  display: flex;
  background: #FFFFFF;
  border-radius: 10px;
  padding: 4px;
  margin: 0 16px;
}

.nav-mode-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #86909C;
  background: transparent;
  cursor: pointer;
  transition: all 0.25s;
}

.nav-mode-btn.active {
  color: var(--color-brand, #165DFF);
  background: var(--color-brand-light, #E8F3FF);
}
</style>
