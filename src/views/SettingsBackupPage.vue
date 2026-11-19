<template>
  <div class="page-base backup-page">
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">备份管理</h1>
      </div>
    </div>

    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <!-- 创建备份按钮 -->
      <div class="action-buttons">
        <button class="action-btn create-backup-btn" @click="openCreateDialog">
          <Plus :size="20" />
          <div class="action-info">
            <span class="action-title">创建备份</span>
            <span class="action-desc">在app内创建备份文件</span>
          </div>
        </button>
      </div>

      <!-- 备份列表 -->
      <div v-if="backups.length === 0" class="empty-state">
        <span class="empty-text">暂无备份</span>
      </div>
      <div v-else class="backup-list">
        <div v-for="item in backups" :key="item.id" class="backup-card">
          <div class="backup-info">
            <span class="backup-name">{{ item.name }}</span>
            <span class="backup-desc">{{ item.desc || '暂无描述' }}</span>
          </div>
          <div class="backup-actions">
            <button class="action-icon-btn edit-btn" @click="openEditDialog(item)">
              <Edit :size="16" />
            </button>
            <button class="action-icon-btn restore-btn" @click="openRestoreConfirm(item)">
              <RotateCw :size="16" />
            </button>
            <button class="action-icon-btn delete-btn" @click="openDeleteConfirm(item)">
              <Trash :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建备份弹窗 -->
    <EditDialog v-model="showCreateDialog" title="创建备份" @submit="handleCreate">
      <el-form label-position="top">
        <el-form-item label="备份名" required>
          <el-input v-model="backupForm.name" placeholder="请输入备份名" maxlength="50" />
        </el-form-item>
      </el-form>
      <div class="backup-mode-section">
        <div class="backup-mode-label">备份数据范围</div>
        <div class="backup-mode-list">
          <div
            class="backup-mode-item selectable"
            :class="{ selected: selectedBackupModes.includes('all') }"
            @click="toggleBackupMode('all')"
          >
            <div class="backup-checkbox" :class="{ checked: selectedBackupModes.includes('all') }">
              <Check v-if="selectedBackupModes.includes('all')" :size="14" />
            </div>
            <span class="backup-mode-name">全部数据</span>
          </div>
          <template v-for="mode in ALL_MODES" :key="mode">
            <div
              class="backup-mode-item selectable"
              :class="{ selected: selectedBackupModes.includes(mode) }"
              @click="toggleBackupMode(mode)"
            >
              <div
                class="backup-checkbox"
                :class="{ checked: selectedBackupModes.includes(mode), indeterminate: isBackupModePartiallySelected(mode) }"
              >
                <Check v-if="selectedBackupModes.includes(mode) && !isBackupModePartiallySelected(mode)" :size="14" />
                <Minus v-else-if="isBackupModePartiallySelected(mode)" :size="14" />
              </div>
              <span class="backup-mode-name">{{ MODE_LABELS[mode] }}</span>
              <span v-if="isBackupModePartiallySelected(mode)" class="backup-module-brief">
                已选 {{ selectedBackupModuleCount(mode) }}/{{ totalBackupModuleCount(mode) }} 模块
              </span>
              <button v-if="totalBackupModuleCount(mode) > 0" class="backup-expand-btn" @click.stop="toggleExpandBackupMode(mode)">
                <ChevronDown :size="18" class="backup-expand-icon" :class="{ rotated: expandedBackupModes.includes(mode) }" />
              </button>
            </div>
            <div v-if="expandedBackupModes.includes(mode)" class="backup-module-list">
              <div
                v-for="mod in backupModulesByMode[mode]"
                :key="mod.id"
                class="backup-module-item"
                @click="toggleBackupModule(mode, mod.id)"
              >
                <div class="backup-checkbox" :class="{ checked: selectedBackupModules[mode]?.includes(mod.id) }">
                  <Check v-if="selectedBackupModules[mode]?.includes(mod.id)" :size="14" />
                </div>
                <span class="backup-module-name">{{ mod.name }}</span>
                <span class="backup-module-type-tag">{{ mod.type === 'builtIn' ? '内置' : '自定义' }}</span>
              </div>
              <div v-if="backupModulesByMode[mode]?.length === 0" class="backup-module-empty">暂无模块</div>
            </div>
          </template>
        </div>
      </div>
      <el-form label-position="top">
        <el-form-item label="备份描述">
          <el-input v-model="backupForm.desc" type="textarea" placeholder="请输入备份描述" maxlength="200" :rows="3" />
        </el-form-item>
      </el-form>
    </EditDialog>

    <!-- 编辑备份弹窗 -->
    <EditDialog v-model="showEditDialog" title="编辑备份" @submit="handleEdit">
      <el-form label-position="top">
        <el-form-item label="备份名" required>
          <el-input v-model="editForm.name" placeholder="请输入备份名" maxlength="50" />
        </el-form-item>
        <el-form-item label="备份描述">
          <el-input v-model="editForm.desc" type="textarea" placeholder="请输入备份描述" maxlength="200" :rows="3" />
        </el-form-item>
      </el-form>
    </EditDialog>

    <!-- 恢复确认弹窗 -->
    <ConfirmDialog
      v-model="showRestoreDialog"
      title="恢复备份"
      message="恢复此备份将会覆盖现有数据，确认恢复吗？"
      confirm-text="恢复"
      @confirm="handleRestore"
    />

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除备份"
      message="确定要删除此备份吗？此操作无法恢复！"
      confirm-text="删除"
      @confirm="handleDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, Edit, RotateCw, Trash, Check, ChevronDown, Minus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import EditDialog from '@/components/EditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import db from '@/db'
