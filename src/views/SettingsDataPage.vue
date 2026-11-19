<template>
  <div class="page-base settingsdata-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="goBack">
          <ArrowLeft :size="22" />
        </button>
        <h1 class="page-title">数据管理</h1>
      </div>
    </div>

    <!-- 内容列表区 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe">
      <div class="action-buttons">
        <button class="action-btn backup-btn" @click="goBackup">
          <HardDrive :size="20" />
          <div class="action-info">
            <span class="action-title">备份管理</span>
            <span class="action-desc">在app内创建/恢复数据</span>
          </div>
          <ChevronRight :size="18" class="arrow-icon" />
        </button>
        <button class="action-btn export-btn" @click="handleExport">
          <Download :size="20" />
          <div class="action-info">
            <span class="action-title">导出数据</span>
            <span class="action-desc">将数据备份为 JSON 文件</span>
          </div>
        </button>
        <button class="action-btn import-btn" @click="triggerImport">
          <Upload :size="20" />
          <div class="action-info">
            <span class="action-title">导入数据</span>
            <span class="action-desc">从 JSON 文件恢复数据</span>
          </div>
        </button>
        <button class="action-btn reset-btn" @click="handleResetClick">
          <RotateCcw :size="20" />
          <div class="action-info">
            <span class="action-title">重置数据</span>
            <span class="action-desc">删除所有自定义数据</span>
          </div>
        </button>
      </div>
      <input type="file" ref="importInput" accept=".json" class="hidden" @change="handleImport" />
    </div>

    <!-- 重置确认弹窗 -->
    <ConfirmDialog
      v-model="showResetDialog"
      title="重置确认"
      :message="resetConfirmMessage"
      confirm-text="重置"
      @confirm="handleReset"
    />

    <!-- 导入确认弹窗 -->
    <ConfirmDialog
      v-model="showImportDialog"
      title="导入确认"
      :message="importConfirmMessage"
      confirm-text="导入"
      @confirm="confirmImport"
    />

    <!-- 导出数据选择弹窗 -->
    <EditDialog v-model="showExportDialog" title="导出数据" @submit="handleExportConfirm">
      <div class="export-mode-list tree-list">
        <div
          class="export-mode-item selectable"
          :class="{ selected: selectedExportModes.includes('all') }"
          @click="toggleExportMode('all')"
        >
          <div class="export-checkbox" :class="{ checked: selectedExportModes.includes('all') }">
            <Check v-if="selectedExportModes.includes('all')" :size="14" />
          </div>
          <span class="export-mode-name">全部数据</span>
        </div>
        <template v-for="mode in ALL_MODES" :key="mode">
          <div
            class="export-mode-item selectable"
            :class="{ selected: selectedExportModes.includes(mode) }"
            @click="toggleExportMode(mode)"
          >
            <div
              class="export-checkbox"
              :class="{ checked: selectedExportModes.includes(mode), indeterminate: isModePartiallySelected(mode) }"
            >
              <Check v-if="selectedExportModes.includes(mode) && !isModePartiallySelected(mode)" :size="14" />
              <Minus v-else-if="isModePartiallySelected(mode)" :size="14" />
            </div>
            <span class="export-mode-name">{{ MODE_LABELS[mode] }}</span>
            <span v-if="isModePartiallySelected(mode)" class="module-brief">
              已选 {{ selectedModuleCount(mode) }}/{{ totalModuleCount(mode) }} 模块
            </span>
            <button class="expand-btn" @click.stop="toggleExpandMode(mode)">
              <ChevronDown :size="18" class="expand-icon" :class="{ rotated: expandedExportModes.includes(mode) }" />
            </button>
          </div>
          <div v-if="expandedExportModes.includes(mode)" class="export-module-list">
            <div
              v-for="mod in modulesByMode[mode]"
              :key="mod.id"
              class="export-module-item"
              @click="toggleExportModule(mode, mod.id)"
            >
              <div class="export-checkbox" :class="{ checked: selectedExportModules[mode]?.includes(mod.id) }">
                <Check v-if="selectedExportModules[mode]?.includes(mod.id)" :size="14" />
              </div>
              <span class="export-module-name">{{ mod.name }}</span>
              <span class="module-type-tag">{{ mod.type === 'builtIn' ? '内置' : '自定义' }}</span>
            </div>
            <div v-if="modulesByMode[mode]?.length === 0" class="export-module-empty">暂无模块</div>
          </div>
        </template>
      </div>
    </EditDialog>

    <!-- 导入数据选择弹窗 -->
    <EditDialog v-model="showImportModeDialog" title="导入数据" @submit="handleImportModeConfirm">
      <div class="export-mode-list tree-list">
        <div
          class="export-mode-item selectable"
          :class="{ selected: selectedImportModes.includes('all') }"
          @click="toggleImportMode('all')"
        >
          <div class="export-checkbox" :class="{ checked: selectedImportModes.includes('all') }">
            <Check v-if="selectedImportModes.includes('all')" :size="14" />
          </div>
          <span class="export-mode-name">全部数据</span>
        </div>
        <template v-for="mode in fileIncludedModes" :key="mode">
          <div
            class="export-mode-item selectable"
            :class="{ selected: selectedImportModes.includes(mode) }"
            @click="toggleImportMode(mode)"
          >
            <div
              class="export-checkbox"
              :class="{ checked: selectedImportModes.includes(mode), indeterminate: isImportModePartiallySelected(mode) }"
            >
              <Check v-if="selectedImportModes.includes(mode) && !isImportModePartiallySelected(mode)" :size="14" />
              <Minus v-else-if="isImportModePartiallySelected(mode)" :size="14" />
            </div>
            <span class="export-mode-name">{{ MODE_LABELS[mode] }}</span>
            <span v-if="isImportModePartiallySelected(mode)" class="module-brief">
              已选 {{ selectedImportModuleCount(mode) }}/{{ totalImportModuleCount(mode) }} 模块
            </span>
            <button v-if="totalImportModuleCount(mode) > 0" class="expand-btn" @click.stop="toggleExpandImportMode(mode)">
              <ChevronDown :size="18" class="expand-icon" :class="{ rotated: expandedImportModes.includes(mode) }" />
            </button>
          </div>
          <div v-if="expandedImportModes.includes(mode)" class="export-module-list">
            <div
              v-for="mod in importModulesByMode[mode]"
              :key="mod.id"
              class="export-module-item"
              @click="toggleImportModule(mode, mod.id)"
            >
              <div class="export-checkbox" :class="{ checked: selectedImportModules[mode]?.includes(mod.id) }">
                <Check v-if="selectedImportModules[mode]?.includes(mod.id)" :size="14" />
              </div>
              <span class="export-module-name">{{ mod.name }}</span>
              <span
                v-if="existingModuleNames[mode]?.includes(mod.name)"
                class="module-type-tag exists-tag"
              >已存在</span>
            </div>
            <div v-if="importModulesByMode[mode]?.length === 0" class="export-module-empty">暂无模块</div>
          </div>
        </template>
      </div>
    </EditDialog>

    <!-- 重置数据选择弹窗 -->
    <EditDialog v-model="showResetModeDialog" title="重置数据" @submit="handleResetModeConfirm">
      <div class="export-mode-list tree-list">
        <div
          class="export-mode-item selectable"
          :class="{ selected: selectedResetModes.includes('all') }"
          @click="toggleResetMode('all')"
        >
          <div class="export-checkbox" :class="{ checked: selectedResetModes.includes('all') }">
            <Check v-if="selectedResetModes.includes('all')" :size="14" />
          </div>
          <span class="export-mode-name">全部数据</span>
        </div>
        <template v-for="mode in ALL_MODES" :key="mode">
          <div
            class="export-mode-item selectable"
            :class="{ selected: selectedResetModes.includes(mode) }"
            @click="toggleResetMode(mode)"
          >
            <div
              class="export-checkbox"
              :class="{ checked: selectedResetModes.includes(mode), indeterminate: isResetModePartiallySelected(mode) }"
            >
              <Check v-if="selectedResetModes.includes(mode) && !isResetModePartiallySelected(mode)" :size="14" />
              <Minus v-else-if="isResetModePartiallySelected(mode)" :size="14" />
            </div>
            <span class="export-mode-name">{{ MODE_LABELS[mode] }}</span>
            <span v-if="isResetModePartiallySelected(mode)" class="module-brief">
              已选 {{ selectedResetModuleCount(mode) }}/{{ totalModuleCount(mode) }} 模块
            </span>
            <button v-if="totalModuleCount(mode) > 0" class="expand-btn" @click.stop="toggleExpandResetMode(mode)">
              <ChevronDown :size="18" class="expand-icon" :class="{ rotated: expandedResetModes.includes(mode) }" />
            </button>
          </div>
          <div v-if="expandedResetModes.includes(mode)" class="export-module-list">
            <div
              v-for="mod in modulesByMode[mode]"
              :key="mod.id"
              class="export-module-item"
              @click="toggleResetModule(mode, mod.id)"
            >
              <div class="export-checkbox" :class="{ checked: selectedResetModules[mode]?.includes(mod.id) }">
                <Check v-if="selectedResetModules[mode]?.includes(mod.id)" :size="14" />
              </div>
              <span class="export-module-name">{{ mod.name }}</span>
              <span class="module-type-tag">{{ mod.type === 'builtIn' ? '内置' : '自定义' }}</span>
            </div>
            <div v-if="modulesByMode[mode]?.length === 0" class="export-module-empty">暂无模块</div>
          </div>
        </template>
      </div>
    </EditDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Download, Upload, RotateCcw, HardDrive, ChevronRight, ChevronDown, Check, Minus } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import db from '@/db'
