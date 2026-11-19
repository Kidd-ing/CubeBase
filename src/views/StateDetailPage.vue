<template>
  <div class="page-base statedetail-page">
    <!-- 顶部渐变导航栏 -->
    <div class="page-header">
      <div class="page-header-inner">
        <button class="page-back-btn" @click="handleBack">
          <ArrowLeft :size="24" />
        </button>
        <h1 class="page-title">{{ stateInfo?.name || '状态详情' }}</h1>
        <div class="page-actions">
          <button class="page-action-btn" @click="openEditDialog(null)">
            <Plus :size="24" />
          </button>
          <div class="statedetail-menu" ref="menuRef">
            <button class="statedetail-menu-btn" @click="showMenu = !showMenu">
              <MoreVertical :size="24" />
            </button>
            <div v-if="showMenu" class="statedetail-menu-dropdown">
              <button class="menu-item" @click="showTipDialog = true; showMenu = false">
                提示信息
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 公式列表 -->
    <div class="page-content page-container flex-1 overflow-auto pb-safe"
      @click="handlePageAreaClick"
      @touchstart.passive="handlePageAreaTouch"
    >
      <!-- 状态信息卡片 -->
      <div v-if="stateInfo" class="state-info-wrapper mb-3">
        <!-- 已掌握绿色小三角 -->
        <svg v-if="hasMasteredFormula" class="mastered-triangle" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <polygon points="12,24 24,24 24,12" fill="#00B42A"/>
        </svg>
        <div class="statedetail-state-card bg-card rounded-card p-4">
          <div class="flex items-center gap-4">
            <div v-if="stateInfo.image" class="state-image">
              <img :src="stateInfo.image" class="w-20 h-20 object-contain rounded-lg" />
            </div>
            <div v-else class="state-image-placeholder">
              <span class="text-3xl font-bold text-gray-400">{{ stateInfo.name.charAt(0) }}</span>
            </div>
            <div class="flex-1">
              <h2 class="text-lg font-semibold text-primary">{{ stateInfo.name }}</h2>
              <p class="text-hint text-sm">{{ stateInfo.desc || '暂无描述' }}</p>
              <p class="text-hint text-sm">公式：{{ displayFormulaCount }}条</p>
            </div>
            <!-- 生成打乱公式按钮 -->
            <button
              v-if="regularFormulas.length > 0"              class="shuffle-btn"
              @click="handleGenerateScramble"
            >
              <Repeat :size="20" />
            </button>
          </div>
        </div>
      </div>

      <!-- 打乱公式（从数据库读取，存在时才显示） -->
      <template v-if="scrambleFormula">
        <h3 class="section-title">打乱公式</h3>
        <FormulaCard
          :formula="scrambleFormula"
          :letter-image-map="letterImageMap"
          :cube-mode="cubeModeStore.currentMode"
          @edit="openEditDialog(scrambleFormula)"
          @delete="confirmDelete(scrambleFormula)"
          class="mb-3"
        />
      </template>

      <!-- 公式列表标题 -->
      <h3 class="section-title">公式列表</h3>

      <div v-if="formulaStore.loading" class="flex items-center justify-center h-40">
        <el-icon class="is-loading text-brand text-2xl"><Loader /></el-icon>
      </div>

      <draggable
        v-else-if="regularFormulas.length > 0"
        v-model="sortedFormulas"
        item-key="id"
        handle=".drag-handle"
        :animation="200"
        @start="isDragging = true"
        @end="handleDragEnd"
        class="space-y-3"
      >
        <template #item="{ element }">
          <FormulaCard
            :formula="element"
            :letter-image-map="letterImageMap"
            :cube-mode="cubeModeStore.currentMode"
            @edit="openEditDialog(element)"
            @delete="confirmDelete(element)"
          >
            <template #drag-handle>
              <div class="drag-handle p-1 cursor-grab">
                <GripVertical :size="18" class="text-hint" />
              </div>
            </template>
          </FormulaCard>
        </template>
      </draggable>

      <div v-if="!formulaStore.loading && regularFormulas.length === 0" 
           class="text-center text-hint mt-20">
        暂无公式，点击右上角添加
      </div>
      <div class="h-3 shrink-0"></div>
    </div>

    <!-- 添加/编辑公式弹窗 -->
    <EditDialog
      v-model="showEditDialog"
      :title="editingFormula ? '编辑公式' : '添加公式'"
      @submit="handleSave"
    >
      <!-- 公式输入区：常驻固定，不随内容滚动 -->
      <el-form label-position="top">
        <el-form-item label="字母公式" required>
          <el-input
            ref="formulaInputRef"
            v-model="formData.content"
            type="textarea"
            placeholder="输入公式，如 R U R' U'"
            :autosize="{ minRows: 2, maxRows: 4 }"
            @keyup="updateCursorPosition"
            @click="updateCursorPosition"
            class="formula-textarea"
          />
        </el-form-item>
      </el-form>

      <!-- 可滚动区域：公式输入框下方的内容 -->
      <div class="formula-scroll-area">
        <div class="formula-keyboard-wrapper">
          <FormulaKeyboard :mode="cubeModeStore.currentMode" @input="handleKeyboardInput" @backspace="handleBackspace" />
        </div>

        <div class="hand-section" @touchstart.stop>
          <span class="hand-label">起手方式</span>
          <div class="hand-buttons">
            <button 
              v-for="item in handOptions" 
              :key="item.value"
              class="hand-btn"
              :class="{ active: formData.hand === item.value }"
              @click.stop.prevent="toggleHand(item.value)"
              @touchstart.stop
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <div class="mastered-section" @touchstart.stop>
          <span class="hand-label">掌握情况</span>
          <button 
            class="mastered-btn"
            :class="{ active: formData.mastered }"
            @click.stop.prevent="toggleMastered"
            @touchstart.stop
          >
            <Check :size="16" />
            <span>已掌握</span>
          </button>
        </div>

        <el-form label-position="top">
          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              placeholder="输入备注信息"
              :rows="2"
              maxlength="500"
            />
          </el-form-item>
        </el-form>
      </div>
    </EditDialog>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="删除公式"
      :message="'确定要删除此公式吗？\n此操作不可恢复。'"
      confirm-text="删除"
      @confirm="handleDelete"
    />

    <!-- 提示信息弹窗 -->
    <ConfirmDialog
      v-model="showTipDialog"
      title="提示信息"
      message="左滑公式卡片可编辑或删除公式&#10;点击状态卡片右侧转换按钮&#10;可选择公式生成其逆向打乱公式"
      confirm-text="关闭"
      :show-cancel="false"
      @confirm="showTipDialog = false"
    />

    <!-- 生成打乱公式选择弹窗 -->
    <Teleport to="body">
      <Transition name="scramble-fade">
        <div
          v-if="showScrambleDialog"
          class="scramble-overlay"
          @click.self="handleScrambleCancel"
        >
          <div class="scramble-status-shade"></div>
          <Transition name="scramble-scale">
            <div v-if="showScrambleDialog" class="scramble-container">
              <div class="scramble-header">
                <span class="scramble-title">生成逆向打乱公式</span>
                <button class="scramble-close" @click="handleScrambleCancel">
                  <X :size="20" />
                </button>
              </div>
              <div class="scramble-body">
                <div
                  v-for="item in regularFormulas"
                  :key="item.id"
                  class="scramble-option"
                  :class="{ active: selectedFormulaId === item.id }"
                  @click="selectedFormulaId = item.id"
                >
                  <div class="scramble-radio"
                    :class="{ checked: selectedFormulaId === item.id }"
                  ></div>
                  <div class="scramble-info">
                    <span class="scramble-text">{{ item.content }}</span>
                    <span v-if="item.remark" class="scramble-remark">{{ item.remark }}</span>
                  </div>
                </div>
              </div>
              <div class="scramble-footer">
                <button class="scramble-btn scramble-cancel" @click="handleScrambleCancel">取消</button>
                <button
                  class="scramble-btn scramble-confirm"
                  :disabled="!selectedFormulaId"
                  @click="handleScrambleConfirm"
                >确定</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Plus, MoreVertical, GripVertical, Loader, Check, Repeat, X } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { ElMessage } from 'element-plus'
