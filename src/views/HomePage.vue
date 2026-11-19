<template>
  <div class="page-base home-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <h1 class="page-title">魔小库 CubeBase</h1>
        <div class="page-actions">
          <button v-if="!isDragging" class="page-action-btn" @click="openAddDialog">
            <Plus :size="24" />
          </button>
          <div v-if="!isDragging" class="home-menu" ref="menuRef">
            <button class="home-menu-btn" @click="showMenu = !showMenu">
              <MoreVertical :size="24" />
            </button>
            <div v-if="showMenu" class="home-menu-dropdown">
              <button class="menu-item menu-item-checked" @click="switchToMode('2x2')">
                <span>二阶</span>
                <Check v-if="cubeModeStore.currentMode === '2x2'" :size="16" />
              </button>
              <button class="menu-item menu-item-checked" @click="switchToMode('3x3')">
                <span>三阶</span>
                <Check v-if="cubeModeStore.currentMode === '3x3'" :size="16" />
              </button>
              <button class="menu-item menu-item-checked" @click="switchToMode('4x4')">
                <span>四阶</span>
                <Check v-if="cubeModeStore.currentMode === '4x4'" :size="16" />
              </button>
              <button class="menu-item" @click="showTipDialog = true; showMenu = false">
                提示信息
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container-with-bottom-nav flex-1 overflow-auto" ref="pageContainer"
      @click="handlePageAreaClick"
      @touchstart.passive="handlePageAreaTouch"
    >
      <div v-if="moduleStore.loading" class="flex items-center justify-center h-40">
        <el-icon class="is-loading text-brand text-2xl"><Loader /></el-icon>
      </div>
      
      <draggable
        v-else
        v-model="sortedModules"
        item-key="id"
        handle=".drag-handle"
        :animation="200"
        @start="isDragging = true"
        @end="handleDragEnd"
        class="space-y-3"
      >
        <template #item="{ element }">
          <ModuleCard
            :module="element"
            :state-count="getModuleStateCount(element.id)"
            :formula-count="getModuleFormulaCount(element.id)"
            @click="goToModule(element)"
            @edit="openEditDialog(element)"
            @delete="confirmDelete(element)"
            @longpress="startMultiSelect(element)"
          >
            <template #drag-handle>
              <div class="drag-handle p-1">
                <GripVertical :size="18" class="text-hint" />
              </div>
            </template>
          </ModuleCard>
        </template>
      </draggable>

      <div v-if="!moduleStore.loading && moduleStore.modules.length === 0" 
           class="text-center text-hint mt-20">
        暂无模块，点击右上角添加
      </div>
      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 底部导航栏 -->
    <div class="page-bottom-nav">
      <div class="page-bottom-item page-bottom-active">
        <Home :size="24" />
        <span>首页</span>
      </div>
      <div class="page-bottom-item" @click="goToSettings">
        <Settings :size="24" />
        <span>设置</span>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <EditDialog
      v-model="showAddDialog"
      title="添加模块"
      @submit="handleAdd"
    >
      <el-form label-position="top">
        <el-form-item label="模块名称" required>
          <el-input v-model="formData.name" placeholder="请输入模块名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="模块描述">
          <el-input v-model="formData.desc" type="textarea" placeholder="请输入模块描述" maxlength="200" :rows="2" />
        </el-form-item>
        <el-form-item label="模块图例">
          <div class="image-upload-area" @click="triggerImageUpload('add')">
            <img v-if="formData.image" :src="formData.image" class="preview-image" />
            <div v-else class="upload-placeholder">
              <Upload :size="32" class="text-hint" />
              <span class="text-hint text-sm">点击上传图片</span>
            </div>
          </div>
          <input type="file" ref="addImageInput" accept="image/*" class="hidden" @change="handleAddImageChange" />
          <div class="button-row">
            <el-button type="primary" size="small" @click="openLegendDialog('add')">
              手动构造模块图例
            </el-button>
            <el-button v-if="formData.image" type="danger" size="small" @click="formData.image = ''">
              删除图片
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </EditDialog>

    <EditDialog
      v-model="showEditDialog"
      :title="editingModule?.type === 'builtIn' ? '编辑模块' : '编辑模块'"
      @submit="handleUpdate"
    >
      <el-form label-position="top">
        <el-form-item label="模块名称" required>
          <el-input v-model="formData.name" placeholder="请输入模块名称" maxlength="20" :disabled="editingModule?.type === 'builtIn'" />
        </el-form-item>
        <el-form-item label="模块描述">
          <el-input v-model="formData.desc" type="textarea" placeholder="请输入模块描述" maxlength="200" :rows="2" />
        </el-form-item>
        <el-form-item label="模块图例">
          <div class="image-upload-area" @click="triggerImageUpload('edit')">
            <img v-if="formData.image" :src="formData.image" class="preview-image" />
            <div v-else class="upload-placeholder">
              <Upload :size="32" class="text-hint" />
              <span class="text-hint text-sm">点击上传图片</span>
            </div>
          </div>
          <input type="file" ref="editImageInput" accept="image/*" class="hidden" @change="handleEditImageChange" />
          <div class="button-row">
            <el-button type="primary" size="small" @click="openLegendDialog('edit')">
              手动构造模块图例
            </el-button>
            <el-button v-if="formData.image" type="danger" size="small" @click="formData.image = ''">
              删除图片
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </EditDialog>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除模块"
      :message="`确定要删除模块「${deletingModule?.name}」吗？\n该操作将同时删除所有子数据，无法恢复。`"
      confirm-text="删除"
      @confirm="handleDelete"
    />

    <!-- 提示信息弹窗 -->
    <ConfirmDialog
      v-model="showTipDialog"
      title="提示信息"
      message="左滑模块卡片可编辑或删除模块"
      confirm-text="关闭"
      :show-cancel="false"
      @confirm="showTipDialog = false"
    />

    <!-- 首次启动更新日志弹窗 -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="showUpdateLogDialog" class="dialog-overlay" @click.self="closeUpdateLogDialog">
          <Transition name="dialog-scale">
            <div v-if="showUpdateLogDialog" class="dialog-container">
              <!-- 标题栏 -->
              <div class="dialog-header">
                <span class="dialog-title">更新日志</span>
                <button class="dialog-close" @click="closeUpdateLogDialog">
                  <X :size="20" />
                </button>
              </div>

              <!-- 内容区域 -->
              <div class="dialog-content">
                <p class="update-log-subtitle">魔小库 CubeBase 3.10.2版本更新日志</p>
                <ol class="update-log-list">
                  <li>1、新增三阶顶层视角图例箭头标记编辑功能，支持绘制单向、双向箭头</li>
                  <li>2、数据导出与应用内备份支持按模块细化选择</li>
                  <li>3、数据导入支持增量导入，避免数据覆盖</li>
                  <li>4、数据导入支持勾选所需内容，自动识别并标记本地已存在同名模块，提示将被覆盖更新</li>
                  <li>5、数据重置同步支持按模块细化选择，可灵活指定重置范围</li>
                  <li>6、修复部分已知问题，优化数据管理交互体验</li>
                </ol>
                <p class="update-log-tip">关闭后不再弹出，可在关于-更新日志中再次查看</p>
              </div>

              <!-- 底部按钮 -->
              <div class="dialog-footer">
                <button class="dialog-btn cancel-btn" @click="closeUpdateLogDialog">关闭</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- 手动构造模块图例弹窗 -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="showLegendDialog" class="legend-dialog-overlay" @click.self="showLegendDialog = false">
          <div class="dialog-status-bar-shade"></div>
          <Transition name="dialog-scale">
            <div v-if="showLegendDialog" class="legend-dialog-container">
              <!-- 标题栏 -->
              <div class="legend-dialog-header">
                <span class="legend-dialog-title">手动构造模块图例</span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Home, Settings, GripVertical, Loader, Upload, X, MoreVertical, Check } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { useModuleStore } from '@/stores/moduleStore'