import { useModuleStore } from '@/stores/moduleStore'
import { useSetStore } from '@/stores/setStore'
import { useStateStore } from '@/stores/stateStore'
import { useFormulaStore } from '@/stores/formulaStore'
import { useSettingStore } from '@/stores/settingStore'
import {
  exportAllData,
  importAllData,
  resetAllData,
  analyzeBackupModes,
  analyzeBackupModules,
  analyzeImportConflicts,
  isModeDataEmpty,
  isModulesEmpty
} from '@/utils/dataExporter'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import EditDialog from '@/components/EditDialog.vue'

const router = useRouter()
const moduleStore = useModuleStore()
const setStore = useSetStore()
const stateStore = useStateStore()
const formulaStore = useFormulaStore()
const settingStore = useSettingStore()

const showResetDialog = ref(false)
const showImportDialog = ref(false)
const showExportDialog = ref(false)
const selectedExportModes = ref([])
const pendingImportData = ref(null)
const importInput = ref(null)

// 导出模块细化选择：按模式缓存模块列表与已勾选的模块 id
const modulesByMode = ref({ '2x2': [], '3x3': [], '4x4': [] })
const selectedExportModules = ref({})
const expandedExportModes = ref([])

// 导入相关状态
const showImportModeDialog = ref(false)
const fileIncludedModes = ref([])
const selectedImportModes = ref([])

