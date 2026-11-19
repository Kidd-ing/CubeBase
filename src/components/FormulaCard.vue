<template>
  <div class="formula-card-wrapper">
    <!-- 卡片视觉区域：遮罩层 + 绿色小三角（与展开面板隔离） -->
    <div class="card-visual-area">
      <!-- 滑动容器：承载阴影和裁剪 -->
      <div class="swipe-wrapper">
      <!-- 滑动轨道：卡片 + 操作按钮作为整体一起移动 -->
      <div
        ref="swipeTrack"
        class="swipe-track"
        :class="{ 'no-transition': isDragging, 'hint-animating': isLongPressHinting }"
        :style="{ transform: `translateX(${offsetX}px)` }"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend.passive="onTouchEnd"
        @touchcancel.passive="onTouchEnd"
      >
        <!-- 卡片主体 -->
        <div class="swipe-card bg-card rounded-card" @click="handleClick">
          <div class="card-main">
            <div class="card-layout">
              <!-- 左侧：拖动手柄（垂直居中） -->
              <div class="drag-area">
                <slot name="drag-handle">
                  <div class="drag-placeholder"></div>
                </slot>
              </div>

              <!-- 中间：公式内容区域 -->
              <div class="content-area">
                <!-- 字母版公式预览 - 始终显示字母 -->
                <div class="formula-graphic">
                  <template v-for="(token, idx) in displayTokens" :key="idx">
                    <span v-if="token === '(' || token === ')'" class="bracket-char">{{ token }}</span>
                    <span v-else-if="isDigitToken(token)" class="digit-char">{{ token }}</span>
                    <span v-else class="letter-char">{{ token }}</span>
                  </template>
                </div>

                <!-- 底部信息：起手方式 + 备注 -->
                <div v-if="formula.remark || formula.hand" class="card-meta">
                  <span v-if="formula.hand" class="hand-badge">
                    {{ handText }}
                  </span>
                  <span v-if="formula.remark" class="remark">
                    {{ formula.remark }}
                  </span>
                </div>
              </div>

              <!-- 右侧：操作按钮（垂直居中） -->
              <div class="action-area">
                <ChevronDown :size="18" class="expand-arrow" :class="{ expanded: expanded }" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧操作栏（跟随卡片一起滑动）：编辑 + 删除（打乱公式仅显示删除） -->
        <div class="swipe-actions">
          <button
            v-if="!formula.isScramble"
            class="swipe-action-btn edit-btn"
            :style="{ width: singleBtnWidth + 'px' }"
            @click.stop="$emit('edit')"
          >
            <Edit :size="18" />
            <span>编辑</span>
          </button>
          <button
            class="swipe-action-btn delete-btn"
            :class="{ 'only-delete': formula.isScramble }"
            :style="{ width: singleBtnWidth + 'px' }"
            @click.stop="$emit('delete')"
          >
            <Trash :size="18" />
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>

      <!-- 已掌握绿色小三角 - 固定在视觉区域上，不被遮罩裁剪，不受展开影响 -->
      <svg v-if="formula.mastered" class="mastered-triangle" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,24 24,24 24,12" fill="#00B42A"/>
      </svg>
    </div>

    <!-- 展开的图片公式窗口 -->
    <Transition name="expand">
      <div v-if="expanded" class="image-formula-panel">
        <div class="image-formula-display">
          <template v-for="(token, idx) in displayTokens" :key="idx">
            <div v-if="token === '(' || token === ')'" class="formula-bracket-wrapper">
              <span class="formula-bracket">{{ token }}</span>
            </div>
            <div v-else-if="isDigitToken(token)" class="formula-digit-wrapper">
              <span class="formula-digit">{{ token }}</span>
            </div>
            <div v-else class="formula-item">
              <div v-if="resolveLetterImage(token)" class="formula-image-box has-image">
                <img :src="resolveLetterImage(token)" class="formula-image" />
              </div>
              <div v-else class="formula-image-box">
                <span class="formula-letter">{{ token }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Edit, Trash, ChevronDown } from 'lucide-vue-next'
