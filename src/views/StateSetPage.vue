<template>
  <div class="page-base stateset-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="handleBack">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="page-title">{{ currentSet?.name || '状态集' }}</h1>
        <div class="page-actions">
          <button v-if="!isMultiSelectMode" class="page-action-btn" @click="openAddDialog">
            <Plus :size="24" />
          </button>
          <div v-if="!isMultiSelectMode" class="stateset-menu" ref="menuRef">
            <button class="stateset-menu-btn" @click="showMenu = !showMenu">
              <MoreVertical :size="24" />
            </button>
            <div v-if="showMenu" class="stateset-menu-dropdown">
              <button class="menu-item" @click="enterMultiSelect">
                多选操作
              </button>
              <button class="menu-item" @click="showTipDialog = true; showMenu = false">
                提示信息
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 多选模式工具栏 -->
    <!-- 与导航栏同级、位于滚动容器 .page-content 之外，自身 sticky 且偏移到导航栏下方：
     * 不随信息流滚动，也不进入导航栏的文档流，因此不影响导航栏的高度与圆角形状 -->
    <div v-if="isMultiSelectMode" class="multi-select-bar">
      <button class="cancel-btn" @click="cancelMultiSelect">
        <X :size="16" />
        <span>取消</span>
      </button>
      <button class="select-all-btn" @click="selectAllStates">
        <CheckSquare :size="16" />
        <span>全选</span>
      </button>
      <span class="selected-count">已选择 {{ selectedStates.length }} 项</span>
      <div class="flex gap-3">
        <button 
          v-if="currentSet?.type === 'custom' || currentSet?.type === 'builtIn'"
          class="action-text-btn"
          :disabled="selectedStates.length === 0"
          @click="openAddToSetDialog"
        >
          添加到
        </button>
        <button 
          v-if="currentSet?.type === 'custom'"
          class="action-text-btn warning"
          :disabled="selectedStates.length === 0"
          @click="handleRemove"
        >
          移除
        </button>
        <button 
          v-if="currentSet?.type === 'custom'"
          class="action-text-btn danger"
          :disabled="selectedStates.length === 0"
          @click="handleDelete"
        >
          删除
        </button>
        <button 
          v-if="currentSet?.type === 'builtIn'"
          class="action-text-btn danger"
          :disabled="selectedStates.length === 0"
          @click="handleDelete"
        >
          删除
        </button>
      </div>
    </div>

    <div ref="scrollContainer" class="page-content page-container flex-1 overflow-auto pb-safe"
      @scroll="handleScroll"
      @click="handlePageAreaClick"
      @touchstart.passive="handlePageAreaTouch"
    >

    <div v-if="stateStore.loading" class="flex items-center justify-center h-40">
        <el-icon class="is-loading text-brand text-2xl"><Loader /></el-icon>
      </div>

      <draggable
        v-else-if="states.length > 0"
        v-model="sortedStates"
        item-key="id"
        handle=".drag-handle"
        :animation="200"
        @start="isDragging = true"
        @end="handleDragEnd"
        class="space-y-3"
      >
        <template #item="{ element }">
          <StateCard
            :state="element"
            :selected="selectedStates.includes(element.id)"
            :show-checkbox="isMultiSelectMode"
            :show-actions="!isMultiSelectMode"
            :is-built-in-set="currentSet?.type === 'builtIn'"
            :has-mastered="hasMasteredFormula(element.id)"
            @click="handleStateClick(element)"
            @edit="openEditDialog(element)"
            @delete="confirmDelete(element)"
            @remove="confirmRemoveSingle(element)"
            @toggle-select="toggleSelect(element)"
            @longpress="toggleSelect(element)"
            @add-to-sets="openAddToSetsDialog(element)"
          />
        </template>
      </draggable>

      <div v-if="!stateStore.loading && states.length === 0" 
           class="text-center text-hint mt-20">
        暂无状态，点击右上角添加
      </div>
      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 添加状态弹窗 -->
    <EditDialog
      v-model="showAddDialog"
      title="添加状态"
      @submit="handleAdd"
    >
      <el-form label-position="top">
        <el-form-item label="状态名称" required>
          <el-input v-model="formData.name" placeholder="请输入状态名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="状态描述">
          <el-input v-model="formData.desc" type="textarea" placeholder="请输入描述" maxlength="200" :rows="2" />
        </el-form-item>
        <el-form-item label="状态图例">
          <div class="image-upload-area" @click="triggerImageUpload">
            <img v-if="formData.image" :src="formData.image" class="preview-image" />
            <div v-else class="upload-placeholder">
              <Upload :size="32" class="text-hint" />
              <span class="text-hint text-sm">点击上传图片</span>
            </div>
          </div>
          <input type="file" ref="imageInput" accept="image/*" class="hidden" @change="handleImageChange" />
          <div class="button-row">
            <el-button type="primary" size="small" @click="openLegendDialog('add')">
              手动构造状态图例
            </el-button>
            <el-button v-if="formData.image" type="danger" size="small" @click="formData.image = ''">
              删除图片
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </EditDialog>

    <!-- 编辑状态弹窗 -->
    <EditDialog
      v-model="showEditDialog"
      title="编辑状态"
      @submit="handleUpdate"
    >
      <el-form label-position="top">
        <el-form-item label="状态名称" required>
          <el-input v-model="editFormData.name" placeholder="请输入状态名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="状态描述">
          <el-input v-model="editFormData.desc" type="textarea" placeholder="请输入描述" maxlength="200" :rows="2" />
        </el-form-item>
        <el-form-item label="状态图例">
          <div class="image-upload-area" @click="triggerEditImageUpload">
            <img v-if="editFormData.image" :src="editFormData.image" class="preview-image" />
            <div v-else class="upload-placeholder">
              <Upload :size="32" class="text-hint" />
              <span class="text-hint text-sm">点击上传图片</span>
            </div>
          </div>
          <input type="file" ref="editImageInput" accept="image/*" class="hidden" @change="handleEditImageChange" />
          <div class="button-row">
            <el-button type="primary" size="small" @click="openLegendDialog('edit')">
              手动构造状态图例
            </el-button>
            <el-button v-if="editFormData.image" type="danger" size="small" @click="editFormData.image = ''">
              删除图片
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </EditDialog>

    <!-- 手动构造状态图例弹窗 -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="showLegendDialog" class="legend-dialog-overlay" @click.self="showLegendDialog = false">
          <div class="dialog-status-bar-shade"></div>
          <Transition name="dialog-scale">
            <div v-if="showLegendDialog" class="legend-dialog-container">
              <!-- 标题栏 -->
              <div class="legend-dialog-header">
                <span class="legend-dialog-title">手动构造状态图例</span>
                <button class="legend-dialog-close" @click="showLegendDialog = false">
                  <X :size="20" />
                </button>
              </div>
              
              <!-- 内容区域 -->
              <div class="legend-dialog-content">
                <div class="legend-container">
                  <!-- 模板选择器 -->
                  <div class="template-selector">
                    <button
                      v-for="tmpl in legendTemplates"
                      :key="tmpl.id"
                      class="template-btn"
                      :class="{ active: currentLegendTemplate === tmpl.id }"
                      @click="switchLegendTemplate(tmpl.id)"
                    >
                      {{ tmpl.name }}
                    </button>
                  </div>
                  <div class="svg-wrapper" v-html="legendSvgContent" @click="handleSvgClick"></div>
                  <div class="color-buttons">
                    <div class="color-btn-wrapper">
                      <button
                        v-for="color in legendColors"
                        :key="color.value"
                        class="color-btn"
                        :class="{ active: selectedLegendColor === color.value }"
                        :style="{ backgroundColor: color.value }"
                        @click="handleColorClick(color.value)"
                      >
                        <span class="color-label" :style="{ color: getLabelColor(color.value) }">{{ color.name }}</span>
                      </button>
                      <button
                        class="color-btn clear-btn"
                        @click="resetLegendToDefault"
                        title="重置为初始状态"
                      >
                        <span>重置</span>
                      </button>
                    </div>
                    <div class="mode-hint">
                      <span v-if="!selectedLegendColor" class="text-hint text-sm">选贴纸模式：点击贴纸选中，再点击颜色上色</span>
                      <span v-else class="text-info text-sm">涂色模式：点击贴纸直接上色，再点当前颜色退出</span>
                    </div>
                  </div>
                  <!-- 箭头工具区：仅三阶顶层视角显示 -->
                  <div
                    v-if="cubeModeStore.currentMode === '3x3' && currentLegendTemplate === 'top'"
                    class="arrow-tools"
                  >
                    <div class="arrow-btn-wrapper">
                      <button
                        class="arrow-btn"
                        :class="{ active: arrowMode === 'single' }"
                        @click="setArrowMode('single')"
                      >
                        <ArrowRight :size="18" />
                        <span>单向箭头</span>
                      </button>
                      <button
                        class="arrow-btn"
                        :class="{ active: arrowMode === 'double' }"
                        @click="setArrowMode('double')"
                      >
                        <ArrowRightLeft :size="18" />
                        <span>双向箭头</span>
                      </button>
                      <button
                        class="arrow-btn delete"
                        :class="{ active: arrowMode === 'delete' }"
                        @click="setArrowMode('delete')"
                      >
                        <Trash2 :size="18" />
                        <span>删除箭头</span>
                      </button>
                      <button
                        class="arrow-btn clear"
                        @click="clearAllArrows"
                      >
                        <Eraser :size="18" />
                        <span>清空箭头</span>
                      </button>
                    </div>
                    <div class="mode-hint">
                      <span v-if="arrowMode === 'single'" class="text-info text-sm">单向箭头：依次点击起始、结束贴纸</span>
                      <span v-else-if="arrowMode === 'double'" class="text-info text-sm">双向箭头：依次点击起始、结束贴纸</span>
                      <span v-else-if="arrowMode === 'delete'" class="text-info text-sm">删除箭头：依次点击该箭头的两个端点贴纸（顺序任意）</span>
                      <span v-else class="text-hint text-sm">点击上方按钮进入箭头编辑模式</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 底部按钮 -->
              <div class="legend-dialog-footer">
                <button class="legend-dialog-btn cancel-btn" @click="showLegendDialog = false">取消</button>
                <button class="legend-dialog-btn confirm-btn" @click="confirmLegendSvg">确认</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- 添加到其他状态集弹窗 -->
    <EditDialog
      v-model="showAddToSetDialog"
      :title="`添加到其他状态集${addingStateName ? ' - ' + addingStateName : ''}`"
      @submit="confirmAddToSets"
    >
      <div class="set-list">
        <div
          v-for="set in selectableSets"
          :key="set.id"
          class="set-item selectable"
          :class="{ selected: selectedTargetSets.includes(set.id) }"
          @click="toggleTargetSet(set.id)"
        >
          <div class="set-checkbox" :class="{ checked: selectedTargetSets.includes(set.id) }">
            <Check v-if="selectedTargetSets.includes(set.id)" :size="14" />
          </div>
          <span class="set-name">{{ set.name }}</span>
          <span v-if="set.type === 'builtIn'" class="built-in-badge">全部状态</span>
        </div>
        <div v-if="selectableSets.length === 0" class="text-center text-hint py-4">
          没有可用的状态集
        </div>
      </div>
    </EditDialog>

    <!-- 移除确认弹窗 -->
    <ConfirmDialog
      v-model="showRemoveDialog"
      title="移除状态"
      :message="'确定要将选中状态从此状态集中移除吗？\n状态本身不会被删除。'"
      confirm-text="移除"
      @confirm="confirmRemove"
    />

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除状态"
      :message="'确定要删除选中状态吗？\n此操作不可恢复。'"
      confirm-text="删除"
      @confirm="confirmDeleteStates"
    />

    <!-- 选择操作弹窗 -->
    <ChoiceDialog
      v-model="showChoiceDialog"
      title="选择操作"
      :options="choiceOptions"
      @confirm="handleChoiceConfirm"
    />

    <!-- 提示信息弹窗 -->
    <ConfirmDialog
      v-model="showTipDialog"
      title="提示信息"
      message="左滑状态卡片可编辑、删除状态，&#10;或将状态添加到其他状态集&#10;长按可进入多选模式"
      confirm-text="关闭"
      :show-cancel="false"
      @confirm="showTipDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, X, Upload, Loader, Plus, ChevronRight, Check, MoreVertical, CheckSquare, ArrowRight, ArrowRightLeft, Trash2, Eraser } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { useSetStore } from '@/stores/setStore'
