<template>
  <div class="page-base settingsletter-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">字母图片映射</h1>
        <div class="page-actions">
          <div class="letter-menu" ref="menuRef">
            <button class="letter-menu-btn" @click="showMenu = !showMenu">
              <MoreVertical :size="24" />
            </button>
            <div v-if="showMenu" class="letter-menu-dropdown">
              <button class="menu-item menu-item-checked" @click="selectMode('2x2')">
                <span>二阶</span>
                <Check v-if="localSelectedMode === '2x2'" :size="16" />
              </button>
              <button class="menu-item menu-item-checked" @click="selectMode('3x3')">
                <span>三阶</span>
                <Check v-if="localSelectedMode === '3x3'" :size="16" />
              </button>
              <button class="menu-item menu-item-checked" @click="selectMode('4x4')">
                <span>四阶</span>
                <Check v-if="localSelectedMode === '4x4'" :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <!-- 切换标签 -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'builtin' }"
          @click="activeTab = 'builtin'"
        >内置映射</button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'custom' }"
          @click="activeTab = 'custom'"
        >自定义映射</button>
      </div>

      <!-- 内置映射页面 -->
      <div v-if="activeTab === 'builtin'" class="tab-content">
        <div class="letter-grid">
          <div 
            v-for="letter in allLetters" 
            :key="'builtin-' + letter"
            class="letter-item"
            @click="openBuiltinPreview(letter)"
          >
            <div class="letter-preview">
              <img :src="getBuiltinImageSrc(letter)" />
            </div>
            <span class="letter-label">{{ letter }}</span>
          </div>
        </div>
      </div>

      <!-- 自定义映射页面（原有内容） -->
      <div v-else class="tab-content">
      <div class="letter-grid">
        <div 
          v-for="letter in allLetters" 
          :key="letter"
          class="letter-item"
          @click="openImageEditor(letter)"
        >
          <div class="letter-preview">
            <img v-if="letterImageMap[letter]" :src="letterImageMap[letter]" />
            <span v-else class="letter-char">{{ letter }}</span>
          </div>
          <span class="letter-label">{{ letter }}</span>
        </div>
      </div>
      </div>
      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 字母图片编辑弹窗 -->
    <EditDialog
      v-model="showImageEditor"
      :title="`编辑字母 ${editingLetter}`"
      @submit="saveLetterImage"
    >
      <div class="image-editor">
        <div class="preview-area">
          <img v-if="currentImage" :src="currentImage" class="preview-img" />
          <div v-else class="preview-placeholder">
            <span class="text-4xl font-bold text-gray-300">{{ editingLetter }}</span>
          </div>
        </div>
        <div class="image-actions">
          <button class="image-btn" @click="triggerFileInput">
            <ImageIcon :size="16" />
            <span>选择图片</span>
          </button>
          <button v-if="currentImage" class="image-btn danger" @click="currentImage = ''">
            <Trash :size="16" />
            <span>删除图片</span>
          </button>
        </div>
        <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileSelect" />
      </div>
    </EditDialog>

    <!-- 内置映射预览弹窗 -->
    <EditDialog
      v-model="showBuiltinPreview"
      :title="`内置字母 ${previewingLetter}`"
      show-only-close
    >
      <div class="image-editor">
        <div class="preview-area">
          <img v-if="previewingLetter" :src="getBuiltinImageSrc(previewingLetter)" class="preview-img" />
        </div>
      </div>
    </EditDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Image as ImageIcon, Trash, MoreVertical, Check } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useSettingStore } from '@/stores/settingStore'
import { useCubeModeStore } from '@/stores/cubeModeStore'
import { getModeLetters } from '@/config/cubeModes'
import { handleImageUpload } from '@/utils/imageHandler'
import EditDialog from '@/components/EditDialog.vue'

const router = useRouter()
const settingStore = useSettingStore()
const cubeModeStore = useCubeModeStore()

// 三点菜单相关
const showMenu = ref(false)
const menuRef = ref(null)
// 本地选中模式：打开页面时与首页（cubeModeStore）联动，但本页面切换不影响首页
const localSelectedMode = ref(cubeModeStore.currentMode)