import { getFormulaDisplayTokens, isDigitToken, normalizeToken } from '@/utils/formulaValidator'
import { getModeLetterAliases } from '@/config/cubeModes'
import swipeMutex from '@/utils/swipeMutex.js'

const props = defineProps({
  formula: { type: Object, required: true },
  letterImageMap: { type: Object, default: () => ({}) },
  cubeMode: { type: String, default: '3x3' }
})

defineEmits(['edit', 'delete'])

const expanded = ref(false)

function toggleExpand() {
  expanded.value = !expanded.value
}

const displayTokens = computed(() => {
  return getFormulaDisplayTokens(props.formula.content, props.cubeMode)
})

// 当前模式的字母成员别名映射（别名 → 标准成员）
// 用于图片映射回退查找：用户输入 2R 时，回退到标准成员 MR 的图片
const letterAliases = computed(() => getModeLetterAliases(props.cubeMode))

// 根据别名映射查找图片：先查 token 本身（含 normalizeToken 处理旧格式），
// 找不到再回退到别名对应的标准成员图片（2R → MR 的图片）
function resolveLetterImage(token) {
  const normalized = normalizeToken(token)
  return props.letterImageMap[normalized]
    || props.letterImageMap[token]
    || props.letterImageMap[letterAliases.value[token]]
    || ''
}

const handText = computed(() => {
  const map = { 'top': '上起手', 'middle': '中起手', 'bottom': '下起手' }
  return map[props.formula.hand] || ''
})

// ========== 长按提示动画配置 ==========
const LONG_PRESS_DURATION = 450 // 长按触发时间(ms)
const LONG_PRESS_MOVE_TOLERANCE = 10 // 移动容差(px)，超过则取消长按
const HINT_SLIDE_DISTANCE = -48 // 提示滑出距离(px)，约为操作栏宽度的1/3，足够感知但不突兀
const HINT_HOLD_DURATION = 300 // 滑出后保持时间(ms)

const isLongPressHinting = ref(false)
let longPressTimer = null
let longPressCancelled = false

function startLongPressTimer() {
  longPressCancelled = false
  longPressTimer = setTimeout(() => {
    if (!longPressCancelled && !hasMoved && !isOpen.value) {
      triggerLongPressHint()
    }
  }, LONG_PRESS_DURATION)
}

function cancelLongPress() {
  longPressCancelled = true
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

async function triggerLongPressHint() {
  isLongPressHinting.value = true
  offsetX.value = HINT_SLIDE_DISTANCE
  // 保持一段时间后自动回弹
  await new Promise(resolve => setTimeout(resolve, HINT_HOLD_DURATION))
  if (isLongPressHinting.value) {
    offsetX.value = 0
    isLongPressHinting.value = false
  }
}

function cancelLongPressHint() {
  if (isLongPressHinting.value) {
    isLongPressHinting.value = false
    offsetX.value = 0
  }
}

// ========== 左滑操作栏配置 ==========
// 两个按钮：编辑 + 删除，各 70px 宽（打乱公式仅显示删除）
const singleBtnWidth = 70
const actionsWidth = singleBtnWidth * 2

// 动态最大滑动距离：打乱公式仅显示删除按钮时为单按钮宽度
const maxSwipeOffset = computed(() => props.formula.isScramble ? -singleBtnWidth : -actionsWidth)

// 阈值：超过操作栏宽度的 35% 自动弹开
const threshold = computed(() => Math.abs(maxSwipeOffset.value) * 0.35)

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
    swipeMutex.unregister(closeSwipe)
    startX.value = e.touches[0].clientX
    isDragging.value = false
    return
  }

  startX.value = e.touches[0].clientX
  isDragging.value = false

  // 启动长按检测（仅在未打开状态下）
  if (!isOpen.value) {
    startLongPressTimer()
  }
}