import { useStateStore } from '@/stores/stateStore'
import { useFormulaStore } from '@/stores/formulaStore'
import { useSettingStore } from '@/stores/settingStore'
import { useCubeModeStore } from '@/stores/cubeModeStore'
import { getModeLetters } from '@/config/cubeModes'
import { validateFormula, formatFormula } from '@/utils/formulaValidator'
import FormulaCard from '@/components/FormulaCard.vue'
import FormulaKeyboard from '@/components/FormulaKeyboard.vue'
import EditDialog from '@/components/EditDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { getScrollPosition, PAGE_KEYS } from '@/utils/scrollPosition'
import swipeMutex from '@/utils/swipeMutex.js'

const route = useRoute()
const router = useRouter()
const stateStore = useStateStore()
const formulaStore = useFormulaStore()
const settingStore = useSettingStore()
const cubeModeStore = useCubeModeStore()
const formulaInputRef = ref(null)
const cursorPosition = ref(0)

const stateId = computed(() => Number(route.params.id))
const setId = computed(() => route.query.setId ? Number(route.query.setId) : null)
const moduleId = computed(() => route.query.moduleId ? Number(route.query.moduleId) : null)

const stateInfo = computed(() => stateStore.states.find(s => s.id === stateId.value))

const formulas = computed(() => formulaStore.formulas.filter(f => f.stateId === stateId.value))

