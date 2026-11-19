<template>
  <div class="page-base module-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="handleBack">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="page-title">{{ module?.name || '模块' }}</h1>
        <div class="page-actions">
          <button v-if="!isDragging" class="page-action-btn" @click="openAddDialog">
            <Plus :size="24" />
          </button>
          <div v-if="!isDragging" class="module-menu" ref="menuRef">
            <button class="module-menu-btn" @click="showMenu = !showMenu">
              <MoreVertical :size="24" />
            </button>
            <div v-if="showMenu" class="module-menu-dropdown">
              <button class="menu-item" @click="showTipDialog = true; showMenu = false">
                提示信息
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe" ref="pageContainer"
      @click="handlePageAreaClick"
      @touchstart.passive="handlePageAreaTouch"
    >
      <div v-if="setStore.loading" class="flex items-center justify-center h-40">
        <el-icon class="is-loading text-brand text-2xl"><Loader /></el-icon>
      </div>

      <div v-else class="space-y-3">
        <!-- 内置"全部状态"始终显示在顶部 -->
        <div
          v-if="builtInSet"
          class="bg-card rounded-card p-4 flex items-center gap-3 module-card-shadow cursor-pointer hover:bg-gray-50 transition-colors"
          @click="goToSet(builtInSet)"
        >
          <div class="w-6 h-6 shrink-0"></div>
          <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <Layers :size="24" class="text-gray-500" />
          </div>
          <div class="flex-1">
            <h3 class="text-primary font-medium text-base">全部状态</h3>
            <p class="text-hint text-sm">{{ builtInSet?.desc || '该模块下所有状态' }}</p>
            <p class="text-hint text-sm">状态：{{ builtInSetStateCount }}个，已掌握：{{ builtInSetMasteredCount }}个</p>
          </div>
        </div>

        <!-- 自定义状态集 -->
        <draggable
          v-model="sortedSets"
          item-key="id"
          handle=".drag-handle"
          :animation="200"
          @start="isDragging = true"
          @end="handleDragEnd"
          class="space-y-3"
        >
          <template #item="{ element }">
            <SetListItem
              :set="element"
              :state-count="getSetStateCount(element.id)"
              :mastered-state-count="getMasteredStateCount(element.id)"
              @click="goToSet(element)"
              @edit="openEditDialog(element)"
              @delete="confirmDelete(element)"
            >
              <template #drag-handle>
                <div class="drag-handle p-1">
                  <GripVertical :size="18" class="text-hint" />
                </div>
              </template>
            </SetListItem>
          </template>
        </draggable>
      </div>

      <div v-if="!setStore.loading && customSets.length === 0"
           class="text-center text-hint mt-8">
        暂无自定义状态集，点击右上角添加
      </div>
      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 新增弹窗 -->
    <EditDialog
      v-model="showAddDialog"
      title="添加状态集"
      @submit="handleAdd"
    >
      <el-form label-position="top">
        <el-form-item label="状态集名称" required>
          <el-input v-model="addFormData.name" placeholder="请输入状态集名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="状态集描述">
          <el-input v-model="addFormData.desc" type="textarea" placeholder="请输入描述" maxlength="200" :rows="2" />
        </el-form-item>
      </el-form>
    </EditDialog>

    <EditDialog
      v-model="showEditDialog"
      title="编辑状态集"
      @submit="handleUpdate"
    >
      <el-form label-position="top">
        <el-form-item label="状态集名称" required>
          <el-input v-model="editFormData.name" placeholder="请输入状态集名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="状态集描述">
          <el-input v-model="editFormData.desc" type="textarea" placeholder="请输入描述" maxlength="200" :rows="2" />
        </el-form-item>
      </el-form>
    </EditDialog>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除状态集"
      :message="`确定要删除状态集「${deletingSet?.name}」吗？\n此操作不会删除状态集内的状态实体。`"
      confirm-text="删除"
      @confirm="handleDelete"
    />

    <!-- 提示信息弹窗 -->
    <ConfirmDialog
      v-model="showTipDialog"
      title="提示信息"
      message="左滑状态集卡片可编辑或删除状态集"
      confirm-text="关闭"
      :show-cancel="false"
      @confirm="showTipDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, MoreVertical, GripVertical, Layers, Loader } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { useModuleStore } from '@/stores/moduleStore'
import { useSetStore } from '@/stores/setStore'
import { useStateStore } from '@/stores/stateStore'
import { useFormulaStore } from '@/stores/formulaStore'
import SetListItem from '@/components/SetListItem.vue'
import EditDialog from '@/components/EditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { saveScrollPosition, getScrollPosition, clearScrollPosition, PAGE_KEYS } from '@/utils/scrollPosition'
import swipeMutex from '@/utils/swipeMutex.js'
// 调试开关（true开启日志，false关闭日志）
const DEBUG_ENABLE = false

const route = useRoute()
const router = useRouter()
const moduleStore = useModuleStore()
const setStore = useSetStore()
const stateStore = useStateStore()
const formulaStore = useFormulaStore()

// 滚动位置恢复相关
const pageContainer = ref(null)

const moduleId = computed(() => Number(route.params.id))
const module = computed(() => moduleStore.modules.find(m => m.id === moduleId.value))
const builtInSet = computed(() => setStore.sets.find(s => s.moduleId === moduleId.value && s.type === 'builtIn'))
const customSets = computed(() => setStore.sets.filter(s => s.moduleId === moduleId.value && s.type === 'custom'))