// 导入模块细化选择：备份文件中的模块列表，以及标记为「本地已存在」的模块名
const importModulesByMode = ref({ '2x2': [], '3x3': [], '4x4': [] })
const existingModuleNames = ref({ '2x2': [], '3x3': [], '4x4': [] })
const selectedImportModules = ref({})
const expandedImportModes = ref([])
// 备份文件是否为旧版本：旧版不支持模块化增量导入
const isLegacyBackup = ref(false)
// 本次导入的冲突分析结果
const importOverwriteList = ref([])
const importFreshList = ref([])

// 重置相关状态
const showResetModeDialog = ref(false)
const selectedResetModes = ref([])
// 重置模块细化选择：勾选的模块 id 与已展开的模式（模块列表复用导出的 modulesByMode）
const selectedResetModules = ref({})
const expandedResetModes = ref([])

const ALL_MODES = ['2x2', '3x3', '4x4']
const MODE_LABELS = { '2x2': '二阶', '3x3': '三阶', '4x4': '四阶' }

function goBack() {
  router.replace('/settings')
}

function goBackup() {
  router.push('/settings/data/backup')
}

function toggleExportMode(mode) {
  if (mode === 'all') {
    if (selectedExportModes.value.includes('all')) {
      selectedExportModes.value = []
      ALL_MODES.forEach(clearModeModules)
    } else {
      selectedExportModes.value = ['all', ...ALL_MODES]
      ALL_MODES.forEach(selectAllModeModules)
    }
  } else {
    if (selectedExportModes.value.includes(mode)) {
      selectedExportModes.value = selectedExportModes.value.filter(m => m !== mode && m !== 'all')
      clearModeModules(mode)
    } else {
      selectedExportModes.value.push(mode)
      selectAllModeModules(mode)
      if (ALL_MODES.every(m => selectedExportModes.value.includes(m))) {
        if (!selectedExportModes.value.includes('all')) {
          selectedExportModes.value.unshift('all')
        }
      }
    }
  }
}

// ======== 导出模块细化选择 ========

function totalModuleCount(mode) {
  return modulesByMode.value[mode]?.length || 0
}

function selectedModuleCount(mode) {
  return selectedExportModules.value[mode]?.length || 0
}

/** 该模式下仅勾选了部分模块（非空且非全选） */
function isModePartiallySelected(mode) {
  const total = totalModuleCount(mode)
  if (total === 0) return false
  const selected = selectedModuleCount(mode)
  return selected > 0 && selected < total
}

function selectAllModeModules(mode) {
  selectedExportModules.value[mode] = modulesByMode.value[mode].map(m => m.id)
}

function clearModeModules(mode) {
  selectedExportModules.value[mode] = []
}

