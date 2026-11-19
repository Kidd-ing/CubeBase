<template>
  <div class="page-base settings-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <h1 class="page-title">设置</h1>
        <div class="settings-placeholder-btn" aria-hidden="true"></div>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container-with-bottom-nav flex-1 overflow-auto pb-safe">
      <div class="entry-cards">
        <div class="entry-card" @click="goToLetter">
          <div class="entry-icon" style="background: #E8F0FE;">
            <ImageIcon :size="28" style="color: #165DFF;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">字母图片映射</span>
            <span class="entry-desc">为魔方公式字母设置图片</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>

        <div class="entry-card" @click="goToData">
          <div class="entry-icon" style="background: #F0FDF4;">
            <DatabaseIcon :size="28" style="color: #00B42A;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">数据管理</span>
            <span class="entry-desc">导出、导入或重置数据</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>

        <div class="entry-card" @click="goToTheme">
          <div class="entry-icon" style="background: #FFFBE6;">
            <Shirt :size="28" style="color: #FF7D00;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">个性主题</span>
            <span class="entry-desc">自定义应用外观样式</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>

        <div class="entry-card" @click="goToAbout">
          <div class="entry-icon" style="background: #FFF7F7;">
            <Info :size="28" style="color: #F53F3F;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">关于</span>
            <span class="entry-desc">应用信息与版本</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>
      </div>
      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 底部导航栏 -->
    <div class="page-bottom-nav">
      <div class="page-bottom-item" @click="goToHome">
        <Home :size="24" />
        <span>首页</span>
      </div>
      <div class="page-bottom-item page-bottom-active">
        <Settings :size="24" />
        <span>设置</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Home, Settings, Image as ImageIcon, Database as DatabaseIcon, Info, ChevronRight, Shirt } from 'lucide-vue-next'

const router = useRouter()

function goToHome() {
  router.push('/')
}

function goToLetter() {
  router.push('/settings/letter')
}

function goToData() {
  router.push('/settings/data')
}

function goToTheme() {
  router.push('/settings/theme')
}

function goToAbout() {
  router.push('/settings/about')
}
</script>

<style scoped>
/* 设置页特有样式（统一样式已提取到 index.css） */

/* 占位按钮（设置页特有） */
.settings-placeholder-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

/* ======== 入口卡片（保持原有功能不变）======= */
.entry-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
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
</style>