import { useSetStore } from '@/stores/setStore'
import { useStateStore } from '@/stores/stateStore'
import { useFormulaStore } from '@/stores/formulaStore'
import { useDialogStore } from '@/stores/dialogStore'
import { useCubeModeStore } from '@/stores/cubeModeStore'
import ModuleCard from '@/components/ModuleCard.vue'
import EditDialog from '@/components/EditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { handleImageUpload } from '@/utils/imageHandler'
import { setStatusBarForDialog } from '@/utils/statusBar'
import { initSeedData } from '@/db/seed'
import { saveScrollPosition, getScrollPosition, clearScrollPosition, PAGE_KEYS } from '@/utils/scrollPosition'
import swipeMutex from '@/utils/swipeMutex.js'
// 调试开关（true开启日志，false关闭日志）
const DEBUG_ENABLE = false

const router = useRouter()
const moduleStore = useModuleStore()
const setStore = useSetStore()
const stateStore = useStateStore()
const formulaStore = useFormulaStore()
const dialogStore = useDialogStore()
const cubeModeStore = useCubeModeStore()

// 计算模块下的状态数量（与"全部状态"状态集卡片统计一致）
function getModuleStateCount(moduleId) {
  const builtInSet = setStore.sets.find(s => s.moduleId === moduleId && s.type === 'builtIn')
  if (!builtInSet) return 0
  return stateStore.stateSetRels.filter(rel => rel.setId === builtInSet.id).length
}