import { useStateStore } from '@/stores/stateStore'
import { useFormulaStore } from '@/stores/formulaStore'
import { useDialogStore } from '@/stores/dialogStore'
import { useCubeModeStore } from '@/stores/cubeModeStore'
import StateCard from '@/components/StateCard.vue'
import EditDialog from '@/components/EditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ChoiceDialog from '@/components/ChoiceDialog.vue'
import { handleImageUpload } from '@/utils/imageHandler'
import { setStatusBarForDialog } from '@/utils/statusBar'
import { saveScrollPosition, getScrollPosition, clearScrollPosition, PAGE_KEYS } from '@/utils/scrollPosition'
import swipeMutex from '@/utils/swipeMutex.js'
import rubikCubeSvg2x2Raw from '@/assets/images/legend-templates/2×2/2x2-global.svg?raw'
import topViewSvg2x2Raw from '@/assets/images/legend-templates/2×2/2x2-top.svg?raw'
import rubikCubeSvg4x4Raw from '@/assets/images/legend-templates/4×4/4x4-global.svg?raw'
import topViewSvg4x4Raw from '@/assets/images/legend-templates/4×4/4x4-top.svg?raw'
// 调试开关（true开启日志，false关闭日志）
const DEBUG_ENABLE = false

const route = useRoute()
const router = useRouter()
const setStore = useSetStore()
const stateStore = useStateStore()
const formulaStore = useFormulaStore()
const dialogStore = useDialogStore()
const cubeModeStore = useCubeModeStore()

// 滚动容器引用
const scrollContainer = ref(null)

const setId = computed(() => Number(route.params.id))
const currentSet = computed(() => setStore.sets.find(s => s.id === setId.value))
const moduleId = computed(() => currentSet.value?.moduleId)

// 获取当前模块的"全部状态"状态集ID
const allStatesSetId = computed(() => {
  if (!moduleId.value) return null
  const allStatesSet = setStore.sets.find(s => s.moduleId === moduleId.value && s.type === 'builtIn')
  return allStatesSet?.id || null
})

// 当前状态集关联的所有状态（按 sort 排序）
const states = computed(() => {
  const rels = stateStore.stateSetRels
    .filter(r => r.setId === setId.value)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
  
  return rels.map(rel => {
    const state = stateStore.statesWithSets.find(s => s.id === rel.stateId)
    return state || null
  }).filter(Boolean)
})

// 可排序的状态列表（用于 draggable）
const sortedStates = ref([])
const isDragging = ref(false)

watch(states, (newStates) => {
  if (!isDragging.value) {
    sortedStates.value = [...newStates]
  }
}, { immediate: true })

// 判断状态是否有已掌握的公式
function hasMasteredFormula(stateId) {
  return formulaStore.formulas.some(f => f.stateId === stateId && f.mastered && !f.isScramble)
}

async function handleDragEnd() {
  isDragging.value = false
  await stateStore.updateStateSetRelSort(setId.value, sortedStates.value)
  ElMessage.success('排序已保存')
}

// 可添加到其他状态集列表（同一模块内，不包含该状态的状态集）
const selectableSets = computed(() => {
  if (!moduleId.value) return []
  
  // 单选模式：使用 addingStateId 筛选
  if (addingStateId.value) {
    return setStore.sets.filter(s => 
      s.id !== setId.value && 
      s.moduleId === moduleId.value &&
      !stateStore.stateSetRels.some(r => r.setId === s.id && r.stateId === addingStateId.value)
    )
  }
  
  // 多选模式：筛选出"不包含任何被选中状态"的状态集
  if (selectedStates.value.length > 0) {
    return setStore.sets.filter(s => {
      if (s.id === setId.value || s.moduleId !== moduleId.value) return false
      // 检查该状态集是否包含任何一个被选中的状态
      return !selectedStates.value.some(stateId => 
        stateStore.stateSetRels.some(r => r.setId === s.id && r.stateId === stateId)
      )
    })
  }
  
  return []
})

