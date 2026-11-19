<template>
  <div class="state-card-wrapper">
    <!-- 已掌握绿色小三角 -->
    <svg v-if="hasMastered" class="mastered-triangle" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,24 24,24 24,12" fill="#00B42A"/>
    </svg>
    <!-- 滑动容器 -->
    <div class="swipe-wrapper">
      <!-- 滑动轨道：卡片 + 操作按钮作为整体一起移动 -->
      <div
        ref="swipeTrack"
        class="swipe-track"
        :class="{ 'no-transition': isDragging }"
        :style="{ transform: `translateX(${offsetX}px)` }"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend.passive="onTouchEnd"
        @touchcancel.passive="onTouchEnd"
      >
        <!-- 卡片主体 -->
        <div
          class="swipe-card bg-card rounded-card p-4 flex items-center gap-3 cursor-pointer transition-colors"
          :class="{ 
            'active:scale-[0.98]': !selected
          }"
          @click="handleClick"
        >
          <!-- 拖动手柄（保留给 vuedraggable 使用） -->
          <div class="drag-handle p-1 cursor-grab shrink-0" @click.stop>
            <GripVertical :size="18" class="text-hint" />
          </div>

          <!-- 选择框（多选模式下显示） -->
          <div v-if="showCheckbox" class="select-checkbox shrink-0" @click.stop="$emit('toggle-select')">
            <div class="checkbox" :class="{ checked: selected }">
              <Check v-if="selected" :size="14" />
            </div>
          </div>

          <!-- 内容区域（状态图片 + 信息） -->
          <div class="flex-1 flex items-center min-w-0">
            <!-- 状态图片 -->
            <div v-if="state.image" class="w-16 h-16 rounded-lg overflow-hidden shrink-0">
              <img :src="state.image" class="w-full h-full object-contain" />
            </div>
            <div v-else class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <span class="text-2xl font-bold text-gray-400">{{ state.name.charAt(0) }}</span>
            </div>

            <!-- 状态信息 -->
            <div class="flex-1 min-w-0 ml-3">
              <h3 class="text-primary font-medium text-base state-title">{{ state.name }}</h3>
              <p class="text-hint text-sm state-desc">{{ state.desc || '暂无描述' }}</p>
              <p class="text-hint text-xs mt-1">公式: {{ state.formulaCount || 0 }}条</p>
            </div>
          </div>

          <!-- 右侧箭头指示可点击进入（非多选模式下显示） -->
          <ChevronRight v-if="!showCheckbox" :size="20" class="text-hint shrink-0" />
        </div>

        <!-- 右侧操作栏（跟随卡片一起滑动）：添加 + 编辑 + 删除 -->
        <div v-if="!showCheckbox" class="swipe-actions">
          <button
            class="swipe-action-btn add-btn"
            :style="{ width: singleBtnWidth + 'px' }"
            @click.stop="$emit('add-to-sets')"
          >
            <PlusCircle :size="18" />
            <span>添加</span>
          </button>
          <button
            class="swipe-action-btn edit-btn"
            :style="{ width: singleBtnWidth + 'px' }"
            @click.stop="$emit('edit')"
          >
            <Edit :size="18" />
            <span>编辑</span>
          </button>
          <button
            class="swipe-action-btn delete-btn"
            :style="{ width: singleBtnWidth + 'px' }"
            @click.stop="handleDeleteClick"
          >
            <Trash :size="18" />
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronRight, Edit, Trash, GripVertical, Check, PlusCircle } from 'lucide-vue-next'
import swipeMutex from '@/utils/swipeMutex.js'

const props = defineProps({
  state: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  showCheckbox: { type: Boolean, default: false },
  showActions: { type: Boolean, default: true },
  isBuiltInSet: { type: Boolean, default: false },
  hasMastered: { type: Boolean, default: false }
})

const emit = defineEmits(['click', 'edit', 'delete', 'remove', 'toggle-select', 'longpress', 'add-to-sets'])

// ========== 左滑操作栏配置 ==========
// 三个按钮：添加 + 编辑 + 删除，各 70px 宽
const singleBtnWidth = 70
const actionsWidth = singleBtnWidth * 3

// 阈值：超过操作栏宽度的 35% 自动弹开
const threshold = computed(() => actionsWidth * 0.35)

