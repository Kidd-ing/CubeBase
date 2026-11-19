<template>
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
    >
      <!-- 卡片主体 -->
      <div
        class="swipe-card bg-card rounded-card p-4 flex items-center gap-4"
        @click="handleClick"
      >
        <!-- 模块图片 -->
        <div v-if="module.image" class="w-16 h-16 rounded-lg overflow-hidden shrink-0">
          <img :src="module.image" class="w-full h-full object-contain" />
        </div>
        <div v-else class="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <span class="text-2xl font-bold text-gray-400">{{ module.name.charAt(0) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-primary font-medium text-base card-title">{{ module.name }}</h3>
          <p class="text-hint text-sm card-desc mt-1">{{ module.desc || '暂无描述' }}</p>
          <p class="text-hint text-sm mt-0.5">状态：{{ stateCount }}个，公式：{{ formulaCount }}条</p>
        </div>
        <!-- 右侧箭头指示可点击进入 -->
        <ChevronRight :size="20" class="text-hint shrink-0" />
      </div>

      <!-- 右侧操作栏（跟随卡片一起滑动） -->
      <div class="swipe-actions">
        <button
          class="swipe-action-btn edit-btn"
          :style="{ width: singleBtnWidth + 'px' }"
          @click.stop="$emit('edit')"
        >
          <Edit :size="18" />
          <span>编辑</span>
        </button>
        <button
          v-if="isCustom"
          class="swipe-action-btn delete-btn"
          :style="{ width: singleBtnWidth + 'px' }"
          @click.stop="$emit('delete')"
        >
          <Trash :size="18" />
          <span>删除</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronRight, Edit, Trash } from 'lucide-vue-next'
import swipeMutex from '@/utils/swipeMutex.js'

const props = defineProps({
  module: { type: Object, required: true },
  stateCount: { type: Number, default: 0 },
  formulaCount: { type: Number, default: 0 }
})

const emit = defineEmits(['click', 'edit', 'delete', 'longpress'])

const isCustom = computed(() => props.module.type === 'custom')

// 操作栏尺寸
const singleBtnWidth = 80
const actionsWidth = computed(() => isCustom.value ? singleBtnWidth * 2 : singleBtnWidth)

// 阈值：超过操作栏宽度的 35% 自动弹开
const threshold = computed(() => actionsWidth.value * 0.35)

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
  resetInteractionState()

  const touch = e.touches[0]
  startY.value = touch.clientY

  if (!isOpen.value && swipeMutex.closeAny()) {
    consumedByClose = true
    return
  }

  if (isOpen.value) {
    selfOpenTouching = true
    consumedByClose = true
    // 【关键】先从 mutex 预注销，防止父级冒泡的 closeAny() 触发 closeSwipe 导致立即收回动画
    swipeMutex.unregister(closeSwipe)
    startX.value = e.touches[0].clientX
    isDragging.value = false
    return
  }

  startX.value = e.touches[0].clientX
  isDragging.value = false
}

function onTouchMove(e) {
  // 本次交互已被"关闭其他卡片"消耗（非自身操作）→ 不响应滑动
  if (consumedByClose && !selfOpenTouching) return

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

  const maxOffset = -actionsWidth.value

  // 自己已打开状态：允许双向滑动（左滑保持打开 / 右滑手动收回）
  let newOffset
  if (selfOpenTouching) {
    // 当前偏移 + 手指位移（从打开位置算起）
    newOffset = maxOffset + dx
    // 硬限位：不能左滑超过最大展开位置，也不能右滑超过关闭位置(0)
    newOffset = Math.max(maxOffset, Math.min(0, newOffset))
  } else {
    // 正常未打开：只允许左滑（负方向）
    if (dx > 10) {
      return
    }
    // 硬限位：最多滑动到最大展开位置
    newOffset = Math.max(maxOffset, Math.min(0, dx))
  }

  // 判断是否真正开始拖动（移动超过 5px）
  if (Math.abs(dx) > 5) {
    hasMoved = true
    isDragging.value = true
  }

  currentX.value = touch.clientX
  offsetX.value = newOffset
}

function onTouchEnd() {
  // 本次交互已被"关闭其他卡片"消耗（非自身操作）→ 不响应
  if (consumedByClose && !selfOpenTouching) return

  // 自己已打开状态下的触摸松手 → 区分"点击收回"和"手动右滑"
  if (selfOpenTouching) {
    selfOpenTouching = false
    isDragging.value = false

    if (!hasMoved) {
      closeSwipe()
    } else {
      const midPoint = (-actionsWidth.value) / 2
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
  offsetX.value = -actionsWidth.value
  swipeMutex.register(closeSwipe)
}

function handleClick() {
  if (consumedByClose) return
  if (swipeMutex.closeAny()) return
  if (hasMoved) return
  emit('click')
}
</script>

<style scoped>
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
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

/* 右侧操作栏紧贴卡片右侧 */
.swipe-actions {
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
}

/* 按钮区域左侧圆角（与卡片圆角 12px 一致） */
.swipe-actions .swipe-action-btn:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
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

.edit-btn {
  background: #E8F0FE;
  color: #165DFF;
}

.edit-btn:active {
  background: #D4E2FC;
}

.delete-btn {
  background: #FFF7F7;
  color: #F53F3F;
}

.delete-btn:active {
  background: #FFECEC;
}

.card-title {
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
}

.card-desc {
  word-wrap: break-word;
  word-break: break-all;
  white-space: normal;
  line-height: 1.4;
}
</style>