// 计算模块下的公式数量（所有状态下非打乱公式的总和）
function getModuleFormulaCount(moduleId) {
  const builtInSet = setStore.sets.find(s => s.moduleId === moduleId && s.type === 'builtIn')
  if (!builtInSet) return 0
  const stateIds = stateStore.stateSetRels
    .filter(rel => rel.setId === builtInSet.id)
    .map(rel => rel.stateId)
  return formulaStore.formulas.filter(f => stateIds.includes(f.stateId) && !f.isScramble).length
}

// 滚动位置恢复相关
const pageContainer = ref(null)

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showTipDialog = ref(false)
const showUpdateLogDialog = ref(false)
const editingModule = ref(null)
const deletingModule = ref(null)
const isDragging = ref(false)

// 菜单相关
const showMenu = ref(false)
const menuRef = ref(null)

// 图片上传相关
const addImageInput = ref(null)
const editImageInput = ref(null)

const formData = ref({
  name: '',
  desc: '',
  image: '',
  imageType: ''
})

const sortedModules = computed({
  get: () => moduleStore.modules,
  set: (val) => moduleStore.modules = val
})

onMounted(async () => {
  await moduleStore.fetchModules()
  await setStore.ensureFetched()
  await stateStore.ensureFetched()
  await formulaStore.ensureFetched()

  // 点击外部关闭菜单
  document.addEventListener('click', closeMenuOnClickOutside)

  // 恢复滚动位置
  const savedScrollTop = getScrollPosition(PAGE_KEYS.HOME)
  DEBUG_ENABLE && console.log(`[HomePage] onMounted, savedScrollTop: ${savedScrollTop}`)

  nextTick(() => {
    if (savedScrollTop > 0) {
      window.scrollTo({ top: savedScrollTop, behavior: 'instant' })
      DEBUG_ENABLE && console.log(`[HomePage] 恢复滚动位置: ${savedScrollTop}`)
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  })

  // 检查是否首次启动（首次安装后第一次打开）
  const hasShownUpdateLog = localStorage.getItem('hasShownUpdateLog_3102')
  if (!hasShownUpdateLog) {
    showUpdateLogDialog.value = true
  }
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})

function closeMenuOnClickOutside(e) {
  if (!showMenu.value) return
  const menuEl = e.target.closest('.home-menu')
  if (!menuEl) {
    showMenu.value = false
  }
}

async function switchToMode(mode) {
  if (cubeModeStore.currentMode === mode) {
    showMenu.value = false
    return
  }
  cubeModeStore.setMode(mode)
  showMenu.value = false
  // 初始化目标模式的内置数据（如果尚未初始化）
  await initSeedData(mode)
  // 失效并重新加载当前模式的数据
  moduleStore.invalidate()
  setStore.invalidate()
  stateStore.invalidate()
  formulaStore.invalidate()
  await Promise.all([
    moduleStore.fetchModules(),
    setStore.fetchSets(),
    stateStore.fetchStates(),
    stateStore.fetchStateSetRels(),
    formulaStore.fetchFormulas()
  ])
}

function goToModule(module) {
  // 记录当前滚动位置（使用 window.scrollY 获取页面级滚动位置）
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
  saveScrollPosition(PAGE_KEYS.HOME, null, scrollTop)
  DEBUG_ENABLE && console.log(`[HomePage] 进入模块页，记录滚动位置: ${scrollTop}`)
  
  // 清除模块页的滚动位置记录，确保进入时从顶部显示
  clearScrollPosition(PAGE_KEYS.MODULE, module.id)
  DEBUG_ENABLE && console.log(`[HomePage] 清除模块页 ${module.id} 的滚动位置记录`)
  
  router.push(`/module/${module.id}`)
}

function goToSettings() {
  // 记录当前滚动位置（使用 window.scrollY 获取页面级滚动位置）
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
  saveScrollPosition(PAGE_KEYS.HOME, null, scrollTop)
  DEBUG_ENABLE && console.log(`[HomePage] 进入设置页，记录滚动位置：${scrollTop}`)
  
  // 清除设置页的滚动位置记录，确保进入时从顶部显示
  clearScrollPosition(PAGE_KEYS.SETTINGS)
  DEBUG_ENABLE && console.log(`[HomePage] 清除设置页的滚动位置记录`)
  
  router.push('/settings')
}

function openAddDialog() {
  formData.value = { name: '', desc: '', image: '', imageType: '' }
  showAddDialog.value = true
}

function openEditDialog(module) {
  editingModule.value = module
  formData.value = { name: module.name, desc: module.desc || '', image: module.image || '', imageType: module.imageType || '' }
  showEditDialog.value = true
}

function confirmDelete(module) {
  deletingModule.value = module
  showDeleteDialog.value = true
}

async function handleAdd() {
  if (!formData.value.name.trim()) {
    ElMessage.warning('请输入模块名称')
    return
  }
  try {
    await moduleStore.addModule(formData.value)
    ElMessage.success('添加成功')
    showAddDialog.value = false
    formData.value = { name: '', desc: '', image: '', imageType: '' }
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

async function handleUpdate() {
  if (!formData.value.name.trim()) {
    ElMessage.warning('请输入模块名称')
    return
  }
  try {
    await moduleStore.updateModule(editingModule.value.id, formData.value)
    ElMessage.success('更新成功')
    showEditDialog.value = false
  } catch (e) {
    ElMessage.error(e.message || '更新失败')
  }
}

async function handleDelete() {
  try {
    await moduleStore.deleteModule(deletingModule.value.id)
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function handleDragEnd() {
  isDragging.value = false
  await moduleStore.updateSort(sortedModules.value)
  ElMessage.success('排序已保存')
}

function startMultiSelect(module) {
  ElMessage.info('长按多选模式开发中')
}

// 关闭首次启动更新日志弹窗
function closeUpdateLogDialog() {
  showUpdateLogDialog.value = false
  // 标记已显示过，下次不再弹出
  localStorage.setItem('hasShownUpdateLog_3102', 'true')
}

// 点击/触摸页面空白区域 → 关闭已展开的左滑卡片
function handlePageAreaClick(e) {
  // 点击事件会从子元素冒泡上来
  // 如果点击的是卡片或按钮等交互元素，由它们自己处理
  swipeMutex.closeAny()
}

function handlePageAreaTouch() {
  // 触摸空白区域也关闭（处理滑动空白区域的场景）
  swipeMutex.closeAny()
}

// ========== 图片上传相关 ==========
function triggerImageUpload(type) {
  if (type === 'add') {
    addImageInput.value?.click()
  } else {
    editImageInput.value?.click()
  }
}

async function handleAddImageChange(e) {
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
    formData.value.image = result.image
    formData.value.imageType = result.imageType
  } catch (err) {
    ElMessage.error('图片处理失败')
  }
}

// ========== 手动构造模块图例相关 ==========
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
const currentEditingForm = ref(null)
const currentLegendSvg = ref('')
const currentLegendTemplate = ref('global')

const legendTemplates = [
  { id: 'global', name: '全局视角' },
  { id: 'top', name: '顶层视角' }
]

// 三阶图例模板
const rubikCubeSvgTemplate3x3 = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="300" viewBox="0 0 75 75">
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
  <polygon class="sticker" data-id="7" points="28.19931632120169,15.038300111660414 39.437656462202625,17.948940991733256 30.805705057223808,22.75269299060226 19.178915313970425,19.390656958695" fill="#888888"></polygon>
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
  <polygon class="sticker" data-id="21" points="47.06603008844324,45.37486809134597 54.55540967032122,38.94733146150906 53.85392540776588,50.71614556790116 46.67569224632027,57.693056509767125" fill="#888888"></polygon>
  <polygon class="sticker" data-id="22" points="55.76750806044387,37.9070841731581 62.104182077528,32.46882271115293 61.1395934012144,43.63481293366602 55.02034619309036,49.582438462417365" fill="#888888"></polygon>
  <polygon class="sticker" data-id="23" points="63.13681957341568,31.58259238201993 68.56786572929879,26.921559018222876 67.41869492285605,37.53181639870721 62.14021168359172,42.66225819966187" fill="#888888"></polygon>
  <polygon class="sticker" data-id="24" points="46.61069759496011,59.74414219823032 53.73664983129216,52.68368002649538 53.10556952134488,63.27132575202988 46.262233573352155,70.74088658730034" fill="#888888"></polygon>
  <polygon class="sticker" data-id="25" points="54.89535233671615,51.53562641393684 60.977671508417785,45.50920594352372 60.10307190401741,55.63349090955751 54.22233580012543,62.052365624757925" fill="#888888"></polygon>
  <polygon class="sticker" data-id="26" points="61.9728211316131,44.523202103368405 67.22510953338171,39.31918412151092 66.17609113862872,49.00473748119445 61.0682170811485,54.58002653699915" fill="#888888"></polygon>
</svg>`

const topViewSvgTemplate3x3 = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="300" height="300" viewBox="0 0 75 75">
  <rect width="58.33333333333333" height="58.33333333333333" x="8.333333333333334" y="8.333333333333334" fill="#000000"></rect>
  <rect width="58.33333333333333" height="8.333333333333334" x="8.333333333333334" y="0" fill="#000000"></rect>
  <rect width="58.33333333333333" height="8.333333333333334" x="8.333333333333334" y="66.66666666666666" fill="#000000"></rect>
  <rect width="8.333333333333334" height="58.33333333333333" x="0" y="8.333333333333334" fill="#000000"></rect>
  <rect width="8.333333333333334" height="58.33333333333333" x="66.66666666666666" y="8.333333333333334" fill="#000000"></rect>
  <rect class="sticker" data-id="0" x="9.305555555555555" y="9.305555555555555" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="1" x="9.305555555555555" y="28.75" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="2" x="9.305555555555555" y="48.19444444444444" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="3" x="28.75" y="9.305555555555555" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="4" x="28.75" y="28.75" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="5" x="28.75" y="48.19444444444444" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="6" x="48.19444444444444" y="9.305555555555555" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="7" x="48.19444444444444" y="28.75" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="8" x="48.19444444444444" y="48.19444444444444" width="17.5" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="9" x="9.305555555555555" y="0.9722222222222221" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="10" x="28.75" y="0.9722222222222221" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="11" x="48.19444444444444" y="0.9722222222222221" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="12" x="9.305555555555555" y="67.63888888888889" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="13" x="28.75" y="67.63888888888889" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="14" x="48.19444444444444" y="67.63888888888889" width="17.5" height="6.388888888888889" fill="#888888"></rect>
  <rect class="sticker" data-id="15" x="0.9722222222222221" y="9.305555555555555" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="16" x="0.9722222222222221" y="28.75" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="17" x="0.9722222222222221" y="48.19444444444444" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="18" x="67.63888888888889" y="9.305555555555555" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="19" x="67.63888888888889" y="28.75" width="6.388888888888889" height="17.5" fill="#888888"></rect>
  <rect class="sticker" data-id="20" x="67.63888888888889" y="48.19444444444444" width="6.388888888888889" height="17.5" fill="#888888"></rect>
</svg>`

// 二阶图例模板（静态 SVG 文件，按模式分目录存放）
import rubikCubeSvg2x2Raw from '@/assets/images/legend-templates/2×2/2x2-global.svg?raw'
import topViewSvg2x2Raw from '@/assets/images/legend-templates/2×2/2x2-top.svg?raw'
// 四阶图例模板
import rubikCubeSvg4x4Raw from '@/assets/images/legend-templates/4×4/4x4-global.svg?raw'
import topViewSvg4x4Raw from '@/assets/images/legend-templates/4×4/4x4-top.svg?raw'

// 若 Vite 未启用 ?raw 导入，SVG 内容会以 URL 形式返回，此时回退到内联占位
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
  global: rubikCubeSvgTemplate3x3,
  top: topViewSvgTemplate3x3
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

const templateSvgCache = ref({ global: '', top: '' })

function initLegendSvg(isFromExisting) {
  if (isFromExisting && currentLegendSvg.value) {
    legendSvgContent.value = currentLegendSvg.value
  } else {
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
    selectedLegendColor.value = null
  } else if (selectedStickers.value.size > 0) {
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
    selectedStickers.value.clear()
    selectedLegendColor.value = null
    updateStickerHighlights()
  } else {
    selectedLegendColor.value = colorValue
    updateStickerHighlights()
  }
}

function handleSvgClick(event) {
  const target = event.target
  if (!target.classList.contains('sticker')) return
  const stickerId = target.getAttribute('data-id')
  if (!stickerId) return

  if (selectedLegendColor.value) {
    target.setAttribute('fill', selectedLegendColor.value)
  } else {
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

function confirmLegendSvg() {
  const svgElement = document.querySelector('.svg-wrapper svg')
  if (!svgElement) {
    ElMessage.error('SVG获取失败')
    return
  }
  const svgData = new XMLSerializer().serializeToString(svgElement)

  if (currentEditingForm.value === 'add') {
    formData.value.image = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    formData.value.imageType = 'svg'
  } else if (currentEditingForm.value === 'edit') {
    formData.value.image = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    formData.value.imageType = 'svg'
  }

  templateSvgCache.value = { global: '', top: '' }
  ElMessage.success('模块图例已保存')
  showLegendDialog.value = false
}

function openLegendDialog(formType) {
  currentEditingForm.value = formType
  selectedLegendColor.value = null
  selectedStickers.value.clear()
  // 每次打开弹窗清空模板缓存，避免二阶/三阶模式间缓存串台
  templateSvgCache.value = { global: '', top: '' }

  const existingImage = formType === 'add' ? formData.value.image : formData.value.image

  if (existingImage && existingImage.includes('data:image/svg+xml')) {
    const parsedSvg = parseExistingSvg(existingImage)
    if (parsedSvg) {
      currentLegendTemplate.value = parsedSvg.template
      legendSvgContent.value = parsedSvg.svg
      currentLegendSvg.value = parsedSvg.svg
      templateSvgCache.value[parsedSvg.template] = parsedSvg.svg
      showLegendDialog.value = true
      return
    }
  }

  currentLegendTemplate.value = 'global'
  initLegendSvg(false)
  showLegendDialog.value = true
}

function parseExistingSvg(svgDataUrl) {
  try {
    const base64Data = svgDataUrl.replace(/^data:image\/svg\+xml;base64,/, '')
    const svgString = decodeURIComponent(escape(atob(base64Data)))

    const isGlobalView = svgString.includes('<polygon')
    const template = isGlobalView ? 'global' : 'top'

    const parser = new DOMParser()
    const doc = parser.parseFromString(svgString, 'image/svg+xml')
    const stickers = doc.querySelectorAll('.sticker')

    const stickerColors = {}
    stickers.forEach(sticker => {
      const id = sticker.getAttribute('data-id')
      const fill = sticker.getAttribute('fill')
      if (id && fill) {
        stickerColors[id] = fill
      }
    })

    const templates = templateMap[cubeModeStore.currentMode]
    const baseTemplate = isGlobalView ? templates.global : templates.top

    const templateDoc = parser.parseFromString(baseTemplate, 'image/svg+xml')
    const templateStickers = templateDoc.querySelectorAll('.sticker')
    templateStickers.forEach(sticker => {
      const id = sticker.getAttribute('data-id')
      if (stickerColors[id]) {
        sticker.setAttribute('fill', stickerColors[id])
      }
    })

    const serializer = new XMLSerializer()
    let svg = serializer.serializeToString(templateDoc)

    return { template, svg }
  } catch (e) {
    console.error('解析SVG失败:', e)
    return null
  }
}

function switchLegendTemplate(templateId) {
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

  const cachedSvg = templateSvgCache.value[templateId]
  const templates = templateMap[cubeModeStore.currentMode]
  if (cachedSvg) {
    legendSvgContent.value = cachedSvg
    currentLegendSvg.value = cachedSvg
  } else {
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
  const lightColors = ['#ffffff', '#ffff00', '#ee8800']
  return lightColors.includes(bgColor) ? '#333333' : '#ffffff'
}

function resetLegendToDefault() {
  const container = document.querySelector('.svg-wrapper')
  if (container) {
    const stickers = container.querySelectorAll('.sticker')
    stickers.forEach(sticker => {
      sticker.setAttribute('fill', '#888888')
    })
    templateSvgCache.value[currentLegendTemplate.value] = container.innerHTML
  }
  selectedStickers.value.clear()
  selectedLegendColor.value = null
  updateStickerHighlights()
}
</script>

<style scoped>
/* 首页特有样式（统一样式已提取到 index.css） */

.nav-bar-action {
  @apply p-2 rounded-lg text-black hover:bg-black/10 transition-colors;
}

/* 首页菜单样式 */
.home-menu {
  position: relative;
}

.home-menu-btn {
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

.home-menu-btn:hover {
  opacity: 0.8;
}

.home-menu-btn:active {
  transform: scale(0.9);
  opacity: 0.6;
}

.home-menu-dropdown {
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

.image-upload-area {
  @apply w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-brand transition-colors overflow-hidden;
}

.preview-image {
  @apply w-full h-full object-contain;
}

.upload-placeholder {
  @apply flex flex-col items-center gap-2;
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

/* 手动构造模块图例内容样式 */
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

/* 手动构造模块图例弹窗 */
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



/* 首次启动更新日志弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
}

.dialog-container {
  width: 100%;
  max-width: min(calc(100vw - 48px), 400px);
  max-height: calc(100vh - 48px);
  background: #FFFFFF;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  flex-shrink: 0;
}

.dialog-title {
  font-size: 17px;
  font-weight: 600;
  color: #1D2129;
}

.dialog-close {
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

.dialog-close:active {
  background: #F5F7FA;
}

.dialog-content {
  padding: 0 20px 20px;
  overflow-y: auto;
  flex: 1;
}

.update-log-subtitle {
  color: #1D2129;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  margin: 0 0 12px 0;
  line-height: 1.6;
}

.update-log-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.update-log-list li {
  color: #4E5969;
  font-size: 13px;
  line-height: 1.8;
  text-align: left;
  margin-bottom: 8px;
}

.update-log-list li:last-child {
  margin-bottom: 0;
}

.update-log-tip {
  color: #86909C;
  font-size: 12px;
  text-align: center;
  margin: 16px 0 0 0;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px 20px;
  flex-shrink: 0;
}

.dialog-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.cancel-btn {
  background: #F2F3F5;
  color: #1D2129;
}

.cancel-btn:active {
  background: #E5E7EB;
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