const sortedSets = computed({
  get: () => customSets.value,
  set: (val) => {
    const otherSets = setStore.sets.filter(s => s.type === 'builtIn' || s.moduleId !== moduleId.value)
    setStore.sets = [...otherSets, ...val]
  }
})

// 计算每个状态集的状态数量
function getSetStateCount(setId) {
  return stateStore.stateSetRels.filter(rel => rel.setId === setId).length
}

// 计算每个状态集的已掌握状态数量（状态下至少存在一条已掌握公式）
function getMasteredStateCount(setId) {
  const stateIds = stateStore.stateSetRels
    .filter(rel => rel.setId === setId)
    .map(rel => rel.stateId)
  return stateIds.filter(stateId =>
    formulaStore.formulas.some(f => f.stateId === stateId && f.mastered && !f.isScramble)
  ).length
}

// 全部状态的状态数量
const builtInSetStateCount = computed(() => {
  if (!builtInSet.value) return 0
  return getSetStateCount(builtInSet.value.id)
})

// 全部状态的已掌握状态数量
const builtInSetMasteredCount = computed(() => {
  if (!builtInSet.value) return 0
  return getMasteredStateCount(builtInSet.value.id)
})

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showTipDialog = ref(false)
const showMenu = ref(false)
const menuRef = ref(null)
const editingSet = ref(null)
const deletingSet = ref(null)
const isDragging = ref(false)

// 分离添加和编辑的表单数据
const addFormData = ref({ name: '', desc: '' })
const editFormData = ref({ name: '', desc: '' })

onMounted(async () => {
  await moduleStore.ensureFetched()
  await setStore.ensureFetched()
  await stateStore.ensureFetched()
  await formulaStore.ensureFetched()

  // 恢复滚动位置
  const savedScrollTop = getScrollPosition(PAGE_KEYS.MODULE, moduleId.value)
  DEBUG_ENABLE && console.log(`[ModulePage] onMounted, moduleId: ${moduleId.value}, savedScrollTop: ${savedScrollTop}`)

  nextTick(() => {
    if (savedScrollTop > 0) {
      window.scrollTo({ top: savedScrollTop, behavior: 'instant' })
      DEBUG_ENABLE && console.log(`[ModulePage] 恢复滚动位置: ${savedScrollTop}`)
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  })

  document.addEventListener('click', closeMenuOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})

function closeMenuOnClickOutside(e) {
  if (!showMenu.value) return
  const menuEl = e.target.closest('.module-menu')
  if (!menuEl) {
    showMenu.value = false
  }
}

// 返回到首页
function handleBack() {
  router.replace('/')
}

function handlePageAreaClick() {
  swipeMutex.closeAny()
}

function handlePageAreaTouch() {
  swipeMutex.closeAny()
}

function goToSet(set) {
  if (!set) return
  // 记录当前滚动位置（使用 window.scrollY 获取页面级滚动位置）
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop
  saveScrollPosition(PAGE_KEYS.MODULE, moduleId.value, scrollTop)
  DEBUG_ENABLE && console.log(`[ModulePage] 进入状态集页，记录滚动位置: ${scrollTop}`)
  
  // 清除状态集页的滚动位置记录，确保进入时从顶部显示
  clearScrollPosition(PAGE_KEYS.SET, set.id)
  DEBUG_ENABLE && console.log(`[ModulePage] 清除状态集页 ${set.id} 的滚动位置记录`)
  
  router.push(`/set/${set.id}?moduleId=${moduleId.value}`)
}

function openAddDialog() {
  addFormData.value = { name: '', desc: '' }
  showAddDialog.value = true
}

function openEditDialog(set) {
  editingSet.value = set
  editFormData.value = { name: set.name, desc: set.desc || '' }
  showEditDialog.value = true
}

function confirmDelete(set) {
  deletingSet.value = set
  showDeleteDialog.value = true
}

async function handleAdd() {
  if (!addFormData.value.name.trim()) {
    ElMessage.warning('请输入状态集名称')
    return
  }
  try {
    await setStore.addSet({ moduleId: moduleId.value, ...addFormData.value })
    ElMessage.success('添加成功')
    showAddDialog.value = false
    addFormData.value = { name: '', desc: '' }
  } catch (e) {
    ElMessage.error(e.message || '添加失败')
  }
}

async function handleUpdate() {
  if (!editFormData.value.name.trim()) {
    ElMessage.warning('请输入状态集名称')
    return
  }
  try {
    await setStore.updateSet(editingSet.value.id, {
      name: editFormData.value.name,
      desc: editFormData.value.desc
    })
    ElMessage.success('更新成功')
    showEditDialog.value = false
  } catch (e) {
    ElMessage.error(e.message || '更新失败')
  }
}

async function handleDelete() {
  try {
    await setStore.deleteSet(deletingSet.value.id)
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function handleDragEnd() {
  isDragging.value = false
  await setStore.updateSort(sortedSets.value)
  ElMessage.success('排序已保存')
}
</script>

<style scoped>
/* 模块页特有样式（统一样式已提取到 index.css） */

/* 卡片阴影 */
.module-card-shadow {
  box-shadow: 3px 5px 12px rgba(0, 0, 0, 0.08), 1px 2px 6px rgba(0, 0, 0, 0.04);
}

/* 三点菜单 */
.module-menu {
  position: relative;
}

.module-menu-btn {
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

.module-menu-btn:hover {
  opacity: 0.8;
}

.module-menu-btn:active {
  transform: scale(0.9);
  opacity: 0.6;
}

.module-menu-dropdown {
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
</style>