function toggleExpandMode(mode) {
  const index = expandedExportModes.value.indexOf(mode)
  if (index >= 0) {
    expandedExportModes.value.splice(index, 1)
  } else {
    expandedExportModes.value.push(mode)
  }
}

function toggleExportModule(mode, moduleId) {
  const list = selectedExportModules.value[mode] || []
  const next = list.includes(moduleId)
    ? list.filter(id => id !== moduleId)
    : [...list, moduleId]
  selectedExportModules.value[mode] = next

  if (next.length === 0) {
    // 模块全不选等同于取消该模式
    selectedExportModes.value = selectedExportModes.value.filter(m => m !== mode && m !== 'all')
  } else {
    // 只要该模式下还有选中的模块，就代表该模式已选
    // （覆盖"先取消模式、再单独勾选模块"的情况，避免模式勾选态漏更新导致误判未选）
    if (!selectedExportModes.value.includes(mode)) {
      selectedExportModes.value = [...selectedExportModes.value.filter(m => m !== 'all'), mode]
    }
    syncAllFlag()
  }
}

/** 全部模式都选中时才标记为"全部数据" */
function syncAllFlag() {
  if (ALL_MODES.every(m => selectedExportModes.value.includes(m))) {
    if (!selectedExportModes.value.includes('all')) {
      selectedExportModes.value.unshift('all')
    }
  }
}

/**
 * 实际参与导出的模式
 * 以模块勾选为准推导，避免与模式勾选态不同步：
 * 只要某模式下有选中的模块即算选中；即便该模式没有任何模块（如空数据的二阶），
 * 直接勾选模式行也有效
 */
const effectiveExportModes = computed(() => {
  return ALL_MODES.filter(mode => {
    if ((selectedExportModules.value[mode]?.length || 0) > 0) return true
    return selectedExportModes.value.includes(mode)
  })
})

/**
 * 生成传给 exportAllData 的模块过滤器
 * 只针对部分勾选模块的模式建立白名单，全选的模式整模式导出（避免遗漏游离数据）
 */
function buildModuleFilters(checkModes) {
  const filters = {}
  for (const mode of checkModes) {
    const total = totalModuleCount(mode)
    if (total === 0) continue
    const selected = selectedExportModules.value[mode] || []
    if (selected.length > 0 && selected.length < total) {
      filters[mode] = selected
    }
  }
  return Object.keys(filters).length > 0 ? filters : null
}

async function handleExportConfirm() {
  const modes = effectiveExportModes.value
  if (modes.length === 0) {
    ElMessage.warning('请至少选择一个模式')
    return
  }

  const exportModes = modes.length === ALL_MODES.length ? null : modes

  const checkModes = exportModes || ALL_MODES
  const moduleFilters = buildModuleFilters(checkModes)

  // 校验选中范围的数据是否为空：细到模块时按模块检查，否则按模式检查
  const emptyChecks = await Promise.all(checkModes.map(m => {
    const ids = moduleFilters?.[m]
    return ids ? isModulesEmpty(ids) : isModeDataEmpty(m)
  }))
  if (emptyChecks.every(empty => empty)) {
    ElMessage.warning('所选数据均为空，无需导出')
    return
  }

  try {
    const data = await exportAllData(exportModes, moduleFilters)
    const jsonString = JSON.stringify(data, null, 2)
    const now = new Date()
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    const modeTag = (exportModes || ALL_MODES).join('-')
    const fileName = `formula-db-backup-${ts}-${modeTag}.json`

    const { Capacitor } = await import('@capacitor/core')
    const platform = Capacitor.getPlatform()

    if (platform === 'android') {
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      await Filesystem.writeFile({
        path: fileName,
        data: jsonString,
        directory: Directory.Documents,
        encoding: 'utf8',
        recursive: true
      })
      ElMessage.success(`导出成功，文件已保存到 Documents 目录`)
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    }
    showExportDialog.value = false
    selectedExportModes.value = []
    selectedExportModules.value = {}
    expandedExportModes.value = []
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error(e.message || '导出失败')
  }
}

/** 读取各模式下的模块列表，供导出时勾选 */
async function loadModulesForExport() {
  const lists = await Promise.all(
    ALL_MODES.map(mode => db.modules.where('cubeMode').equals(mode).sortBy('sort'))
  )
  modulesByMode.value = ALL_MODES.reduce((acc, mode, i) => {
    acc[mode] = lists[i]
    return acc
  }, {})
}

async function handleExport() {
  await loadModulesForExport()
  selectedExportModes.value = ['all', ...ALL_MODES]
  selectedExportModules.value = ALL_MODES.reduce((acc, mode) => {
    acc[mode] = modulesByMode.value[mode].map(m => m.id)
    return acc
  }, {})
  expandedExportModes.value = []
  showExportDialog.value = true
}