// 滑动状态
const offsetX = ref(0)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const isDragging = ref(false)
const isOpen = ref(false)
const swipeTrack = ref(null)
let hasMoved = false
/** 标记：本次交互是否已在 touchStart 阶段被"关闭其他卡片"消耗 */
let consumedByClose = false
/** 标记：自己处于打开状态时被触摸，延迟到 touchEnd 判断是"点击收回"还是"手动右滑" */
let selfOpenTouching = false

// ========== 长按相关（仅在非滑动交互、无卡片打开时触发）==========
const LONG_PRESS_DURATION = 500
const MOVE_THRESHOLD = 10
let longPressTimer = null
let lpStartX = 0
let lpStartY = 0

function startLongPress() {
  // 有卡片处于打开状态 → 不允许长按
  if (swipeMutex._activeCloser) return
  clearLongPress()
  longPressTimer = setTimeout(() => {
    emit('longpress')
  }, LONG_PRESS_DURATION)
}

function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function checkLongPressMoved(e) {
  const dx = Math.abs(e.touches[0].clientX - lpStartX)
  const dy = Math.abs(e.touches[0].clientY - lpStartY)
  if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
    clearLongPress()
  }
}

// ========== 删除处理 ==========
function handleDeleteClick() {
  if (props.isBuiltInSet) {
    emit('delete', props.state)
  } else {
    emit('remove', props.state)
  }
}

// ========== 左滑核心逻辑 ==========

function closeSwipe() {
  isOpen.value = false
  offsetX.value = 0
  swipeMutex.unregister(closeSwipe)
}

function resetInteractionState() {
  hasMoved = false
  consumedByClose = false
  selfOpenTouching = false
}

function onTouchStart(e) {
  // 多选模式下完全禁用左滑和长按，保留原生滚动和点击行为
  if (props.showCheckbox) return

  resetInteractionState()

  const touch = e.touches[0]
  startY.value = touch.clientY

  // 记录长按起始位置
  lpStartX = touch.clientX
  lpStartY = touch.clientY

  if (!isOpen.value && swipeMutex.closeAny()) {
    consumedByClose = true
    return
  }

  if (isOpen.value) {
    selfOpenTouching = true
    consumedByClose = true
    swipeMutex.unregister(closeSwipe)
    startX.value = e.touches[0].clientX
    isDragging.value = false
    return
  }

  startX.value = e.touches[0].clientX
  isDragging.value = false

  // 启动长按计时器（无其他卡片打开时）
  startLongPress()
}

function onTouchMove(e) {
  // 多选模式下完全禁用左滑，不阻止默认行为，允许正常垂直滚动
  if (props.showCheckbox) return

  // 本次交互已被"关闭其他卡片"消耗（非自身操作）→ 不响应滑动
  if (consumedByClose && !selfOpenTouching) return

  // 检查长按是否因移动而取消
  checkLongPressMoved(e)

  const touch = e.touches[0]
  const dx = touch.clientX - startX.value
  const dy = touch.clientY - startY.value

  // 方向判定：垂直滑动优先 → 不阻止默认行为，让页面正常滚动
  if (!isDragging.value && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
    return
  }

  // 确认是水平滑动手势且事件仍可取消 → 阻止默认滚动
  if (e.cancelable) {
    e.preventDefault()
  }

  const maxOffset = -actionsWidth

  // 自己已打开状态：允许双向滑动（左滑保持打开 / 右滑手动收回）
  let newOffset
  if (selfOpenTouching) {
    newOffset = maxOffset + dx
    newOffset = Math.max(maxOffset, Math.min(0, newOffset))
  } else {
    // 正常未打开：只允许左滑（负方向）
    if (dx > 10) {
      clearLongPress()
      return
    }
    newOffset = Math.max(maxOffset, Math.min(0, dx))

    // 开始有效拖动 → 取消长按
    if (Math.abs(dx) > MOVE_THRESHOLD) {
      clearLongPress()
    }
  }

  if (Math.abs(dx) > 5) {
    hasMoved = true
    isDragging.value = true
  }

  currentX.value = touch.clientX
  offsetX.value = newOffset
}