const isMultiSelectMode = ref(false)
const selectedStates = ref([])
const showMenu = ref(false)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showRemoveDialog = ref(false)
const showDeleteDialog = ref(false)
const showChoiceDialog = ref(false)
const showTipDialog = ref(false)
const showAddToSetDialog = ref(false)
const showLegendDialog = ref(false)
let legendCloseCallback = null
watch(showLegendDialog, (val) => {
  setStatusBarForDialog(val)
  if (val) {
    legendCloseCallback = () => { showLegendDialog.value = false }
    dialogStore.push(legendCloseCallback)
    document.body.classList.add('dialog-open')
  } else if (legendCloseCallback) {
    dialogStore.remove(legendCloseCallback)
    legendCloseCallback = null
    document.body.classList.remove('dialog-open')
  }
})

// 监听确认弹窗关闭时清除临时选中状态
watch([showDeleteDialog, showRemoveDialog, showChoiceDialog], (/* newVals */) => {
  // 任一弹窗关闭且非多选模式时，清空临时选中的状态
  if (!isMultiSelectMode.value && !showDeleteDialog.value && !showRemoveDialog.value && !showChoiceDialog.value) {
    selectedStates.value = []
  }
})
const addingStateId = ref(null)
const addingStateName = ref('')
const selectedTargetSets = ref([])
const choiceOptions = [
  {
    value: 'remove',
    title: '从当前集移除',
    desc: '仅删除关联，状态保留在其他状态集中',
    danger: false
  },
  {
    value: 'delete',
    title: '删除状态',
    desc: '彻底删除状态实体，此操作不可恢复',
    danger: true
  }
]
const imageInput = ref(null)
const editImageInput = ref(null)
const editingState = ref(null)

const formData = ref({
  name: '',
  desc: '',
  image: '',
  imageType: ''
})

const editFormData = ref({
  name: '',
  desc: '',
  image: '',
  imageType: ''
})

onMounted(async () => {
  await setStore.ensureFetched()
  await stateStore.ensureFetched()

  // 点击外部关闭菜单
  document.addEventListener('click', closeMenuOnClickOutside)

  // 注册自定义返回键处理（优先级高于全局路由跳转）
  window.__customBackHandler = () => {
    if (showMenu.value) {
      showMenu.value = false
      return true // 已处理，阻止默认返回
    }
    if (isMultiSelectMode.value) {
      cancelMultiSelect()
      return true
    }
    return false // 未处理，交给默认逻辑
  }
  
  // 恢复滚动位置（使用 window.scrollTo）
  nextTick(() => {
    const savedScrollTop = getScrollPosition(PAGE_KEYS.SET, setId.value)
    if (savedScrollTop > 0) {
      window.scrollTo({ top: savedScrollTop, behavior: 'instant' })
      DEBUG_ENABLE && console.log(`[StateSetPage] 恢复滚动位置: ${savedScrollTop}`)
    } else {
      // 没有保存的位置，确保从顶部开始
      window.scrollTo({ top: 0, behavior: 'instant' })
      DEBUG_ENABLE && console.log(`[StateSetPage] 从顶部开始显示`)
    }
  })
})

// 监听滚动事件
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
  DEBUG_ENABLE && console.log(`[StateSetPage] 当前滚动位置: ${scrollTop}`)
}

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
  window.__customBackHandler = null
})

function closeMenuOnClickOutside(e) {
  if (!showMenu.value) return
  const menuEl = e.target.closest('.stateset-menu')
  if (!menuEl) {
    showMenu.value = false
  }
}

// 返回到上一级页面（模块页面）
function handleBack() {
  if (moduleId.value) {
    router.replace(`/module/${moduleId.value}`)
  } else {
    router.replace('/')
  }
}

function handlePageAreaClick() {
  swipeMutex.closeAny()
}

function handlePageAreaTouch() {
  swipeMutex.closeAny()
}

function openAddDialog() {
  formData.value = { name: '', desc: '', image: '', imageType: '' }
  showAddDialog.value = true
}

function handleStateClick(state) {
  if (isMultiSelectMode.value) {
    toggleSelect(state)
  } else {
    // 记录当前滚动位置（使用 window.scrollY 获取页面级滚动位置）
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
    saveScrollPosition(PAGE_KEYS.SET, setId.value, scrollTop)
    DEBUG_ENABLE && console.log(`[StateSetPage] 进入状态详情页，记录滚动位置: ${scrollTop}`)
    
    // 清除状态详情页的滚动位置记录，确保进入时从顶部显示
    clearScrollPosition(PAGE_KEYS.STATE_DETAIL, state.id)
    DEBUG_ENABLE && console.log(`[StateSetPage] 清除状态详情页 ${state.id} 的滚动位置记录`)
    
    router.push(`/state/${state.id}?setId=${setId.value}&moduleId=${moduleId.value}`)
  }
}

function toggleSelect(state) {
  isMultiSelectMode.value = true
  
  const idx = selectedStates.value.indexOf(state.id)
  if (idx === -1) {
    selectedStates.value.push(state.id)
  } else {
    selectedStates.value.splice(idx, 1)
    if (selectedStates.value.length === 0) {
      isMultiSelectMode.value = false
    }
  }
}

function enterMultiSelect() {
  // 进入多选模式前先收回所有左滑展开的卡片
  swipeMutex.closeAny()
  isMultiSelectMode.value = true
  selectedStates.value = []
  showMenu.value = false
}

function cancelMultiSelect() {
  isMultiSelectMode.value = false
  selectedStates.value = []
}

function selectAllStates() {
  // 获取当前状态集的所有状态 ID
  const allStateIds = states.value.map(state => state.id)
  selectedStates.value = [...allStateIds]
}

function triggerImageUpload() {
  imageInput.value?.click()
}

function triggerEditImageUpload() {
  editImageInput.value?.click()
}

async function handleImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const result = await handleImageUpload(file)
    formData.value.image = result.image
    formData.value.imageType = result.imageType
  } catch (err) {
    ElMessage.error('图片处理失败')
  }
}

async function handleEditImageChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const result = await handleImageUpload(file)
    editFormData.value.image = result.image
    editFormData.value.imageType = result.imageType
  } catch (err) {
    ElMessage.error('图片处理失败')
  }
}