function onTouchMove(e) {
  // 本次交互已被"关闭其他卡片"消耗（非自身操作）→ 不响应滑动
  if (consumedByClose && !selfOpenTouching) return

  const touch = e.touches[0]
  const dx = touch.clientX - startX.value
  const dy = touch.clientY - startY.value

  // 长按提示动画播放中，松手前不响应滑动
  if (isLongPressHinting.value) return

  // 移动超过容差 → 取消长按检测
  if (Math.abs(dx) > LONG_PRESS_MOVE_TOLERANCE || Math.abs(dy) > LONG_PRESS_MOVE_TOLERANCE) {
    cancelLongPress()
  }

  // 方向判定：垂直滑动优先 → 不阻止默认行为，让页面正常滚动
  if (!isDragging.value && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5) {
    return
  }

  // 确认是水平滑动手势且事件仍可取消 → 阻止默认滚动
  if (e.cancelable) {
    e.preventDefault()
  }

  const maxOffset = maxSwipeOffset.value

  // 自己已打开状态：允许双向滑动（左滑保持打开 / 右滑手动收回）
  let newOffset
  if (selfOpenTouching) {
    newOffset = maxOffset + dx
    newOffset = Math.max(maxOffset, Math.min(0, newOffset))
  } else {
    // 正常未打开：只允许左滑（负方向）
    if (dx > 10) {
      return
    }
    newOffset = Math.max(maxOffset, Math.min(0, dx))
  }

  if (Math.abs(dx) > 5) {
    hasMoved = true
    isDragging.value = true
  }

  currentX.value = touch.clientX
  offsetX.value = newOffset
}