function triggerImport() {
  importInput.value?.click()
}

function handleImport(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      pendingImportData.value = data
      // 分析文件中包含哪些模式
      const includedModes = analyzeBackupModes(data)
      if (includedModes.length === 0) {
        ElMessage.warning('导入的文件中数据为空，未找到需要导入的自定义数据')
        return
      }
      fileIncludedModes.value = includedModes
      const version = Number(data.version || 0)
      isLegacyBackup.value = version < 3

      // 旧版备份文件沿用原有的「整模式覆盖」流程，不做模块级选择
      if (isLegacyBackup.value) {
        importModulesByMode.value = ALL_MODES.reduce((acc, m) => { acc[m] = []; return acc }, {})
        selectedImportModules.value = {}
        expandedImportModes.value = []
        if (includedModes.length === 1) {
          selectedImportModes.value = [...includedModes]
          showImportDialog.value = true
        } else {
          selectedImportModes.value = ['all', ...includedModes]
          showImportModeDialog.value = true
        }
        return
      }

      // 新版：解析文件中的模块，同时标记本地已存在的同名模块
      await prepareImportModules(data, includedModes)
      showImportModeDialog.value = true
    } catch (err) {
      ElMessage.error('文件格式错误')
    }
  }
  reader.readAsText(file)
  // 清空 input 的 value，允许重复选择同一文件
  e.target.value = ''
}

/** 解析备份文件各模式的模块，并默认全选；同时记录本地已存在的模块名 */
async function prepareImportModules(data, includedModes) {
  const byMode = analyzeBackupModules(data)
  importModulesByMode.value = byMode
  selectedImportModules.value = includedModes.reduce((acc, mode) => {
    acc[mode] = byMode[mode].map(m => m.id)
    return acc
  }, {})
  // 默认展开有模块的模式，让用户直接看到「模式下有哪些模块」
  expandedImportModes.value = includedModes.filter(mode => byMode[mode]?.length > 0)
  selectedImportModes.value = ['all', ...includedModes]

  const names = ALL_MODES.reduce((acc, mode) => { acc[mode] = []; return acc }, {})
  await Promise.all(includedModes.map(async mode => {
    const locals = await db.modules.where('cubeMode').equals(mode).toArray()
    names[mode] = locals.map(m => m.name)
  }))
  existingModuleNames.value = names
}

// ======== 导入模块细化选择 ========

function totalImportModuleCount(mode) {
  return importModulesByMode.value[mode]?.length || 0
}

function selectedImportModuleCount(mode) {
  return selectedImportModules.value[mode]?.length || 0
}

function isImportModePartiallySelected(mode) {
  if (isLegacyBackup.value) return false
  const total = totalImportModuleCount(mode)
  if (total === 0) return false
  const selected = selectedImportModuleCount(mode)
  return selected > 0 && selected < total
}

function toggleExpandImportMode(mode) {
  const index = expandedImportModes.value.indexOf(mode)
  if (index >= 0) {
    expandedImportModes.value.splice(index, 1)
  } else {
    expandedImportModes.value.push(mode)
  }
}

function selectAllImportModules(mode) {
  selectedImportModules.value[mode] = importModulesByMode.value[mode].map(m => m.id)
}

function clearImportModules(mode) {
  selectedImportModules.value[mode] = []
}

function toggleImportModule(mode, moduleId) {
  if (isLegacyBackup.value) return
  const list = selectedImportModules.value[mode] || []
  const next = list.includes(moduleId)
    ? list.filter(id => id !== moduleId)
    : [...list, moduleId]
  selectedImportModules.value[mode] = next

  if (next.length === 0) {
    selectedImportModes.value = selectedImportModes.value.filter(m => m !== mode && m !== 'all')
  } else {
    if (!selectedImportModes.value.includes(mode)) {
      selectedImportModes.value = [...selectedImportModes.value.filter(m => m !== 'all'), mode]
    }
    syncImportAllFlag()
  }
}

function syncImportAllFlag() {
  if (fileIncludedModes.value.every(m => selectedImportModes.value.includes(m))) {
    if (!selectedImportModes.value.includes('all')) {
      selectedImportModes.value.unshift('all')
    }
  }
}

/** 实际参与导入的模式：以模块勾选为准推导，避免两个状态不同步 */
const effectiveImportModes = computed(() => {
  return fileIncludedModes.value.filter(mode => {
    if ((selectedImportModules.value[mode]?.length || 0) > 0) return true
    return selectedImportModes.value.includes(mode)
  })
})