function selectMode(mode) {
  localSelectedMode.value = mode
  showMenu.value = false
}

function closeMenuOnClickOutside(e) {
  if (!showMenu.value) return
  const menuEl = e.target.closest('.letter-menu')
  if (!menuEl) {
    showMenu.value = false
  }
}

// 当前激活的标签页
const activeTab = ref('builtin')

// 所有字母成员（配置驱动，直接按模式查找）
const allLetters = computed(() => getModeLetters(localSelectedMode.value))

const letterImageMap = computed(() => settingStore.getLetterImageMap(localSelectedMode.value))

const showImageEditor = ref(false)
const editingLetter = ref('')
const currentImage = ref('')
const fileInput = ref(null)

// 内置映射预览弹窗
const showBuiltinPreview = ref(false)
const previewingLetter = ref('')

// 小写字母成员（文件名需加"双层"后缀）
const lowercaseLetters = ['r', 'l', 'u', 'd', 'f', 'b']

// 获取内置字母对应的 SVG 图片 URL（路径根据当前选中模式动态选择 2×2/3×3/4×4 文件夹）
function getBuiltinImageSrc(letter) {
  const baseName = lowercaseLetters.includes(letter[0]) ? letter + '双层' : letter
  const modeFolder = localSelectedMode.value.replace('x', '×')
  return new URL(`../assets/images/members/${modeFolder}/${baseName}.svg`, import.meta.url).href
}

onMounted(async () => {
  await settingStore.fetchLetterImages()
  // 同步首页当前模式作为本地初始选中
  localSelectedMode.value = cubeModeStore.currentMode
  document.addEventListener('click', closeMenuOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})

function goBack() {
  router.replace('/settings')
}

function openImageEditor(letter) {
  editingLetter.value = letter
  currentImage.value = letterImageMap.value[letter] || ''
  showImageEditor.value = true
}

function openBuiltinPreview(letter) {
  previewingLetter.value = letter
  showBuiltinPreview.value = true
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const result = await handleImageUpload(file)
    currentImage.value = result.image
  } catch (err) {
    ElMessage.error('图片处理失败')
  }
}

async function saveLetterImage() {
  try {
    await settingStore.setLetterImage(editingLetter.value, currentImage.value, localSelectedMode.value)
    ElMessage.success('保存成功')
    showImageEditor.value = false
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}
</script>

<style scoped>
/* 字母图片映射页特有样式（统一样式已提取到 index.css） */

/* ======== 顶部三点菜单（复用首页样式）======= */
.letter-menu {
  position: relative;
}

.letter-menu-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-header-text-color, white);
  cursor: pointer;
  transition: all 0.2s;
}

.letter-menu-btn:hover {
  opacity: 0.8;
}

.letter-menu-btn:active {
  transform: scale(0.9);
  opacity: 0.6;
}

.letter-menu-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: #FFFFFF;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 6px 0;
  min-width: 130px;
  z-index: 100;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  color: #1D2129;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.menu-item:hover {
  background: #F5F7FA;
}

.menu-item:active {
  background: #E5E6EB;
}

.menu-item-checked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* ======== 功能内容（保持原有不变）======= */

.tab-bar {
  display: flex;
  background: #FFFFFF;
  border-radius: 10px;
  padding: 4px;
  margin: 16px;
}

.tab-btn {
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

.tab-btn.active {
  color: #165DFF;
  background: #E8F3FF;
}

.tab-content {
  padding-top: 4px;
}

.letter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 16px;
}

.letter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.letter-preview {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #F5F7FA;
}

.letter-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.letter-char {
  font-size: 14px;
  font-weight: 600;
  color: #165DFF;
}

.letter-label {
  font-size: 10px;
  color: #606266;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-area {
  width: 100%;
  aspect-ratio: 1;
  border: 1px dashed #DCDFE6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #F5F7FA;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-actions {
  display: flex;
  gap: 12px;
}

.image-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.image-btn.danger {
  color: #F53F3F;
  border-color: #F53F3F;
}

.image-btn:active {
  background: #F5F7FA;
}
</style>
