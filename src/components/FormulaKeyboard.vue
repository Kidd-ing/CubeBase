<template>
  <div class="formula-keyboard" @click.stop @touchend.stop>
    <!-- 第1行：( ) 2 3 退格(占2格) -->
    <div class="keyboard-row">
      <button type="button" class="keyboard-btn bracket-key" @click.stop="insertText('(')">(</button>
      <button type="button" class="keyboard-btn bracket-key" @click.stop="insertText(')')">)</button>
      <button type="button" class="keyboard-btn" @click.stop="insertText('2')">2</button>
      <button type="button" class="keyboard-btn" @click.stop="insertText('3')">3</button>
      <button type="button" class="keyboard-btn span-2 backspace-key" @click.stop="handleBackspace">退格</button>
    </div>
    <!-- 共用行：R L U D F B / R' L' U' D' F' B' -->
    <div class="keyboard-row">
      <button type="button" v-for="key in commonRow1" :key="key" class="keyboard-btn" @click.stop="insertText(key)">{{ key }}</button>
    </div>
    <div class="keyboard-row">
      <button type="button" v-for="key in commonRow2" :key="key" class="keyboard-btn" @click.stop="insertText(key)">{{ key }}</button>
    </div>
    <!-- 各模式专属行（配置驱动，直接查找） -->
    <div class="keyboard-row" v-for="(row, idx) in modeRows" :key="idx">
      <button type="button" v-for="key in row" :key="key" class="keyboard-btn" @click.stop="insertText(key)">{{ key }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getModeKeyboardRows } from '@/config/cubeModes'

const props = defineProps({
  mode: {
    type: String,
    default: '3x3'
  }
})

const emit = defineEmits(['input', 'backspace'])

// 共用行（所有模式都显示）
const commonRow1 = ['R', 'L', 'U', 'D', 'F', 'B']
const commonRow2 = ["R'", "L'", "U'", "D'", "F'", "B'"]

// 各模式专属行（直接按 mode 查找配置，无条件分支）
const modeRows = computed(() => getModeKeyboardRows(props.mode))

function insertText(text) {
  emit('input', text)
}

function handleBackspace() {
  emit('backspace')
}
</script>

<style scoped>
.formula-keyboard {
  width: 100%;
}

.keyboard-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}

.keyboard-btn {
  height: 42px;
  background: #F5F7FA;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #1D2129;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.keyboard-btn:active {
  background: #E5E7EB;
  transform: scale(0.95);
}

.span-2 {
  grid-column: span 2;
}

.bracket-key {
  background: #F5F7FA;
  color: #1D2129;
}

.backspace-key {
  background: #FFE8E8;
  color: #F53F3F;
}
</style>