function toggleImportMode(mode) {
  if (mode === 'all') {
    if (selectedImportModes.value.includes('all')) {
      selectedImportModes.value = []
      fileIncludedModes.value.forEach(clearImportModules)
    } else {
      selectedImportModes.value = ['all', ...fileIncludedModes.value]
      fileIncludedModes.value.forEach(selectAllImportModules)
    }
  } else {
    if (selectedImportModes.value.includes(mode)) {
      selectedImportModes.value = selectedImportModes.value.filter(m => m !== mode && m !== 'all')
      clearImportModules(mode)
    } else {
      selectedImportModes.value.push(mode)
      selectAllImportModules(mode)
      syncImportAllFlag()
    }
  }
}

// 导入确认弹窗的提示信息：区分「覆盖更新」与「增量新增」
const importConfirmMessage = computed(() => {
  if (isLegacyBackup.value) {
    const modes = selectedImportModes.value.filter(m => m !== 'all')
    const hasAll = selectedImportModes.value.includes('all')
    const modeText = hasAll
      ? fileIncludedModes.value.map(m => MODE_LABELS[m] || m).join('、')
      : modes.map(m => MODE_LABELS[m] || m).join('、')
    return `该文件为旧版备份，不支持增量导入，\n将清空并覆盖模式（${modeText}）的现有数据。\n确定要继续吗？`
  }

  const overwrite = importOverwriteList.value.map(item => item.name)
  const fresh = importFreshList.value.map(item => item.name)
  const lines = []

  if (overwrite.length > 0) {
    lines.push(`以下模块已存在，将被覆盖更新：\n${overwrite.join('、')}`)
  }
  if (fresh.length > 0) {
    lines.push(`以下模块将新增导入：\n${fresh.join('、')}`)
  }
  if (lines.length === 0) {
    // 区分「没勾模块」与「文件里本就没有模块数据（仅字母图片等模式级数据）」
    const fileHasModule = Object.values(importModulesByMode.value).some(list => list.length > 0)
    return fileHasModule
      ? '当前没有选中任何模块，\n请勾选需要导入的模块后再继续。'
      : '所选内容中没有模块数据，\n将仅导入字母图片等模式级数据。确定要继续吗？'
  }
  lines.push('备份文件中未包含的现有数据将保持不变。')

  return `${lines.join('\n\n')}\n\n确定要继续吗？`
})

async function handleImportModeConfirm() {
  const modes = effectiveImportModes.value
  if (modes.length === 0) {
    ElMessage.warning('请至少选择一个模块')
    return
  }

  if (isLegacyBackup.value) {
    selectedImportModes.value = [...modes]
    showImportModeDialog.value = false
    showImportDialog.value = true
    return
  }

  // 冲突分析要覆盖全部勾选的模块：includeFull=true 时把「整模式全选」也列进白名单，
  // 否则只勾了一个模块（即该模式全选）会被当成「没选任何模块」
  const { overwrite, fresh } = await analyzeImportConflicts(
    pendingImportData.value,
    buildImportModuleFilters(modes, true),
    modes
  )
  importOverwriteList.value = overwrite
  importFreshList.value = fresh

  selectedImportModes.value = [...modes]
  showImportModeDialog.value = false
  showImportDialog.value = true
}

/**
 * 生成模块白名单
 * @param {string[]} modes - 参与导入的模式
 * @param {boolean} includeFull - true=连「整模式全选」也列出（用于冲突分析）；
 *   false=只列部分勾选的模式，全选的模式走整模式导入（用于实际导入）
 */
function buildImportModuleFilters(modes, includeFull = false) {
  const filters = {}
  for (const mode of modes) {
    const total = totalImportModuleCount(mode)
    if (total === 0) continue
    const selected = selectedImportModules.value[mode] || []
    if (selected.length === 0) continue
    if (!includeFull && selected.length >= total) continue
    filters[mode] = selected
  }
  return Object.keys(filters).length > 0 ? filters : null
}

async function confirmImport() {
  try {
    // 用二次确认时锁定的模式，避免把已取消勾选的模式再导入进来
    const modes = selectedImportModes.value.filter(m => m !== 'all')
    const importModes = modes.length === 0 ? null : modes
    const moduleFilters = isLegacyBackup.value ? null : buildImportModuleFilters(modes)
    // 深拷贝数据，避免 Vue 响应式 Proxy 导致 IndexedDB 结构化克隆失败
    const rawData = JSON.parse(JSON.stringify(pendingImportData.value))
    await importAllData(rawData, importModes, moduleFilters)
    await Promise.all([
      moduleStore.fetchModules(),
      setStore.fetchSets(),
      stateStore.fetchStates(),
      formulaStore.fetchFormulas(),
      settingStore.fetchLetterImages()
    ])
    ElMessage.success(
      importOverwriteList.value.length > 0
        ? `导入成功，覆盖更新 ${importOverwriteList.value.length} 个模块，新增 ${importFreshList.value.length} 个模块`
        : '导入成功'
    )
    showImportDialog.value = false
    showImportModeDialog.value = false
    pendingImportData.value = null
    selectedImportModes.value = []
    selectedImportModules.value = {}
    expandedImportModes.value = []
    importOverwriteList.value = []
    importFreshList.value = []
    fileIncludedModes.value = []
  } catch (e) {
    ElMessage.error(e.message || '导入失败')
  }
}