import { exportAllData, importAllData, isModeDataEmpty, isModulesEmpty } from '@/utils/dataExporter'
import { ALL_MODES, MODE_LABELS } from '@/config/cubeModes'

const router = useRouter()

// 备份数据（存储在 IndexedDB / Dexie）
const MAX_BACKUPS = 10
const backups = ref([])

// 弹窗状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showRestoreDialog = ref(false)
const showDeleteDialog = ref(false)

// 表单数据
const backupForm = ref({ name: '', desc: '' })
const editForm = ref({ id: '', name: '', desc: '' })
const restoreTarget = ref(null)
const deleteTarget = ref(null)
const selectedBackupModes = ref([])
// 备份模块细化选择：各模式的模块列表、已勾选的模块 id 与已展开的模式
const backupModulesByMode = ref({ '2x2': [], '3x3': [], '4x4': [] })
const selectedBackupModules = ref({})
const expandedBackupModes = ref([])

function goBack() {
  router.replace('/settings/data')
}

async function loadBackups() {
  try {
    const list = await db.backups.orderBy('createdAt').reverse().toArray()
    backups.value = list
  } catch {
    backups.value = []
  }
}

function generateDefaultName(modes) {
  const now = new Date()
  const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const modeTag = (modes || ALL_MODES).join('-')
  return `formula-db-backup-${ts}-${modeTag}`
}

// ======== 备份模块细化选择 ========

function totalBackupModuleCount(mode) {
  return backupModulesByMode.value[mode]?.length || 0
}

function selectedBackupModuleCount(mode) {
  return selectedBackupModules.value[mode]?.length || 0
}

/** 该模式下仅勾选了部分模块（非空且非全选） */
function isBackupModePartiallySelected(mode) {
  const total = totalBackupModuleCount(mode)
  if (total === 0) return false
  const selected = selectedBackupModuleCount(mode)
  return selected > 0 && selected < total
}

function toggleExpandBackupMode(mode) {
  const index = expandedBackupModes.value.indexOf(mode)
  if (index >= 0) {
    expandedBackupModes.value.splice(index, 1)
  } else {
    expandedBackupModes.value.push(mode)
  }
}

/** 全部模式的所有模块都选中时才标记为"全部数据" */
function syncBackupAllFlag() {
  const allSelected = ALL_MODES.every(mode => {
    const total = totalBackupModuleCount(mode)
    if (total === 0) return selectedBackupModes.value.includes(mode)
    return selectedBackupModuleCount(mode) === total
  })

  if (allSelected) {
    if (!selectedBackupModes.value.includes('all')) {
      selectedBackupModes.value.unshift('all')
    }
  } else {
    selectedBackupModes.value = selectedBackupModes.value.filter(m => m !== 'all')
  }
}

/** 实际参与备份的模式：以模块勾选为准推导，避免与模式勾选态不同步 */
const effectiveBackupModes = computed(() => {
  return ALL_MODES.filter(mode => {
    if ((selectedBackupModules.value[mode]?.length || 0) > 0) return true
    return selectedBackupModes.value.includes(mode)
  })
})

/**
 * 生成备份用的模块白名单：只列部分勾选的模式，全选的模式按整模式备份
 * 注意必须展开成普通数组：selectedBackupModules 中的数组是 Vue 响应式 Proxy，
 * 直接塞进备份数据会导致 IndexedDB 结构化克隆失败（DataCloneError）
 */
function buildBackupModuleFilters(targetModes) {
  const filters = {}
  for (const mode of targetModes) {
    const total = totalBackupModuleCount(mode)
    if (total === 0) continue
    const selected = selectedBackupModules.value[mode] || []
    if (selected.length > 0 && selected.length < total) {
      filters[mode] = [...selected]
    }
  }
  return Object.keys(filters).length > 0 ? filters : null
}