function onTouchEnd() {
  // 多选模式下完全禁用左滑相关逻辑
  if (props.showCheckbox) return

  // 清除长按计时器
  clearLongPress()

  // 本次交互已被"关闭其他卡片"消耗（非自身操作）→ 不响应
  if (consumedByClose && !selfOpenTouching) return

  // 自己已打开状态下的触摸松手 → 区分"点击收回"和"手动右滑"
  if (selfOpenTouching) {
    selfOpenTouching = false
    isDragging.value = false

    if (!hasMoved) {
      closeSwipe()
    } else {
      const midPoint = (-actionsWidth) / 2
      if (offsetX.value > midPoint) {
        closeSwipe()
      } else {
        openSwipe()
      }
    }
    return
  }

  if (!isDragging.value || !hasMoved) {
    return
  }

  isDragging.value = false

  if (Math.abs(offsetX.value) >= threshold.value) {
    openSwipe()
  } else {
    closeSwipe()
  }
}

function openSwipe() {
  isOpen.value = true
  offsetX.value = -actionsWidth
  swipeMutex.register(closeSwipe)
}

function handleClick() {
  if (consumedByClose) return
  if (swipeMutex.closeAny()) return
  if (hasMoved) return
  emit('click')
}

// 进入多选模式时，彻底清空所有左滑相关状态，确保多选操作不受残留状态干扰
watch(() => props.showCheckbox, (val) => {
  if (val) {
    closeSwipe()
    resetInteractionState()
    clearLongPress()
    offsetX.value = 0
    isDragging.value = false
    hasMoved = false
  }
})
</script>

<style scoped>
/* 已掌握绿色小三角（保持在滑动容器外部，绝对定位） */
.state-card-wrapper {
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

/* 滑动外层：承载阴影和裁剪 */
.swipe-wrapper {
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 3px 5px 12px rgba(0, 0, 0, 0.08), 1px 2px 6px rgba(0, 0, 0, 0.04);
}

/* 滑动轨道：卡片 + 操作按钮水平排列，整体平移 */
.swipe-track {
  display: flex;
  align-items: stretch;
  touch-action: pan-y; /* 允许垂直滚动，水平由 JS 控制 */
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

/* 拖动时禁用过渡动画实现跟手效果 */
.swipe-track.no-transition {
  transition: none !important;
}

/* 卡片固定宽度占满容器 */
.swipe-card {
  width: 100%;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
}

/* 右侧操作栏紧贴卡片右侧 */
.swipe-actions {
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
}

/* 按钮区域仅添加按钮（第一个）左侧有圆角与卡片匹配，右侧紧贴编辑按钮保持直角 */
.swipe-actions .swipe-action-btn:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.swipe-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  outline: none; /* 移除移动端 WebView 点击后的蓝色 focus 描边 */
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  flex-shrink: 0;
}

/* 添加按钮 — 绿色（参考设置页导入数据按钮）*/
.add-btn {
  background: #F0FDF4;
  color: #00B42A;
}

.add-btn:active {
  background: #D5F0E2;
}

/* 编辑按钮 — 蓝色 */
.edit-btn {
  background: #E8F0FE;
  color: #165DFF;
}

.edit-btn:active {
  background: #D4E2FC;
}

/* 删除按钮 — 红色 */
.delete-btn {
  background: #FFF7F7;
  color: #F53F3F;
}

.delete-btn:active {
  background: #FFECEC;
}

/* 拖动手柄 */
.drag-handle {
  /* 已在模板中设置 inline 样式 */
}

/* 选择框 */
.select-checkbox {
  /* 已在模板中设置 inline 样式 */
}

.checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid #DCDFE6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.checkbox.checked {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

.state-title {
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
}

.state-desc {
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
}
</style>

<!-- 非scoped样式：半透明/全透明模式效果 -->
<!-- 使用非scoped避免Vue scoped属性选择器干扰全局CSS优先级 -->
<style>
/* 状态卡片 - 半透明毛玻璃 */
body.nav-translucent .state-card-wrapper .swipe-card.bg-card,
body.nav-translucent .state-card-wrapper .swipe-card {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
}

/* 状态卡片 - 全透明（保留阴影） */
body.nav-transparent .state-card-wrapper .swipe-card.bg-card,
body.nav-transparent .state-card-wrapper .swipe-card {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
</style>