// ======== 重置 ========

async function handleResetClick() {
  // 打开弹窗前刷新各模式的模块列表（复用导出的加载逻辑，两者展示的都是本地模块）
  await loadModulesForExport()
  clearResetSelection()
  showResetModeDialog.value = true
}

function clearResetSelection() {
  selectedResetModes.value = []
  selectedResetModules.value = {}
  expandedResetModes.value = []
}

function selectedResetModuleCount(mode) {
  return selectedResetModules.value[mode]?.length || 0
}

/** 重置模式下仅勾选了部分模块（非空且非全选） */
function isResetModePartiallySelected(mode) {
  const total = totalModuleCount(mode)
  if (total === 0) return false
  const selected = selectedResetModuleCount(mode)
  return selected > 0 && selected < total
}

function toggleExpandResetMode(mode) {
  const index = expandedResetModes.value.indexOf(mode)
  if (index >= 0) {
    expandedResetModes.value.splice(index, 1)
  } else {
    expandedResetModes.value.push(mode)
  }
}

function toggleResetMode(mode) {
  if (mode === 'all') {
    if (selectedResetModes.value.includes('all')) {
      selectedResetModes.value = []
      ALL_MODES.forEach(m => { selectedResetModules.value[m] = [] })
    } else {
      selectedResetModes.value = ['all', ...ALL_MODES]
      ALL_MODES.forEach(m => {
        selectedResetModules.value[m] = modulesByMode.value[m].map(mod => mod.id)
      })
    }
  } else {
    if (selectedResetModes.value.includes(mode)) {
      selectedResetModes.value = selectedResetModes.value.filter(m => m !== mode && m !== 'all')
      selectedResetModules.value[mode] = []
    } else {
      selectedResetModes.value.push(mode)
      selectedResetModules.value[mode] = modulesByMode.value[mode].map(mod => mod.id)
      syncResetAllFlag()
    }
  }
}

function toggleResetModule(mode, moduleId) {
  const list = selectedResetModules.value[mode] || []
  const next = list.includes(moduleId)
    ? list.filter(id => id !== moduleId)
    : [...list, moduleId]
  selectedResetModules.value[mode] = next

  if (next.length === 0) {
    // 模块全不选等同于取消该模式
    selectedResetModes.value = selectedResetModes.value.filter(m => m !== mode && m !== 'all')
  } else {
    // 只要该模式下还有选中的模块，就代表该模式已选
    if (!selectedResetModes.value.includes(mode)) {
      selectedResetModes.value = [...selectedResetModes.value.filter(m => m !== 'all'), mode]
    }
    syncResetAllFlag()
  }
}

/** 全部模式的所有模块都选中时才标记为"全部数据" */
function syncResetAllFlag() {
  const allSelected = ALL_MODES.every(mode => {
    const total = totalModuleCount(mode)
    if (total === 0) return selectedResetModes.value.includes(mode)
    return selectedResetModuleCount(mode) === total
  })

  if (allSelected) {
    if (!selectedResetModes.value.includes('all')) {
      selectedResetModes.value.unshift('all')
    }
  } else {
    selectedResetModes.value = selectedResetModes.value.filter(m => m !== 'all')
  }
}

/** 实际参与重置的模式：以模块勾选为准推导，避免与模式勾选态不同步 */
const effectiveResetModes = computed(() => {
  return ALL_MODES.filter(mode => {
    if ((selectedResetModules.value[mode]?.length || 0) > 0) return true
    return selectedResetModes.value.includes(mode)
  })
})

/**
 * 生成重置用的模块白名单：只列部分勾选的模式，全选的模式按整模式重置
 */
function buildResetModuleFilters(targetModes) {
  const filters = {}
  for (const mode of targetModes) {
    const total = totalModuleCount(mode)
    if (total === 0) continue
    const selected = selectedResetModules.value[mode] || []
    if (selected.length > 0 && selected.length < total) {
      filters[mode] = selected
    }
  }
  return Object.keys(filters).length > 0 ? filters : null
}