function toggleBackupMode(mode) {
  if (mode === 'all') {
    if (selectedBackupModes.value.includes('all')) {
      selectedBackupModes.value = []
      ALL_MODES.forEach(m => { selectedBackupModules.value[m] = [] })
    } else {
      selectedBackupModes.value = ['all', ...ALL_MODES]
      ALL_MODES.forEach(m => {
        selectedBackupModules.value[m] = backupModulesByMode.value[m].map(mod => mod.id)
      })
    }
  } else {
    if (selectedBackupModes.value.includes(mode)) {
      selectedBackupModes.value = selectedBackupModes.value.filter(m => m !== mode && m !== 'all')
      selectedBackupModules.value[mode] = []
    } else {
      selectedBackupModes.value.push(mode)
      selectedBackupModules.value[mode] = backupModulesByMode.value[mode].map(mod => mod.id)
      syncBackupAllFlag()
    }
  }
  refreshDefaultName()
}

function toggleBackupModule(mode, moduleId) {
  const list = selectedBackupModules.value[mode] || []
  const next = list.includes(moduleId)
    ? list.filter(id => id !== moduleId)
    : [...list, moduleId]
  selectedBackupModules.value[mode] = next

  if (next.length === 0) {
    // 模块全不选等同于取消该模式
    selectedBackupModes.value = selectedBackupModes.value.filter(m => m !== mode && m !== 'all')
  } else {
    // 只要该模式下还有选中的模块，就代表该模式已选
    if (!selectedBackupModes.value.includes(mode)) {
      selectedBackupModes.value = [...selectedBackupModes.value.filter(m => m !== 'all'), mode]
    }
    syncBackupAllFlag()
  }
  refreshDefaultName()
}

/** 勾选/取消后重新生成文件名，保持模式标签与选中状态同步 */
function refreshDefaultName() {
  const modes = effectiveBackupModes.value
  backupForm.value.name = generateDefaultName(modes.length === ALL_MODES.length ? ALL_MODES : modes)
}

/** 读取各模式下的模块列表，供备份时勾选 */
async function loadBackupModules() {
  const lists = await Promise.all(
    ALL_MODES.map(mode => db.modules.where('cubeMode').equals(mode).sortBy('sort'))
  )
  backupModulesByMode.value = ALL_MODES.reduce((acc, mode, i) => {
    acc[mode] = lists[i]
    return acc
  }, {})
}

async function openCreateDialog() {
  await loadBackupModules()
  selectedBackupModes.value = ['all', ...ALL_MODES]
  selectedBackupModules.value = ALL_MODES.reduce((acc, mode) => {
    acc[mode] = backupModulesByMode.value[mode].map(m => m.id)
    return acc
  }, {})
  expandedBackupModes.value = []
  backupForm.value.name = generateDefaultName(ALL_MODES)
  backupForm.value.desc = ''
  showCreateDialog.value = true
}

async function handleCreate() {
  const name = backupForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入备份名')
    return
  }
  const modes = effectiveBackupModes.value
  if (modes.length === 0) {
    ElMessage.warning('请至少选择一个模块')
    return
  }
  const exportModes = modes.length === ALL_MODES.length ? null : modes
  const moduleFilters = buildBackupModuleFilters(modes)
  // 校验选中范围的数据是否全部为空：细到模块时按模块检查，否则按模式检查
  const emptyChecks = await Promise.all(modes.map(m => {
    const ids = moduleFilters?.[m]
    return ids ? isModulesEmpty(ids) : isModeDataEmpty(m)
  }))
  if (emptyChecks.every(empty => empty)) {
    ElMessage.warning('所选数据均为空，无需创建备份')
    return
  }
  // 同名检查
  const existing = await db.backups.where('name').equals(name).first()
  if (existing) {
    ElMessage.warning('已存在同名的备份，请修改备份名')
    return
  }
  // 上限检查
  const count = await db.backups.count()
  if (count >= MAX_BACKUPS) {
    ElMessage.warning(`最多只能创建 ${MAX_BACKUPS} 个备份，请先删除部分备份`)
    return
  }
  try {
    const data = await exportAllData(exportModes, moduleFilters)
    const id = await db.backups.add({
      name,
      desc: backupForm.value.desc.trim(),
      data,
      createdAt: new Date().toISOString()
    })
    // 刷新列表，新备份排在最前
    const newBackup = await db.backups.get(id)
    backups.value.unshift(newBackup)
    ElMessage.success('备份创建成功')
    showCreateDialog.value = false
    selectedBackupModes.value = []
    selectedBackupModules.value = {}
    expandedBackupModes.value = []
  } catch (e) {
    console.error('创建备份失败:', e)
    ElMessage.error(e.message || '创建备份失败')
  }
}