// 打乱公式（通过 isScramble 字段识别，作为真实数据库实体）
const scrambleFormula = computed(() =>
  formulas.value.find(f => f.isScramble)
)

// 普通公式列表（排除打乱公式）
const regularFormulas = computed(() =>
  formulas.value.filter(f => !f.isScramble)
)

// 状态卡片上显示的公式数量（复用 stateStore 的统计逻辑，确保实时更新，包含常规公式与打乱公式）
const displayFormulaCount = computed(() => {
  return stateStore.formulaCounts[stateId.value] || 0
})

// 判断此状态是否有已掌握的公式（排除打乱公式）
const hasMasteredFormula = computed(() => {
  return regularFormulas.value.some(f => f.mastered)
})

// 可排序的公式列表（用于 draggable）
const sortedFormulas = ref([])
const isDragging = ref(false)

// 监听 regularFormulas 变化，当非拖动状态时更新排序列表（排除打乱公式）
watch(regularFormulas, (newFormulas) => {
  if (!isDragging.value) {
    // 按 sort 字段排序，保持正确的显示顺序
    sortedFormulas.value = [...newFormulas].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  }
}, { immediate: true })

// 小写字母成员(文件名需加双层后缀)
const lowercaseLetters = ['r', 'l', 'u', 'd', 'f', 'b']

// 根据当前魔方模式动态获取内置图片路径
function getBuiltinImageSrc(letter) {
  const baseName = lowercaseLetters.includes(letter[0]) ? letter + '双层' : letter
  const modeFolder = cubeModeStore.currentMode.replace('x', '×')
  return new URL(`../assets/images/members/${modeFolder}/${baseName}.svg`, import.meta.url).href
}

// 根据当前魔方模式动态获取成员列表（配置驱动，直接查找）
const allLetters = computed(() => getModeLetters(cubeModeStore.currentMode))

// 合并后的字母图片映射：自定义优先，内置回退
const letterImageMap = computed(() => {
  const customMap = settingStore.getLetterImageMap(cubeModeStore.currentMode)
  const merged = {}
  for (const letter of allLetters.value) {
    merged[letter] = customMap[letter] || getBuiltinImageSrc(letter)
  }
  return merged
})

const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const showTipDialog = ref(false)
const showMenu = ref(false)
const menuRef = ref(null)
const editingFormula = ref(null)
const deletingFormula = ref(null)

const formData = ref({
  content: '',
  hand: '',
  remark: '',
  mastered: false
})

const handOptions = [
  { label: '上起手', value: 'top' },
  { label: '中起手', value: 'middle' },
  { label: '下起手', value: 'bottom' }
]

// 切换起手方式
function toggleHand(value) {
  formData.value.hand = formData.value.hand === value ? '' : value
}

// 切换掌握状态
function toggleMastered() {
  formData.value.mastered = !formData.value.mastered
}

// 重置表单
function resetFormData() {
  formData.value = {
    content: '',
    hand: '',
    remark: '',
    mastered: false
  }
  cursorPosition.value = 0
}