/** 把重置范围整理成可读文案，如「三阶（F2L、CMLL）」 */
function describeResetScope(modes, filters) {
  return modes.map(mode => {
    const ids = filters?.[mode]
    if (!ids) return MODE_LABELS[mode] || mode
    const names = (modulesByMode.value[mode] || [])
      .filter(m => ids.includes(m.id))
      .map(m => m.name)
    return `${MODE_LABELS[mode] || mode}（${names.join('、')}）`
  }).join('、')
}

const resetConfirmMessage = computed(() => {
  const hasAll = selectedResetModes.value.includes('all')
  const modes = effectiveResetModes.value
  const filters = buildResetModuleFilters(modes)
  // 未勾任何模式时保持原有「全部数据」占位文案
  const scopeText = modes.length === 0
    ? '全部数据'
    : hasAll && !filters
      ? '全部数据'
      : describeResetScope(modes, filters)

  return `重置将删除所选范围（${scopeText}）的所有自定义数据，\n恢复到初始状态。未选中范围的数据保持不变。\n此操作不可恢复，确定要继续吗？`
})

function handleResetModeConfirm() {
  const modes = effectiveResetModes.value
  if (modes.length === 0) {
    ElMessage.warning('请至少选择一个模块')
    return
  }
  // 锁定本次选择的范围，供二次确认与执行使用
  selectedResetModes.value = [...modes]
  // 关闭模式选择弹窗，弹出二次确认
  showResetModeDialog.value = false
  showResetDialog.value = true
}

async function handleReset() {
  try {
    // handleResetModeConfirm 已把范围锁定在 selectedResetModes（不含 'all'）
    const resetModes = selectedResetModes.value.filter(m => m !== 'all')
    // 只传部分勾选的模式；全选的模式走整模式重置
    await resetAllData(resetModes, buildResetModuleFilters(resetModes))
    await Promise.all([
      moduleStore.fetchModules(),
      setStore.fetchSets(),
      stateStore.fetchStates(),
      formulaStore.fetchFormulas(),
      settingStore.fetchLetterImages()
    ])
    ElMessage.success('重置成功')
    showResetDialog.value = false
    showResetModeDialog.value = false
    clearResetSelection()
  } catch (e) {
    ElMessage.error(e.message || '重置失败')
  }
}
</script>

<style scoped>
/* 数据管理页特有样式（统一样式已提取到 index.css） */

/* ======== 功能内容（保持原有不变）======= */

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

.export-btn {
  background: #E8F0FE;
  color: #165DFF;
}

.import-btn {
  background: #F0FDF4;
  color: #00B42A;
}

.reset-btn {
  background: #FFF7F7;
  color: #F53F3F;
}

.backup-btn {
  background: #FFFFFF;
  color: #1D2129;
}

.backup-btn .arrow-icon {
  margin-left: auto;
  color: #C9CDD4;
  flex-shrink: 0;
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

/* 导出模式选择弹窗 */
.export-mode-list {
  max-height: 300px;
  overflow-y: auto;
}

.export-mode-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 12px;
}

.export-mode-item:hover {
  background: #F5F7FA;
}

.export-mode-item.selected {
  background: transparent;
}

.export-mode-item:last-child {
  border-bottom: none;
}

.export-mode-name {
  font-size: 14px;
  color: #1D2129;
  flex: 1;
}

.export-checkbox {
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

.export-checkbox.checked {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

/* 部分选中：蓝框内显示减号 */
.export-checkbox.indeterminate {
  border-color: #165DFF;
  color: #165DFF;
}

/* ======== 导出模块细化选择（模式行下的展开列表） ======== */
.tree-list {
  max-height: min(60vh, 420px);
}

.module-brief {
  font-size: 12px;
  color: #86909C;
  flex-shrink: 0;
}

.expand-btn {
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

.expand-icon {
  transition: transform 0.2s;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.export-module-list {
  background: #F7F8FA;
  padding: 4px 0;
}

.export-module-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 44px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-module-item:active {
  background: #EEF0F4;
}

.export-module-name {
  font-size: 14px;
  color: #4E5969;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-type-tag {
  font-size: 11px;
  color: #86909C;
  border: 1px solid #E5E6EB;
  border-radius: 4px;
  padding: 1px 4px;
  flex-shrink: 0;
}

/* 导入时标记「本地已存在同名模块」，提示该模块会被覆盖更新 */
.exists-tag {
  color: #FF7D00;
  border-color: #FFCF8B;
  background: #FFF7E8;
}

.export-module-empty {
  padding: 10px 16px 10px 44px;
  font-size: 12px;
  color: #C9CDD4;
}
</style>