function openEditDialog(item) {
  editForm.value.id = item.id
  editForm.value.name = item.name
  editForm.value.desc = item.desc || ''
  showEditDialog.value = true
}

async function handleEdit() {
  const name = editForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入备份名')
    return
  }
  // 同名检查（排除自身）
  const existing = await db.backups.where('name').equals(name).first()
  if (existing && existing.id !== editForm.value.id) {
    ElMessage.warning('已存在同名的备份，请修改备份名')
    return
  }
  try {
    await db.backups.update(editForm.value.id, {
      name,
      desc: editForm.value.desc.trim()
    })
    // 同步更新本地状态
    const idx = backups.value.findIndex(b => b.id === editForm.value.id)
    if (idx !== -1) {
      backups.value[idx].name = name
      backups.value[idx].desc = editForm.value.desc.trim()
    }
    ElMessage.success('修改成功')
    showEditDialog.value = false
  } catch (e) {
    console.error('编辑失败:', e)
    ElMessage.error('编辑失败')
  }
}

function openRestoreConfirm(item) {
  restoreTarget.value = item
  showRestoreDialog.value = true
}

async function handleRestore() {
  if (!restoreTarget.value?.data) {
    ElMessage.error('备份数据无效')
    return
  }
  try {
    await importAllData(restoreTarget.value.data)
    ElMessage.success('恢复成功')
    showRestoreDialog.value = false
    restoreTarget.value = null
  } catch (e) {
    console.error('恢复失败:', e)
    ElMessage.error(e.message || '恢复失败')
  }
}

function openDeleteConfirm(item) {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    await db.backups.delete(deleteTarget.value.id)
    backups.value = backups.value.filter(b => b.id !== deleteTarget.value.id)
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
    deleteTarget.value = null
  } catch (e) {
    console.error('删除失败:', e)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadBackups()
})
</script>

<style scoped>
/* 备份管理页特有样式（统一样式已提取到 index.css） */

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:active {
  transform: scale(0.98);
}

.create-backup-btn {
  background: #FFFFFF;
  color: #1D2129;
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
}

.action-desc {
  font-size: 12px;
  opacity: 0.8;
}

.empty-state {
  padding: 48px 16px;
  text-align: center;
}

.empty-text {
  color: #86909C;
  font-size: 14px;
}

.backup-list {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.backup-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.backup-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backup-name {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
}

.backup-desc {
  font-size: 12px;
  color: #86909C;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  shrink: 0;
}

.action-icon-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.edit-btn {
  color: #165DFF;
  background: #E8F0FE;
}

.edit-btn:hover {
  background: #D4E4FC;
}

.restore-btn {
  color: #00B42A;
  background: #F0FDF4;
}

.restore-btn:hover {
  background: #D5F0E0;
}

.delete-btn {
  color: #F53F3F;
  background: #FFF7F7;
}

.delete-btn:hover {
  background: #FFECEC;
}

.backup-mode-section {
  margin-bottom: 18px;
}

.backup-mode-label {
  font-size: 14px;
  color: #606266;
  padding: 0 0 8px;
}

.backup-mode-list {
  max-height: min(50vh, 360px);
  overflow-y: auto;
}

.backup-mode-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.backup-mode-item:hover {
  background: #F5F7FA;
}

.backup-mode-item.selected {
  background: transparent;
}

.backup-mode-item:last-child {
  border-bottom: none;
}

.backup-checkbox {
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

.backup-checkbox.checked {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

/* 部分选中：蓝框内显示减号 */
.backup-checkbox.indeterminate {
  border-color: #165DFF;
  color: #165DFF;
}

.backup-mode-name {
  font-size: 14px;
  color: #1D2129;
  flex: 1;
}

/* ======== 备份模块细化选择（模式行下的展开列表） ======== */
.backup-module-brief {
  font-size: 12px;
  color: #86909C;
  flex-shrink: 0;
}

.backup-expand-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  color: #C9CDD4;
  cursor: pointer;
  flex-shrink: 0;
}

.backup-expand-icon {
  transition: transform 0.2s;
}

.backup-expand-icon.rotated {
  transform: rotate(180deg);
}

.backup-module-list {
  background: #F7F8FA;
  padding: 4px 0;
}

.backup-module-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 44px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.backup-module-item:active {
  background: #EEF0F4;
}

.backup-module-name {
  font-size: 14px;
  color: #4E5969;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.backup-module-type-tag {
  font-size: 11px;
  color: #86909C;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
  padding: 1px 4px;
  flex-shrink: 0;
}

.backup-module-empty {
  padding: 10px 16px 10px 44px;
  font-size: 12px;
  color: #C9CDD4;
}
</style>
