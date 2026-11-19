<template>
  <div class="page-base theme-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">主界面壁纸</h1>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <div class="entry-cards">
        <!-- 当前壁纸状态（仅在有壁纸时显示） -->
        <div v-if="hasWallpaper" class="entry-card status-card">
          <div class="entry-icon" style="background: #E8F0FE;">
            <ImageIcon :size="28" style="color: #165DFF;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">当前壁纸</span>
            <span class="entry-desc">{{ wallpaperFileName }}</span>
          </div>
          <CheckCircle :size="20" style="color: #00B42A; flex-shrink: 0;" />
        </div>

        <!-- 选择图片卡片 -->
        <div class="entry-card" @click="selectImage">
          <div class="entry-icon" style="background: #E6F4FF;">
            <Upload :size="28" style="color: #165DFF;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">选择图片</span>
            <span class="entry-desc">从相册选择一张图片作为壁纸</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>

        <!-- 删除当前图片卡片（仅在有壁纸时显示） -->
        <div v-if="hasWallpaper" class="entry-card danger-card" @click="showDeleteDialog = true">
          <div class="entry-icon" style="background: #FFF1F0;">
            <Trash2 :size="28" style="color: #F53F3F;" />
          </div>
          <div class="entry-info">
            <span class="entry-title">删除当前图片</span>
            <span class="entry-desc">移除已设置的壁纸</span>
          </div>
          <ChevronRight :size="20" class="entry-arrow" />
        </div>
      </div>

      <!-- 隐藏的文件输入框 -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />

      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除壁纸"
      message="确定要删除当前壁纸吗？&#10;删除后将恢复默认背景。"
      confirm-text="删除"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Upload,
  Trash2,
  ChevronRight,
  ImageIcon,
  CheckCircle
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { saveWallpaper, getWallpaper, deleteWallpaper as removeWallpaper, hasWallpaper as checkHasWallpaper, getWallpaperInfo } from '@/utils/wallpaper'

const router = useRouter()
const fileInput = ref(null)
const hasWallpaper = ref(false)
const wallpaperFileName = ref('')
const showDeleteDialog = ref(false)

onMounted(async () => {
  await loadWallpaperInfo()
})

async function loadWallpaperInfo() {
  try {
    const exists = await checkHasWallpaper()
    hasWallpaper.value = exists

    if (exists) {
      // 从 IndexedDB 获取存储的原始文件名
      const info = await getWallpaperInfo()
      wallpaperFileName.value = info?.fileName || '已设置壁纸'
    }
  } catch (e) {
    console.error('加载壁纸信息失败:', e)
  }
}

function goBack() {
  router.replace('/settings/theme')
}

function selectImage() {
  fileInput.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  try {
    ElMessage.info('正在处理图片...')

    await saveWallpaper(file)

    wallpaperFileName.value = file.name || '已设置壁纸'
    await loadWallpaperInfo()

    ElMessage.success('壁纸设置成功')

    window.__refreshWallpaper?.()
  } catch (e) {
    console.error('保存壁纸失败:', e)
    ElMessage.error(e.message || '保存壁纸失败')
  }

  event.target.value = ''
}

async function handleDeleteConfirm() {
  try {
    await removeWallpaper()

    wallpaperFileName.value = ''
    await loadWallpaperInfo()

    ElMessage.success('壁纸已删除')

    window.__refreshWallpaper?.()
  } catch (e) {
    console.error('删除壁纸失败:', e)
    ElMessage.error(e.message || '删除壁纸失败')
  }
}
</script>

<style scoped>
/* 壁纸页特有样式 */

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

.status-card {
  background: #F8FBFF;
}

.danger-card:hover {
  border-color: #F53F3F;
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
  min-width: 0;
}

.entry-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.entry-desc {
  font-size: 12px;
  color: #86909C;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-arrow {
  color: #C0C4CC;
  flex-shrink: 0;
}
</style>