onMounted(async () => {
  await stateStore.fetchStates()
  await formulaStore.fetchFormulas()
  await settingStore.fetchLetterImages()

  // 恢复滚动位置
  nextTick(() => {
    const savedScrollTop = getScrollPosition(PAGE_KEYS.STATE_DETAIL, stateId.value)
    if (savedScrollTop > 0) {
      window.scrollTo({ top: savedScrollTop, behavior: 'instant' })
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
  const menuEl = e.target.closest('.statedetail-menu')
  if (!menuEl) {
    showMenu.value = false
  }
}

// 返回到上一级页面
function handleBack() {
  if (setId.value) {
    router.replace(`/set/${setId.value}?moduleId=${moduleId.value || ''}`)
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

// 监听弹窗关闭，自动重置表单
watch(showEditDialog, (newVal) => {
  if (!newVal) {
    resetFormData()
    editingFormula.value = null
  }
})

function openEditDialog(formula) {
  editingFormula.value = formula
  if (formula) {
    // 编辑模式：加载公式数据
    formData.value = {
      content: formula.content || '',
      hand: formula.hand || '',
      remark: formula.remark || '',
      mastered: formula.mastered || false
    }
    // 光标定位到内容末尾（不自动聚焦，等用户点击输入框时生效）
    cursorPosition.value = (formula.content || '').length
  } else {
    // 新增模式：重置表单
    resetFormData()
  }
  showEditDialog.value = true
}

function confirmDelete(formula) {
  deletingFormula.value = formula
  showDeleteDialog.value = true
}

function updateCursorPosition() {
  const textarea = formulaInputRef.value?.$el?.querySelector('textarea')
  if (textarea) {
    cursorPosition.value = textarea.selectionStart
  }
}

function handleKeyboardInput(text) {
  const pos = cursorPosition.value
  const content = formData.value.content

  // 默认行为：在光标位置插入内容
  // 注：不再自动将 X' + 2 格式化为 X2'，允许保留 R'2 形式
  // tokenize 时会自动将旧格式 X'2 归一化为新格式 X2'，确保图片映射一致
  formData.value.content = content.slice(0, pos) + text + content.slice(pos)
  cursorPosition.value = pos + text.length
}

function handleBackspace() {
  const pos = cursorPosition.value
  const content = formData.value.content
  if (pos > 0) {
    // 删除光标前一个字符
    formData.value.content = content.slice(0, pos - 1) + content.slice(pos)
    cursorPosition.value = pos - 1
  }
}

async function handleSave() {
  if (!formData.value.content.trim()) {
    ElMessage.warning('请输入公式')
    return
  }

  // 校验公式合法性
  const result = validateFormula(formData.value.content, cubeModeStore.currentMode)
  if (!result.valid) {
    ElMessage.warning(result.error)
    return
  }

  // 格式化为标准格式
  const formattedContent = formatFormula(formData.value.content, cubeModeStore.currentMode)
  const isEditing = !!editingFormula.value

  try {
    if (isEditing) {
      await formulaStore.updateFormula(editingFormula.value.id, {
        content: formattedContent,
        hand: formData.value.hand,
        remark: formData.value.remark,
        mastered: formData.value.mastered
      })
      ElMessage.success('更新成功')
    } else {
      await formulaStore.addFormula({
        stateId: stateId.value,
        content: formattedContent,
        hand: formData.value.hand,
        remark: formData.value.remark,
        mastered: formData.value.mastered
      })
      ElMessage.success('添加成功')
    }
    // 关闭弹窗前先清空状态，避免 watch 重复触发
    editingFormula.value = null
    showEditDialog.value = false
    resetFormData()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

async function handleDelete() {
  try {
    await formulaStore.deleteFormula(deletingFormula.value.id)
    // 复用 stateStore 的统计刷新逻辑（与状态集页面一致）
    await stateStore.refreshFormulaCounts()
    ElMessage.success('删除成功')
    showDeleteDialog.value = false
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function handleDragEnd() {
  isDragging.value = false
  await formulaStore.updateSort(sortedFormulas.value)
  ElMessage.success('排序已保存')
}

// 生成打乱公式
const showScrambleDialog = ref(false)
const selectedFormulaId = ref(null)

watch(showScrambleDialog, (val) => {
  if (val) {
    document.body.classList.add('dialog-open')
  } else {
    document.body.classList.remove('dialog-open')
  }
})

/**
 * 魔方公式求逆
 * 核心两步：整体单元倒序 + 每个单元单独求逆；括号公式块递归处理
 */
function reverseFormula(formulaStr) {
  // 单步映射：A ↔ A'，A2 ↔ A'2，有'和无'相互转换（支持任意数字后缀）
  // 支持多字符字母成员（如 Rw, MR 等四阶 token）
  function invertSingle(unit) {
    const m = unit.match(/^([A-Za-z]+)(\')?(\d*)$/)
    if (!m) return unit
    const letter = m[1]
    const prime = m[2]       // "'" 或 undefined
    const num = m[3]         // 数字部分，可能为空
    // 有'则去掉，无'则加上（始终插在字母与数字之间）
    return prime ? letter + num : letter + "'" + num
  }

  // 分词：将公式切分为独立单元（单步、括号块）
  function tokenize(str) {
    const tokens = []
    let i = 0
    while (i < str.length) {
      if (str[i] === '(') {
        // 找匹配的右括号
        let depth = 1
        let j = i + 1
        while (j < str.length && depth > 0) {
          if (str[j] === '(') depth++
          if (str[j] === ')') depth--
          j++
        }
        // 提取括号内容及后面的重复数字
        const inner = str.substring(i + 1, j - 1)
        let repeat = ''
        let k = j
        while (k < str.length && /\d/.test(str[k])) {
          repeat += str[k]
          k++
        }
        tokens.push({ type: 'block', content: inner, repeat: repeat || '' })
        i = k
      } else if (/\S/.test(str[i])) {
        // 普通单步：字母 + 可能的符号(') + 数字
        let j = i
        while (j < str.length && /[A-Za-z']/.test(str[j])) j++
        while (j < str.length && /\d/.test(str[j])) j++
        tokens.push({ type: 'single', value: str.substring(i, j) })
        i = j
      } else {
        i++
      }
    }
    return tokens
  }

  // 递归处理：反转单元列表 + 逐个求逆
  function process(tokens) {
    // 反转顺序
    const reversed = [...tokens].reverse()
    return reversed.map(token => {
      if (token.type === 'single') {
        return invertSingle(token.value)
      } else if (token.type === 'block') {
        // 递归处理括号内部子序列
        const innerTokens = tokenize(token.content)
        const innerReversed = process(innerTokens)
        return '(' + innerReversed.join(' ') + ')' + token.repeat
      }
      return ''
    })
  }

  const tokens = tokenize(formulaStr.trim())
  return process(tokens).join(' ')
}
async function handleScrambleConfirm() {
  if (!selectedFormulaId.value) return
  const formula = regularFormulas.value.find(f => f.id === selectedFormulaId.value)
  if (!formula) return
  const reversed = reverseFormula(formula.content)

  // 保存/更新打乱公式到数据库
  await saveScrambleFormula(reversed)
  // 复用 stateStore 的统计刷新逻辑（与状态集页面一致）
  await stateStore.refreshFormulaCounts()
  showScrambleDialog.value = false
}

async function saveScrambleFormula(content) {
  try {
    if (scrambleFormula.value) {
      // 已存在则更新
      await formulaStore.updateFormula(scrambleFormula.value.id, { content })
    } else {
      // 不存在则新建
      await formulaStore.addFormula({
        stateId: stateId.value,
        content,
        isScramble: true,
        sort: -1
      })
    }
  } catch (e) {
    ElMessage.error(e.message || '保存打乱公式失败')
  }
}

function handleGenerateScramble() {
  selectedFormulaId.value = null
  showScrambleDialog.value = true
}

function handleScrambleCancel() {
  showScrambleDialog.value = false
  selectedFormulaId.value = null
}
</script>

<style scoped>
/* 状态详情页特有样式（统一样式已提取到 index.css） */

/* 三点菜单 */
.statedetail-menu {
  position: relative;
}

.statedetail-menu-btn {
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

.statedetail-menu-btn:hover {
  opacity: 0.8;
}

.statedetail-menu-btn:active {
  transform: scale(0.9);
  opacity: 0.6;
}

.statedetail-menu-dropdown {
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

/* ======== 弹窗和表单相关样式（保持原有功能不变）======= */
.formula-scroll-area {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

:deep(.dialog-content) {
  overflow: hidden;
}

/* 状态信息卡片（圆角卡片样式，与 FormulaCard 一致）*/
.statedetail-state-card {
  box-shadow: 3px 5px 12px rgba(0, 0, 0, 0.08), 1px 2px 6px rgba(0, 0, 0, 0.04);
}

/* 生成打乱公式按钮（简洁线条图标）*/
.shuffle-btn {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909C;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 8px;
  transition: all 0.15s;
}

.shuffle-btn:active {
  color: #165DFF;
  transform: scale(0.9);
}

/* 区块标题 */
.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #4E5969;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

/* 已掌握绿色小三角 */
.state-info-wrapper {
  position: relative;
}

.mastered-triangle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 24px;
  height: 24px;
  z-index: 1;
}

.drag-handle {
  flex-shrink: 0;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.state-image, .state-image-placeholder {
  @apply w-20 h-20 rounded-lg flex items-center justify-center shrink-0;
}

.state-image-placeholder {
  background: #F5F5F5;
}

.formula-keyboard-wrapper {
  margin: 12px 0;
}

:deep(.formula-textarea textarea) {
  resize: none;
  overflow: hidden;
  word-break: break-all;
  line-height: 1.6;
}

.hand-section {
  margin-bottom: 16px;
}

.hand-label {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.hand-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.hand-btn {
  height: 42px;
  background: #F5F7FA;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4E5969;
  cursor: pointer;
  transition: all 0.15s;
}

.hand-btn:active {
  transform: scale(0.95);
}

.hand-btn.active {
  background: #165DFF;
  color: #FFFFFF;
}

.mastered-section {
  margin-bottom: 16px;
}

.mastered-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  height: 42px;
  background: #F5F7FA;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4E5969;
  cursor: pointer;
  transition: all 0.15s;
}

.mastered-btn:active {
  transform: scale(0.98);
}

.mastered-btn.active {
  background: #00B42A;
  color: #FFFFFF;
}

/* ======== 打乱公式选择弹窗（完整独立样式） ======= */
.scramble-overlay {
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

.scramble-status-shade {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--status-bar-height, 0px);
  background: rgba(0, 0, 0, 0.5);
}

.scramble-container {
  width: 100%;
  max-width: min(calc(100vw - 48px), 400px);
  max-height: calc(100vh - 48px);
  background: #FFFFFF;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.scramble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  flex-shrink: 0;
}

.scramble-title {
  font-size: 17px;
  font-weight: 600;
  color: #1D2129;
}

.scramble-close {
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

.scramble-close:active {
  background: #F5F7FA;
}

.scramble-body {
  padding: 0 20px;
  max-height: 300px;
  overflow-y: auto;
}

.scramble-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #F0F0F0;
}

.scramble-option:active,
.scramble-option.active {
  background: #F2F3F5;
}

.scramble-option:last-child {
  border-bottom: none;
}

.scramble-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #C9CDD4;
  flex-shrink: 0;
  transition: all 0.15s;
  position: relative;
}

.scramble-radio.checked {
  border-color: #165DFF;
  background: #165DFF;
}

.scramble-radio.checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #FFFFFF;
}

.scramble-info {
  flex: 1;
  min-width: 0;
}

.scramble-text {
  font-size: 15px;
  font-weight: 500;
  color: #1D2129;
  word-break: break-all;
}

.scramble-remark {
  display: block;
  font-size: 12px;
  color: #86909C;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scramble-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px 20px;
  flex-shrink: 0;
}

.scramble-btn {
  flex: 1;
  height: 44px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.scramble-cancel {
  background: #F2F3F5;
  color: #1D2129;
}

.scramble-cancel:active {
  background: #E5E7EB;
}

.scramble-confirm {
  background: #165DFF;
  color: #FFFFFF;
}

.scramble-confirm:active:not(:disabled) {
  background: #0E42D2;
}

.scramble-confirm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 遮罩层淡入淡出 */
.scramble-fade-enter-active,
.scramble-fade-leave-active {
  transition: opacity 0.25s ease;
}

.scramble-fade-enter-from,
.scramble-fade-leave-to {
  opacity: 0;
}

/* 弹窗缩放动画 */
.scramble-scale-enter-active,
.scramble-scale-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}

.scramble-scale-enter-from,
.scramble-scale-leave-to {
  transform: scale(0.92);
  opacity: 0;
}
</style>