function onTouchEnd() {
  // 取消长按检测
  cancelLongPress()

  // 长按提示动画播放中松手 → 立即回弹
  if (isLongPressHinting.value) {
    cancelLongPressHint()
    return
  }

  // 本次交互已被"关闭其他卡片"消耗（非自身操作）→ 不响应
  if (consumedByClose && !selfOpenTouching) return

  // 自己已打开状态下的触摸松手 → 区分"点击收回"和"手动右滑"
  if (selfOpenTouching) {
    selfOpenTouching = false
    isDragging.value = false

    if (!hasMoved) {
      closeSwipe()
    } else {
      const midPoint = maxSwipeOffset.value / 2
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
  offsetX.value = maxSwipeOffset.value
  swipeMutex.register(closeSwipe)
}

function handleClick() {
  if (consumedByClose) return
  if (swipeMutex.closeAny()) return
  if (hasMoved) return
  toggleExpand()
}
</script>

<style scoped>
/* 卡片视觉区域：包裹遮罩层和绿色小三角，作为定位参考 */
.card-visual-area {
  position: relative;
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

/* 长按提示动画：使用弹性曲线，更灵动 */
.swipe-track.hint-animating {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 拖动时禁用过渡动画实现跟手效果（最高优先级） */
.swipe-track.no-transition {
  transition: none !important;
}

/* 卡片固定宽度占满容器 */
.swipe-card {
  width: 100%;
  flex-shrink: 0;
  user-select: none;
  -webkit-user-select: none;
  cursor: pointer;
  transition: background-color 0.15s;
}

.swipe-card:active {
  background-color: #F7F8FA;
}

.card-main {
  position: relative;
  padding: 16px;
}

.card-layout {
  display: flex;
  align-items: center;
}

.drag-area {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 8px;
}

.content-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.formula-graphic {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.letter-image {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.letter-char {
  font-size: 18px;
  font-weight: 600;
  color: #165DFF;
  line-height: 1;
  flex-shrink: 0;
}

.bracket-char {
  font-size: 18px;
  font-weight: 500;
  color: #86909C;
  line-height: 1;
  flex-shrink: 0;
}

.digit-char {
  font-size: 18px;
  font-weight: 600;
  color: #165DFF;
  line-height: 1;
  flex-shrink: 0;
  margin-left: -4px; /* 紧贴前一个成员，不插入空格 */
}

.card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
}

.hand-badge {
  padding: 2px 8px;
  background: #F0F0F0;
  border-radius: 4px;
  font-size: 12px;
  color: #4E5969;
  white-space: nowrap;
}

.remark {
  font-size: 12px;
  color: #86909C;
  word-break: break-all;
  line-height: 1.4;
}

.action-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}

/* 展开箭头动画 */
.expand-arrow {
  color: #C9CDD4;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.expand-arrow.expanded {
  transform: rotate(180deg);
}

.drag-placeholder {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.action-btn {
  padding: 8px;
  color: #86909C;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #F5F7FA;
  color: #165DFF;
}

.action-btn:last-child:hover {
  color: #F53F3F;
}

/* 右侧操作栏紧贴卡片右侧 */
.swipe-actions {
  display: flex;
  flex-shrink: 0;
  overflow: hidden;
}

/* 编辑按钮 — 左侧圆角与卡片匹配 */
.swipe-actions .swipe-action-btn:first-child {
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

/* 打乱公式仅保留删除按钮时，复用删除按钮完整样式 + 左侧圆角 */
.swipe-actions .swipe-action-btn.only-delete {
  background: #FFF7F7;
  color: #F53F3F;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.swipe-actions .swipe-action-btn.only-delete:active {
  background: #FFECEC;
}

.swipe-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: none;
  outline: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
  flex-shrink: 0;
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

/* 展开的图片公式面板 */
.image-formula-panel {
  padding: 16px;
  background: #FAFAFA;
}

.image-formula-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-start;
}

.formula-item {
  display: flex;
  align-items: center;
}

.formula-image-box {
  width: 48px;
  height: 48px;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  background: #F5F7FA;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.formula-image-box.has-image {
  border: none;
  background: transparent;
}

.formula-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.formula-letter {
  font-size: 18px;
  font-weight: 600;
  color: #165DFF;
}

.formula-bracket-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 48px;
}

.formula-bracket {
  font-size: 24px;
  font-weight: 500;
  color: #86909C;
}

.formula-digit-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 48px;
  margin-left: -8px; /* 紧贴前一个成员，不插入空格 */
}

.formula-digit {
  font-size: 24px;
  font-weight: 500;
  color: #86909C;
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* 已掌握绿色小三角 - 固定在卡片视觉区域右下角 */
.mastered-triangle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 24px;
  height: 24px;
  z-index: 10;
  pointer-events: none;
}
</style>

<!-- 非scoped样式：半透明/全透明模式效果 -->
<!-- 使用非scoped避免Vue scoped属性选择器干扰全局CSS优先级 -->
<style>
/* 公式卡片主体 - 半透明毛玻璃 */
body.nav-translucent .formula-card-wrapper .swipe-card.bg-card,
body.nav-translucent .formula-card-wrapper .swipe-card {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
}

/* 公式卡片展开后的图片版公式面板 - 半透明 */
body.nav-translucent .image-formula-panel {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(12px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
}

/* 图片版公式内容容器 - 半透明（修复白色背景）*/
body.nav-translucent .image-formula-display {
  background: rgba(255, 255, 255, 0.5) !important;
  backdrop-filter: blur(8px) saturate(160%) !important;
  -webkit-backdrop-filter: blur(8px) saturate(160%) !important;
}

/* 公式卡片主体 - 全透明（保留阴影） */
body.nav-transparent .formula-card-wrapper .swipe-card.bg-card,
body.nav-transparent .formula-card-wrapper .swipe-card {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* 公式卡片展开后的图片版公式面板 - 全透明 */
body.nav-transparent .image-formula-panel {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* 图片版公式内容容器 - 全透明 */
body.nav-transparent .image-formula-display {
  background: transparent !important;
}
</style>