async function handleAdd() {
  if (!formData.value.name.trim()) {
    ElMessage.warning('请输入状态名称')
    return
  }
  try {
    const stateId = await stateStore.addState(formData.value, moduleId.value)
    
    // 同时关联到当前状态集
    await stateStore.addStateToSet(stateId, setId.value)
    
    // 如果当前不是"全部状态"，也需要关联到"全部状态"
    if (currentSet.value?.type !== 'builtIn' && allStatesSetId.value) {
      await stateStore.addStateToSet(stateId, allStatesSetId.value)
    }
    
    ElMessage.success('添加成功')
    showAddDialog.value = false
    formData.value = { name: '', desc: '', image: '', imageType: '' }
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

function openEditDialog(state) {
  editingState.value = state
  editFormData.value = {
    name: state.name,
    desc: state.desc || '',
    image: state.image || '',
    imageType: state.imageType || ''
  }
  showEditDialog.value = true
}

async function handleUpdate() {
  if (!editFormData.value.name.trim()) {
    ElMessage.warning('请输入状态名称')
    return
  }
  try {
    await stateStore.updateState(editingState.value.id, {
      name: editFormData.value.name,
      desc: editFormData.value.desc,
      image: editFormData.value.image,
      imageType: editFormData.value.imageType
    }, moduleId.value)
    ElMessage.success('更新成功')
    showEditDialog.value = false
  } catch (e) {
    ElMessage.error(e.message || '更新失败')
  }
}

function confirmDelete(state) {
  selectedStates.value = [state.id]
  showDeleteDialog.value = true
}

function confirmRemoveSingle(state) {
  selectedStates.value = [state.id]
  showChoiceDialog.value = true
}

async function handleChoiceConfirm(action) {
  if (action === 'remove') {
    try {
      await stateStore.removeStatesFromSet(selectedStates.value, setId.value)
      ElMessage.success('移除成功')
    } catch (e) {
      ElMessage.error(e.message || '移除失败')
    }
  } else if (action === 'delete') {
    try {
      await stateStore.deleteStates(selectedStates.value)
      ElMessage.success('删除成功')
    } catch (e) {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

function handleRemove() {
  showRemoveDialog.value = true
}

async function confirmRemove() {
  try {
    await stateStore.removeStatesFromSet(selectedStates.value, setId.value)
    ElMessage.success('移除成功')
    cancelMultiSelect()
  } catch (e) {
    ElMessage.error(e.message || '移除失败')
  }
}

function handleDelete() {
  showDeleteDialog.value = true
}

async function confirmDeleteStates() {
  try {
    await stateStore.deleteStates(selectedStates.value)
    ElMessage.success('删除成功')
    cancelMultiSelect()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

function openAddToSetDialog() {
  // 多选模式下批量添加
  addingStateId.value = null
  addingStateName.value = ''
  selectedTargetSets.value = []
  showAddToSetDialog.value = true
}

function openAddToSetsDialog(state) {
  // 单个状态添加到其他状态集
  addingStateId.value = state.id
  addingStateName.value = state.name
  selectedTargetSets.value = []
  showAddToSetDialog.value = true
}

function toggleTargetSet(setId) {
  const idx = selectedTargetSets.value.indexOf(setId)
  if (idx === -1) {
    selectedTargetSets.value.push(setId)
  } else {
    selectedTargetSets.value.splice(idx, 1)
  }
}

async function confirmAddToSets() {
  try {
    // 确定要添加到的状态ID列表
    const stateIds = addingStateId.value 
      ? [addingStateId.value] 
      : selectedStates.value
    
    // 添加到每个选中的状态集
    for (const stateId of stateIds) {
      for (const targetSetId of selectedTargetSets.value) {
        const exists = stateStore.stateSetRels.some(
          r => r.stateId === stateId && r.setId === targetSetId
        )
        if (!exists) {
          await stateStore.addStateToSet(stateId, targetSetId)
        }
      }
    }
    ElMessage.success('添加成功')
    showAddToSetDialog.value = false
    if (!addingStateId.value) {
      cancelMultiSelect()
    }
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

async function addToSet(targetSetId) {
  try {
    for (const stateId of selectedStates.value) {
      const exists = stateStore.stateSetRels.some(
        r => r.stateId === stateId && r.setId === targetSetId
      )
      if (!exists) {
        await stateStore.addStateToSet(stateId, targetSetId)
      }
    }
    ElMessage.success('添加成功')
    showAddToSetDialog.value = false
    cancelMultiSelect()
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

function handleLegendSubmit() {
  // 功能开发中，暂时关闭弹窗
  showLegendDialog.value = false
}

// ========== 手动构造状态图例相关 ==========
const legendColors = [
  { name: '白色', value: '#ffffff' },
  { name: '黄色', value: '#ffff00' },
  { name: '蓝色', value: '#2040d0' },
  { name: '绿色', value: '#11aa00' },
  { name: '红色', value: '#d00000' },
  { name: '橙色', value: '#ee8800' },
  { name: '灰色', value: '#888888' }
]

const selectedLegendColor = ref(null)
const selectedStickers = ref(new Set())
const legendSvgContent = ref('')
const currentEditingForm = ref(null) // 'add' or 'edit'
const currentLegendSvg = ref('') // 保存当前修改的SVG副本
const currentLegendTemplate = ref('global') // 'global' or 'top'

// 模板列表
const legendTemplates = [
  { id: 'global', name: '全局视角' },
  { id: 'top', name: '顶层视角' }
]

// 魔方SVG模板 - 全局视角 27个贴纸区域
const rubikCubeSvgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="300" viewBox="0 0 75 75">
  <polygon points="33.89669355326993,4.2753068849212665 70.41305592323062,11.842343199633557 46.609684903136426,28.33527591367973 5.17468668752721,16.185382026783703"></polygon>
  <polygon points="5.17468668752721,16.185382026783703 46.609684903136426,28.33527591367973 45.37846315555163,72.27689884680791 9.86342069220491,55.51567628141751"></polygon>
  <polygon points="46.609684903136426,28.33527591367973 70.41305592323062,11.842343199633557 66.3288572181319,49.29713062731925 45.37846315555163,72.27689884680791"></polygon>
  <polygon class="sticker" data-id="0" points="34.108414614078605,4.489234266102436 43.518756426902854,6.446038145182838 36.821038152048786,9.60359624444511 27.124776428833787,7.402987793411306" fill="#888888"></polygon>
  <polygon class="sticker" data-id="1" points="45.25765283047034,6.8076274790774525 55.59506772152932,8.957208648479911 49.33154604486055,12.442910011082835 38.61778196274991,10.011375007749848" fill="#888888"></polygon>
  <polygon class="sticker" data-id="2" points="57.50952440331835,9.355304311291102 68.91809923028038,11.727624458658644 63.22210593135512,15.595432534544159 51.32182123579963,12.89461155649154" fill="#888888"></polygon>
  <polygon class="sticker" data-id="3" points="25.805602015979915,7.9533812984341905 35.552320167467585,10.201717960453147 27.800015216419016,13.856448165818168 17.770478922306012,11.305841382351394" fill="#888888"></polygon>
  <polygon class="sticker" data-id="4" points="37.35936881442981,10.618561215779744 48.140785208225154,13.105578216775344 40.83492431577666,17.171349931536806 29.665507556627777,14.330860668840334" fill="#888888"></polygon>
  <polygon class="sticker" data-id="5" points="50.14479949863678,13.567856773548284 62.13490052209442,16.333688645708886 55.43382308424232,20.88398919401692 42.91850981817181,17.701225606792253" fill="#888888"></polygon>
  <polygon class="sticker" data-id="6" points="16.245123261785587,11.942259008572695 26.323575013808735,14.552498003765422 17.24636960430907,18.831836471470307 6.901747549850859,15.840555743810476" fill="#888888"></polygon>
  <polygon class="sticker" data-id="7" points="28.19931632120169,15.038300111660414 39.437656462202625,17.948940991733256 30.805705057223808,22.75269299060226 19.178915313970425,19.3906569586954" fill="#888888"></polygon>
  <polygon class="sticker" data-id="8" points="41.53553397070886,18.492274612270904 54.1461999443192,21.758336988673115 46.148331096146784,27.189210955233285 32.98527214980927,23.382942892857766" fill="#888888"></polygon>
  <polygon class="sticker" data-id="9" points="5.9969377892190385,17.656108774807358 16.32355548665091,20.74505873809122 17.36046965078781,33.510781199990866 7.437947519525842,29.980603035134056" fill="#888888"></polygon>
  <polygon class="sticker" data-id="10" points="18.253016991105866,21.322208993670646 29.86310760661622,24.795077848825585 30.305503646041824,38.11629134638776 19.209682513929888,34.16868357453626" fill="#888888"></polygon>
  <polygon class="sticker" data-id="11" points="32.03989867546585,25.446210571001586 45.1885716791493,29.3793079492516 44.87018415777596,43.29803006568453 32.379900079175876,38.85430824336547" fill="#888888"></polygon>
  <polygon class="sticker" data-id="12" points="7.67928053435135,32.04464694371412 17.533689472054338,35.64333588934542 18.465159234792797,47.11090464675396 8.98001784285452,43.169436149285275" fill="#888888"></polygon>
  <polygon class="sticker" data-id="13" points="19.369421383073494,36.313718880054466 30.379164106838065,40.33431917021166 30.774077863629866,52.225769360810986 20.22803022603955,47.843450445491975" fill="#888888"></polygon>
  <polygon class="sticker" data-id="14" points="32.436481544707384,41.085622020348964 44.81736827971061,45.60694445704043 44.53515946038101,57.94406784087266 32.739684569904966,53.04256023308847" fill="#888888"></polygon>
  <polygon class="sticker" data-id="15" points="9.198426273959488,45.03741344253156 18.621208637364973,49.03206980437317 19.462538998492462,59.38990872719584 10.378421415296343,55.12953360019572" fill="#888888"></polygon>
  <polygon class="sticker" data-id="16" points="20.37181244823564,49.77421372539983 30.840042792620707,54.21207308898044 31.194728888730435,64.89220760607343 21.146704840150626,60.17976841316208" fill="#888888"></polygon>
  <polygon class="sticker" data-id="17" points="32.79030657141194,55.03886005176476 44.48817606574826,59.99800767858687 44.23631132061184,71.00860062946276 33.0623782229821,65.76811951460297" fill="#888888"></polygon>
  <polygon class="sticker" data-id="18" points="47.57931285467451,29.176813114208123 55.47050130596307,23.59482260984604 54.68613658737117,36.7541236198131 47.13907169394925,43.069838545367396" fill="#888888"></polygon>
  <polygon class="sticker" data-id="19" points="56.740927932678225,22.696160841648787 63.35241498717597,18.019392800214806 62.28319626440303,30.39657086650669 55.90665473093268,35.73274050398486" fill="#888888"></polygon>
  <polygon class="sticker" data-id="20" points="64.42506978174316,17.260628906196434 70.04476153561679,13.285427173123871 68.78037749841408,24.959444636223356 63.3216709698687,29.527529684306607" fill="#888888"></polygon>
  <polygon class="sticker" data-id="21" points="47.06603008844324,45.37486809134597 54.55540967032122,38.94733146150906 53.85392540776588,50.71614556790116 46.675692246320274,57.693056509767125" fill="#888888"></polygon>
  <polygon class="sticker" data-id="22" points="55.76750806044387,37.9070841731581 62.10418207726528,32.46882271115293 61.1395934012144,43.63481293366602 55.02034619309036,49.582438462417365" fill="#888888"></polygon>
  <polygon class="sticker" data-id="23" points="63.13681957341568,31.58259238201993 68.56786572929879,26.921559018222876 67.41869492285605,37.53181639870721 62.14021168359172,42.66225819966187" fill="#888888"></polygon>
  <polygon class="sticker" data-id="24" points="46.61069759496011,59.74414219823032 53.73664983129216,52.68368002649538 53.10556952134488,63.27132575202988 46.262233573352155,70.74088658730034" fill="#888888"></polygon>
  <polygon class="sticker" data-id="25" points="54.89535233671615,51.53562641393684 60.977671508417785,45.50920594352372 60.10307190401741,55.63349090955751 54.22233580012543,62.052365624757925" fill="#888888"></polygon>
  <polygon class="sticker" data-id="26" points="61.9728211316131,44.523202103368405 67.22510953338171,39.31918412151092 66.17609113862872,49.00473748119445 61.0682170811485,54.58002653629915" fill="#888888"></polygon>
</svg>`

// 顶层视角SVG模板 - 9个正方形格子 + 12个边框矩形 = 21个贴纸区域
// 9个正方形格子（3x3网格），每个格子大小约17.5x17.5
// 12个边框矩形（上3 + 下3 + 左3 + 右3）
const topViewSvgTemplate = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="300" viewBox="0 0 75 75">
  <!-- 黑色背景 -->
  <rect width="58.33333333333333" height="58.33333333333333" x="8.333333333333334" y="8.333333333333334" fill="#000000"></rect>
  
  <!-- 黑色外边框背景 -->
  <rect width="58.33333333333333" height="8.333333333333334" x="8.333333333333334" y="0" fill="#000000"></rect>
  <rect width="58.33333333333333" height="8.333333333333334" x="8.333333333333334" y="66.66666666666666" fill="#000000"></rect>
  <rect width="8.333333333333334" height="58.33333333333333" x="0" y="8.333333333333334" fill="#000000"></rect>
  <rect width="8.333333333333334" height="58.33333333333333" x="66.66666666666666" y="8.333333333333334" fill="#000000"></rect>
  
  <!-- 3x3网格的9个正方形格子（每个作为一个整体贴纸） -->
  <!-- 左列 -->
  <rect class="sticker" data-id="0" x="9.305555555555555" y="9.305555555555555" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="1" x="9.305555555555555" y="28.75" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="2" x="9.305555555555555" y="48.19444444444444" width="17.5" height="17.5" fill="#888888"></rect>
  <!-- 中列 -->
  <rect class="sticker" data-id="3" x="28.75" y="9.305555555555555" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="4" x="28.75" y="28.75" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="5" x="28.75" y="48.19444444444444" width="17.5" height="17.5" fill="#888888"></rect>
  <!-- 右列 -->
  <rect class="sticker" data-id="6" x="48.19444444444444" y="9.305555555555555" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="7" x="48.19444444444444" y="28.75" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="8" x="48.19444444444444" y="48.19444444444444" width="17.5" height="17.5" fill="#888888"></rect>
  
  <!-- 上边框3个矩形 -->
  <rect class="sticker" data-id="9" x="9.305555555555555" y="0.9722222222222221" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="10" x="28.75" y="0.9722222222222221" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="11" x="48.19444444444444" y="0.9722222222222221" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  
  <!-- 下边框3个矩形 -->
  <rect class="sticker" data-id="12" x="9.305555555555555" y="67.63888888888889" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="13" x="28.75" y="67.63888888888889" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="14" x="48.19444444444444" y="67.63888888888889" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  
  <!-- 左边框3个矩形 -->
  <rect class="sticker" data-id="15" x="0.9722222222222221" y="9.305555555555555" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="16" x="0.9722222222222221" y="28.75" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="17" x="0.9722222222222221" y="48.19444444444444" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  
  <!-- 右边框3个矩形 -->
  <rect class="sticker" data-id="18" x="67.63888888888889" y="9.305555555555555" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="19" x="67.63888888888889" y="28.75" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="20" x="67.63888888888889" y="48.19444444444444" width="6.388888888888889" height="17.5" fill="#888888"></rect>
</svg>`

// 二阶/四阶模板导入（若 SVG 文件不以 < 开头则回退到占位）
function normalizeSvgImport(raw, modeLabel = '') {
  if (typeof raw !== 'string' || !raw.trim().startsWith('<')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="300" viewBox="0 0 75 75">
  <text x="37.5" y="37.5" font-size="8" text-anchor="middle" dominant-baseline="middle" fill="#999">未找到${modeLabel}模板 SVG</text>
</svg>`
  }

  let svgStr = raw.trim().replace(/^<\?xml[^>]*\?>\s*/i, '')

  // 使用 DOMParser 解析并规范化 SVG
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgStr, 'image/svg+xml')
    const svgEl = doc.querySelector('svg')
    if (!svgEl) return svgStr

    // 添加 viewBox（如果没有）
    if (!svgEl.getAttribute('viewBox')) {
      const w = parseFloat(svgEl.getAttribute('width')) || 75
      const h = parseFloat(svgEl.getAttribute('height')) || 75
      svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`)
    }
    // 统一设置 width/height 为 300，铺满显示
    svgEl.setAttribute('width', '300')
    svgEl.setAttribute('height', '300')

    // 遍历所有形状元素，添加 class/data-id 或 pointer-events
    let stickerIndex = 0
    const shapes = svgEl.querySelectorAll('polygon, rect, ellipse, circle, path')
    shapes.forEach(el => {
      const existingClass = el.getAttribute('class') || ''
      if (existingClass.includes('sticker')) return // 已有 sticker class，跳过

      const fill = el.getAttribute('fill')
      if (fill === '#888888') {
        // 排除小尺寸装饰元素（如四阶顶层视角中的圆角装饰 rect，宽高约9.84）
        const w = parseFloat(el.getAttribute('width')) || 0
        const h = parseFloat(el.getAttribute('height')) || 0
        if (w > 0 && w < 10 && h > 0 && h < 10) {
          el.setAttribute('pointer-events', 'none')
          return
        }
        // 作为贴纸
        el.setAttribute('class', 'sticker')
        el.setAttribute('data-id', String(stickerIndex++))
      } else {
        // 非灰色元素为背景/边框，不拦截点击
        el.setAttribute('pointer-events', 'none')
      }
    })

    return new XMLSerializer().serializeToString(svgEl)
  } catch (e) {
    return svgStr
  }
}

const rubikCubeSvgTemplate2x2 = normalizeSvgImport(rubikCubeSvg2x2Raw, '2x2')
const topViewSvgTemplate2x2 = normalizeSvgImport(topViewSvg2x2Raw, '2x2')
const rubikCubeSvgTemplate4x4 = normalizeSvgImport(rubikCubeSvg4x4Raw, '4x4')
const topViewSvgTemplate4x4 = normalizeSvgImport(topViewSvg4x4Raw, '4x4')

const templates3x3 = {
  global: rubikCubeSvgTemplate,
  top: topViewSvgTemplate
}

const templates2x2 = {
  global: rubikCubeSvgTemplate2x2,
  top: topViewSvgTemplate2x2
}

const templates4x4 = {
  global: rubikCubeSvgTemplate4x4,
  top: topViewSvgTemplate4x4
}

// 各模式模板映射（配置驱动，直接查找）
const templateMap = {
  '2x2': templates2x2,
  '3x3': templates3x3,
  '4x4': templates4x4
}

function initLegendSvg(isFromExisting) {
  if (isFromExisting && currentLegendSvg.value) {
    legendSvgContent.value = currentLegendSvg.value
  } else {
    // 根据当前魔方模式选择对应模板集
    const templates = templateMap[cubeModeStore.currentMode]
    if (currentLegendTemplate.value === 'top') {
      legendSvgContent.value = templates.top
      currentLegendSvg.value = templates.top
    } else {
      legendSvgContent.value = templates.global
      currentLegendSvg.value = templates.global
    }
  }
}

function handleColorClick(colorValue) {
  if (selectedLegendColor.value === colorValue) {
    // 点击相同颜色，退出涂色模式
    selectedLegendColor.value = null
  } else if (selectedStickers.value.size > 0) {
    // 有选中的贴纸，给选中的贴纸上色后退出涂色模式
    const container = document.querySelector('.svg-wrapper')
    if (container) {
      const stickers = container.querySelectorAll('.sticker')
      stickers.forEach(sticker => {
        const id = sticker.getAttribute('data-id')
        if (selectedStickers.value.has(id)) {
          sticker.setAttribute('fill', colorValue)
        }
      })
    }
    // 清除选中状态，退出涂色模式，回到选贴纸模式
    selectedStickers.value.clear()
    selectedLegendColor.value = null
    updateStickerHighlights()
  } else {
    // 没有选中的贴纸，选择颜色进入涂色模式
    selectedLegendColor.value = colorValue
    updateStickerHighlights()
  }
}

function handleSvgClick(event) {
  const target = event.target
  if (!target.classList.contains('sticker')) return
  
  const stickerId = target.getAttribute('data-id')
  if (!stickerId) return

  // 箭头模式优先处理，不进入涂色流程
  if (arrowMode.value) {
    handleArrowClick(target)
    return
  }

  if (selectedLegendColor.value) {
    // 涂色模式：直接给贴纸上色
    target.setAttribute('fill', selectedLegendColor.value)
  } else {
    // 选贴纸模式：切换选中状态
    if (selectedStickers.value.has(stickerId)) {
      selectedStickers.value.delete(stickerId)
    } else {
      selectedStickers.value.add(stickerId)
    }
    updateStickerHighlights()
  }
}

function updateStickerHighlights() {
  const container = document.querySelector('.svg-wrapper')
  if (!container) return
  
  const stickers = container.querySelectorAll('.sticker')
  stickers.forEach(sticker => {
    const id = sticker.getAttribute('data-id')
    if (selectedStickers.value.has(id)) {
      sticker.style.stroke = '#165DFF'
      sticker.style.strokeWidth = '4px'
      sticker.style.vectorEffect = 'non-scaling-stroke'
    } else {
      sticker.style.stroke = ''
      sticker.style.strokeWidth = ''
      sticker.style.vectorEffect = ''
    }
  })
}

function applyColorToSelectedStickers() {
  if (!selectedLegendColor.value || selectedStickers.value.size === 0) return
  
  const container = document.querySelector('.svg-wrapper')
  if (!container) return
  
  const stickers = container.querySelectorAll('.sticker')
  stickers.forEach(sticker => {
    const id = sticker.getAttribute('data-id')
    if (selectedStickers.value.has(id)) {
      sticker.setAttribute('fill', selectedLegendColor.value)
    }
  })
  
  // 清空选中
  selectedStickers.value.clear()
  updateStickerHighlights()
}

function resetLegendDialog() {
  selectedLegendColor.value = null
  selectedStickers.value.clear()
  legendSvgContent.value = ''
  currentLegendSvg.value = ''
  currentEditingForm.value = null
  templateSvgCache.value = { global: '', top: '' }
  arrowMode.value = null
  arrowStartStickerId.value = null
}

function confirmLegendSvg() {
  // 获取修改后的SVG内容
  const svgElement = document.querySelector('.svg-wrapper svg')
  if (!svgElement) {
    ElMessage.error('SVG获取失败')
    return
  }
  
  // 直接使用SVG字符串
  const svgData = new XMLSerializer().serializeToString(svgElement)
  
  // 保存到对应的表单数据
  if (currentEditingForm.value === 'add') {
    formData.value.image = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    formData.value.imageType = 'svg'
  } else if (currentEditingForm.value === 'edit') {
    editFormData.value.image = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    editFormData.value.imageType = 'svg'
  }
  
  // 清除缓存，下次打开时重新解析
  templateSvgCache.value = { global: '', top: '' }
  
  ElMessage.success('状态图例已保存')
  showLegendDialog.value = false
}

function openLegendDialog(formType) {
  currentEditingForm.value = formType
  selectedLegendColor.value = null
  selectedStickers.value.clear()
  arrowMode.value = null
  arrowStartStickerId.value = null
  // 每次打开弹窗清空模板缓存，避免二阶/三阶模式间缓存串台
  templateSvgCache.value = { global: '', top: '' }

  // 检查是否有现有图片
  const existingImage = formType === 'add' ? formData.value.image : editFormData.value.image
  
  if (existingImage && existingImage.includes('data:image/svg+xml')) {
    // 是SVG格式，尝试解析并恢复颜色
    const parsedSvg = parseExistingSvg(existingImage)
    if (parsedSvg) {
      currentLegendTemplate.value = parsedSvg.template
      legendSvgContent.value = parsedSvg.svg
      currentLegendSvg.value = parsedSvg.svg
      // 缓存解析后的SVG
      templateSvgCache.value[parsedSvg.template] = parsedSvg.svg
      showLegendDialog.value = true
      return
    }
  }
  
  // 默认使用全局视角
  currentLegendTemplate.value = 'global'
  initLegendSvg(false)
  showLegendDialog.value = true
}

// 解析现有SVG，提取颜色并应用到对应模板
function parseExistingSvg(svgDataUrl) {
  try {
    // 解码base64 SVG
    const base64Data = svgDataUrl.replace(/^data:image\/svg\+xml;base64,/, '')
    const svgString = decodeURIComponent(escape(atob(base64Data)))
    
    // 使用DOMParser解析SVG
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    
    // 判断模板类型：
    // 顶层视角模板的贴纸是 <rect class="sticker">，全局视角是 <polygon class="sticker">
    // 注意：箭头头也是 <polygon>（但无 class="sticker"），不能用 <polygon> 是否存在来判断，
    // 否则带箭头的顶层视角图例会被误判为全局视角
    const rectSticker = doc.querySelector('rect.sticker')
    const isGlobalView = !rectSticker
    const template = isGlobalView ? 'global' : 'top'
    
    const stickers = doc.querySelectorAll('.sticker')
    
    // 提取所有sticker的颜色
    const stickerColors = {}
    stickers.forEach(sticker => {
      const id = sticker.getAttribute('data-id')
      const fill = sticker.getAttribute('fill')
      if (id && fill) {
        stickerColors[id] = fill
      }
    })
    
    // 获取对应的模板（根据当前魔方模式选择对应模板集）
    const templates = templateMap[cubeModeStore.currentMode]
    const baseTemplate = isGlobalView ? templates.global : templates.top
    
    // 使用DOMParser修改模板颜色
    const templateDoc = parser.parseFromString(baseTemplate, 'image/svg+xml')
    const templateStickers = templateDoc.querySelectorAll('.sticker')
    templateStickers.forEach(sticker => {
      const id = sticker.getAttribute('data-id')
      if (stickerColors[id]) {
        sticker.setAttribute('fill', stickerColors[id])
      }
    })
    
    // 顶层视角：若有箭头，从原图提取并追加到模板中（保留箭头标记）
    if (!isGlobalView) {
      const originalArrows = doc.querySelectorAll('.arrow-marker')
      if (originalArrows.length > 0) {
        const templateSvgEl = templateDoc.querySelector('svg')
        originalArrows.forEach(arrow => {
          const imported = templateSvgEl.ownerDocument.importNode(arrow, true)
          templateSvgEl.appendChild(imported)
        })
      }
    }
    
    // 序列化回SVG字符串
    const serializer = new XMLSerializer()
    let svg = serializer.serializeToString(templateDoc)
    
    return { template, svg }
  } catch (e) {
    console.error('解析SVG失败:', e)
    return null
  }
}

// 保存每个模板的涂色状态
const templateSvgCache = ref({
  global: '',
  top: ''
})

function switchLegendTemplate(templateId) {
  // 保存当前模板的涂色状态
  const currentTemplate = currentLegendTemplate.value
  if (currentTemplate) {
    const container = document.querySelector('.svg-wrapper')
    if (container) {
      templateSvgCache.value[currentTemplate] = container.innerHTML
    }
  }
  
  currentLegendTemplate.value = templateId
  selectedLegendColor.value = null
  selectedStickers.value.clear()
  // 切模板时清除箭头编辑状态
  arrowMode.value = null
  arrowStartStickerId.value = null
  clearArrowStartHighlight()
  
  // 检查缓存中是否有保存的涂色状态
  const cachedSvg = templateSvgCache.value[templateId]
  // 根据当前魔方模式选择对应模板集
  const templates = templateMap[cubeModeStore.currentMode]
  if (cachedSvg) {
    legendSvgContent.value = cachedSvg
    currentLegendSvg.value = cachedSvg
  } else {
    // 首次选择该模板，使用默认模板
    if (templateId === 'top') {
      legendSvgContent.value = templates.top
      currentLegendSvg.value = templates.top
    } else {
      legendSvgContent.value = templates.global
      currentLegendSvg.value = templates.global
    }
  }
}

function getLabelColor(bgColor) {
  // 根据背景色返回合适的文字颜色
  const lightColors = ['#ffffff', '#ffff00', '#ee8800']
  return lightColors.includes(bgColor) ? '#333333' : '#ffffff'
}

function resetLegendToDefault() {
  // 将所有贴纸重置为灰色
  const container = document.querySelector('.svg-wrapper')
  if (container) {
    const stickers = container.querySelectorAll('.sticker')
    stickers.forEach(sticker => {
      sticker.setAttribute('fill', '#888888')
    })
    // 清除所有箭头
    container.querySelectorAll('.arrow-marker').forEach(el => el.remove())
    // 更新缓存为重置后的状态
    templateSvgCache.value[currentLegendTemplate.value] = container.innerHTML
  }
  // 清除选中状态和颜色选择
  selectedStickers.value.clear()
  selectedLegendColor.value = null
  // 重置箭头编辑状态
  arrowMode.value = null
  arrowStartStickerId.value = null
  clearArrowStartHighlight()
  updateStickerHighlights()
}

// ========== 箭头标记功能（仅三阶顶层视角） ==========
// arrowMode: null | 'single' | 'double' | 'delete'
const arrowMode = ref(null)
const arrowStartStickerId = ref(null)

// 允许作为箭头端点的贴纸 data-id 集合：
// 三阶顶层视角中心 3x3 的 9 个正方形贴纸（data-id 0-8），排除正中心块（data-id="4"）
const ARROW_ALLOWED_STICKER_IDS = ['0', '1', '2', '3', '5', '6', '7', '8']

function isArrowEndpointAllowed(id) {
  return ARROW_ALLOWED_STICKER_IDS.includes(id)
}

function setArrowMode(mode) {
  // 重复点击同一按钮 → 退出箭头模式
  if (arrowMode.value === mode) {
    arrowMode.value = null
  } else {
    arrowMode.value = mode
  }
  arrowStartStickerId.value = null
  clearArrowStartHighlight()
  // 进入箭头模式时退出涂色模式，避免冲突
  if (arrowMode.value) {
    selectedLegendColor.value = null
    selectedStickers.value.clear()
    updateStickerHighlights()
  }
}

function clearArrowStartHighlight() {
  const container = document.querySelector('.svg-wrapper')
  if (!container) return
  container.querySelectorAll('.arrow-start').forEach(el => {
    el.classList.remove('arrow-start')
    el.style.stroke = ''
    el.style.strokeWidth = ''
    el.style.vectorEffect = ''
  })
}

function highlightArrowStart(stickerEl) {
  clearArrowStartHighlight()
  stickerEl.classList.add('arrow-start')
  stickerEl.style.stroke = '#165DFF'
  stickerEl.style.strokeWidth = '4px'
  stickerEl.style.vectorEffect = 'non-scaling-stroke'
}

// 获取贴纸中心坐标（SVG 用户坐标系）
function getStickerCenter(stickerEl) {
  const x = parseFloat(stickerEl.getAttribute('x') || 0)
  const y = parseFloat(stickerEl.getAttribute('y') || 0)
  const w = parseFloat(stickerEl.getAttribute('width') || 0)
  const h = parseFloat(stickerEl.getAttribute('height') || 0)
  return { x: x + w / 2, y: y + h / 2 }
}

// 在 SVG 中查找两个贴纸之间已存在的箭头（顺序无关）
function findArrowBetween(svgEl, idA, idB) {
  const arrows = svgEl.querySelectorAll('.arrow-marker')
  for (const arrow of arrows) {
    const from = arrow.getAttribute('data-from')
    const to = arrow.getAttribute('data-to')
    if ((from === idA && to === idB) || (from === idB && to === idA)) {
      return arrow
    }
  }
  return null
}

// 绘制单向/双向箭头
function drawArrow(svgEl, fromId, toId, mode) {
  const fromSticker = svgEl.querySelector(`.sticker[data-id="${fromId}"]`)
  const toSticker = svgEl.querySelector(`.sticker[data-id="${toId}"]`)
  if (!fromSticker || !toSticker) return

  const p1 = getStickerCenter(fromSticker)
  const p2 = getStickerCenter(toSticker)

  // 同一贴纸则不绘制
  if (Math.abs(p1.x - p2.x) < 0.01 && Math.abs(p1.y - p2.y) < 0.01) return

  // 已存在则先移除（避免重复叠加）
  const existing = findArrowBetween(svgEl, fromId, toId)
  if (existing) existing.remove()

  // 起止点稍微缩进，避免箭头头压在贴纸中心
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.sqrt(dx * dx + dy * dy)
  const shrink = Math.min(2.5, len * 0.18)
  const ux = dx / len
  const uy = dy / len
  const sx = p1.x + ux * shrink
  const sy = p1.y + uy * shrink
  const ex = p2.x - ux * shrink
  const ey = p2.y - uy * shrink

  // 箭头头大小
  const headLen = 3.5
  const headWidth = 2.2

  const ns = 'http://www.w3.org/2000/svg'
  const g = document.createElementNS(ns, 'g')
  g.setAttribute('class', 'arrow-marker')
  g.setAttribute('data-from', fromId)
  g.setAttribute('data-to', toId)
  g.setAttribute('data-type', mode) // 'single' | 'double'
  g.setAttribute('pointer-events', 'none')

  const color = '#000000'

  // 终点箭头头
  const endHead = document.createElementNS(ns, 'polygon')
  // 计算箭头头底边两点
  const baseX = ex - ux * headLen
  const baseY = ey - uy * headLen
  const nx = -uy
  const ny = ux
  endHead.setAttribute('points',
    `${ex},${ey} ${baseX + nx * headWidth},${baseY + ny * headWidth} ${baseX - nx * headWidth},${baseY - ny * headWidth}`
  )
  endHead.setAttribute('fill', color)

  const line = document.createElementNS(ns, 'line')
  line.setAttribute('x1', sx)
  line.setAttribute('y1', sy)
  line.setAttribute('x2', baseX)
  line.setAttribute('y2', baseY)
  line.setAttribute('stroke', color)
  line.setAttribute('stroke-width', '1.4')
  line.setAttribute('stroke-linecap', 'round')

  g.appendChild(line)
  g.appendChild(endHead)

  // 双向箭头：起点也加一个箭头头，与终点箭头完全镜像对称
  // 终点箭头结构：顶点 ex（距贴纸中心 p2 为 shrink），底边 baseX=ex-u*headLen（朝内退 headLen）
  // 起点箭头对称：顶点 sx（距贴纸中心 p1 为 shrink），底边 startBaseX=sx+u*headLen（朝内退 headLen）
  // 顶点 (sx,sy) 到底边 (startBaseX,startBaseY) 方向为 +u，即顶点朝 -u 方向（远离终点），尖端朝外正确
  if (mode === 'double') {
    const startBaseX = sx + ux * headLen
    const startBaseY = sy + uy * headLen
    const startHead = document.createElementNS(ns, 'polygon')
    startHead.setAttribute('points',
      `${sx},${sy} ${startBaseX + nx * headWidth},${startBaseY + ny * headWidth} ${startBaseX - nx * headWidth},${startBaseY - ny * headWidth}`
    )
    startHead.setAttribute('fill', color)

    // 调整直线起点：从 sx,sy 改为起点箭头底边，使直线两端分别连接两个箭头底边
    line.setAttribute('x1', startBaseX)
    line.setAttribute('y1', startBaseY)

    g.insertBefore(startHead, g.firstChild)
  }

  svgEl.appendChild(g)
}

// 处理箭头模式下的贴纸点击
function handleArrowClick(stickerEl) {
  const svgEl = document.querySelector('.svg-wrapper svg')
  if (!svgEl || !stickerEl) return
  const id = stickerEl.getAttribute('data-id')
  if (!id) return

  // 所有箭头模式都仅允许在中心 3x3 的非中心块贴纸上操作
  if (!isArrowEndpointAllowed(id)) {
    ElMessage.info('仅可选择中心 3×3 区域中除中心块外的 8 个贴纸')
    return
  }

  if (arrowMode.value === 'delete') {
    if (arrowStartStickerId.value === null) {
      arrowStartStickerId.value = id
      highlightArrowStart(stickerEl)
    } else {
      const startId = arrowStartStickerId.value
      const existing = findArrowBetween(svgEl, startId, id)
      if (existing) {
        existing.remove()
        ElMessage.success('箭头已删除')
      } else {
        ElMessage.info('这两个贴纸之间没有箭头')
      }
      arrowStartStickerId.value = null
      clearArrowStartHighlight()
    }
    return
  }

  if (arrowMode.value === 'single' || arrowMode.value === 'double') {
    if (arrowStartStickerId.value === null) {
      arrowStartStickerId.value = id
      highlightArrowStart(stickerEl)
    } else {
      const startId = arrowStartStickerId.value
      if (startId === id) {
        // 点击同一贴纸取消选择
        arrowStartStickerId.value = null
        clearArrowStartHighlight()
        return
      }
      drawArrow(svgEl, startId, id, arrowMode.value)
      arrowStartStickerId.value = null
      clearArrowStartHighlight()
    }
    return
  }
}

// 清空所有箭头
function clearAllArrows() {
  const container = document.querySelector('.svg-wrapper')
  if (!container) return
  const svgEl = container.querySelector('svg')
  if (!svgEl) return
  const arrows = svgEl.querySelectorAll('.arrow-marker')
  if (arrows.length === 0) {
    ElMessage.info('当前没有箭头可清空')
    return
  }
  arrows.forEach(el => el.remove())
  // 同步更新模板缓存，避免切换模板后又被恢复
  templateSvgCache.value[currentLegendTemplate.value] = container.innerHTML
  // 重置选中状态
  arrowStartStickerId.value = null
  clearArrowStartHighlight()
  ElMessage.success('已清空所有箭头')
}
</script>

<style scoped>
/* 状态集页特有样式（统一样式已提取到 index.css） */

.stateset-menu {
  position: relative;
}

.stateset-menu-btn {
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

.stateset-menu-btn:hover {
  opacity: 0.8;
}

.stateset-menu-btn:active {
  transform: scale(0.9);
  opacity: 0.6;
}

.stateset-menu-dropdown {
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
  background: #E5E7EB;
}

/* 多选模式工具栏 */
/* 与导航栏同级（不在 .page-content 滚动容器内），自身 sticky：
 * top = 导航栏高度（状态栏 + 12 + 40 + 24 = 状态栏 + 76）+ 12px 间距，
 * 因此始终悬停在导航栏下方 12px 处，不随信息流滚动；
 * 参与文档流但只是独立一行，不会改变导航栏的高度和圆角形状 */
.multi-select-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: nowrap;
  height: 46px;
  padding: 0 16px;
  margin: 12px 16px 0;
  background: rgba(245, 247, 250, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: calc(var(--status-bar-height, 0px) + 88px);
  z-index: 40;
  flex-shrink: 0;
}

.selected-count {
  flex-shrink: 0;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #86909C;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}

.select-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #86909C;
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
}

.select-all-btn:active {
  opacity: 0.7;
}

.legend-dialog-btn.cancel-btn {
  font-size: 14px;
  color: #1D2129;
}

.action-text-btn {
  font-size: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: #165DFF;
}

.action-text-btn.warning {
  color: #FF7D00;
}

.action-text-btn.danger {
  color: #F53F3F;
}

.action-text-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-upload-area {
  @apply w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand transition-colors overflow-hidden;
}

.preview-image {
  @apply w-full h-full object-contain;
}

.button-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  width: 100%;
}

.button-row :deep(.el-button) {
  width: calc(50% - 4px);
  height: 36px;
  min-width: 0;
  flex: none;
}

.upload-placeholder {
  @apply flex flex-col items-center gap-2;
}

.set-list {
  max-height: 300px;
  overflow-y: auto;
}

.set-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.set-item:hover {
  background: #F5F7FA;
}

.set-item.selectable {
  gap: 12px;
}

.set-item.selected {
  background: transparent;
}

.set-item:last-child {
  border-bottom: none;
}

.set-name {
  font-size: 14px;
  color: #1D2129;
  flex: 1;
}

.set-checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid #DCDFE6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.set-checkbox.checked {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

.built-in-badge {
  font-size: 12px;
  color: #165DFF;
  background: #E8F0FE;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

/* 手动构造状态图例内容样式 */
.legend-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-selector {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.template-btn {
  padding: 8px 16px;
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  background: #F5F7FA;
  color: #86909C;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.template-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.template-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: #FFFFFF;
}

.svg-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.svg-wrapper :deep(svg) {
  width: 100%;
  max-width: 300px;
  height: auto;
}

.svg-wrapper :deep(.sticker) {
  cursor: pointer;
  transition: all 0.2s;
}

.svg-wrapper :deep(.sticker:hover) {
  opacity: 0.8;
}

.color-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-btn-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  justify-content: center;
}

.color-btn {
  height: 40px;
  border: 2px solid #DCDFE6;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.color-btn:hover {
  border-color: #165DFF;
  transform: scale(1.05);
}

.color-btn.active {
  border-color: #165DFF;
  border-width: 3px;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.2);
}

.clear-btn {
  background: #F5F7FA;
  color: #86909C;
}

.clear-btn:hover {
  color: #165DFF;
  border-color: #165DFF;
}

.color-label {
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.mode-hint {
  text-align: center;
}

.text-info {
  color: #165DFF;
}

/* 箭头工具区（仅三阶顶层视角） */
.arrow-tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px dashed #E5E7EB;
}

.arrow-btn-wrapper {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.arrow-btn {
  height: 44px;
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  background: #F5F7FA;
  color: #4E5969;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.2s;
}

.arrow-btn:hover {
  border-color: #165DFF;
  color: #165DFF;
}

.arrow-btn.active {
  background: #165DFF;
  border-color: #165DFF;
  color: #FFFFFF;
}

.arrow-btn.delete.active {
  background: #F53F3F;
  border-color: #F53F3F;
}

.arrow-btn.clear {
  background: #FFF7E8;
  border-color: #FFD9A8;
  color: #91592D;
}

.arrow-btn.clear:hover {
  border-color: #FF7D00;
  color: #FF7D00;
}

.arrow-btn.clear:active {
  background: #FFE8C7;
}

/* 箭头起始贴纸高亮（与涂色选中样式区分：虚线） */
.svg-wrapper :deep(.arrow-start) {
  stroke-dasharray: 2 1;
}

/* 手动构造状态图例弹窗 - 匹配EditDialog风格 */
.legend-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.dialog-status-bar-shade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--status-bar-height, 0px);
  background: rgba(0, 0, 0, 0.5);
}

.legend-dialog-container {
  width: 100%;
  max-width: min(calc(100vw - 48px), 400px);
  max-height: calc(100vh - var(--status-bar-height, 0px) - 48px);
  background: #FFFFFF;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.legend-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  flex-shrink: 0;
}

.legend-dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: #1D2129;
}

.legend-dialog-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  color: #86909C;
  cursor: pointer;
  transition: background-color 0.2s;
}

.legend-dialog-close:active {
  background: #F5F7FA;
}

.legend-dialog-content {
  padding: 0 20px;
  overflow-y: auto;
  flex: 1;
}

.legend-dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px 20px;
  flex-shrink: 0;
  justify-content: center;
}

.legend-dialog-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.legend-dialog-btn.cancel-btn {
  background: #F2F3F5;
  color: #1D2129;
}

.legend-dialog-btn.cancel-btn:active {
  background: #E5E7EB;
}

.legend-dialog-btn.confirm-btn {
  background: #165DFF;
  color: #FFFFFF;
}

.legend-dialog-btn.confirm-btn:active {
  background: #0E42D2;
}

/* 弹窗过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  transform: scale(0.92);
  opacity: 0;
}
</style>
