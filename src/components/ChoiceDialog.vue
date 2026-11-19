<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="modelValue" class="dialog-overlay" @click.self="handleCancel">
        <Transition name="dialog-scale">
          <div v-if="modelValue" class="dialog-container">
            <!-- 标题栏 -->
            <div class="dialog-header">
              <span class="dialog-title">{{ title }}</span>
              <button class="dialog-close" @click="handleCancel">
                <X :size="20" />
              </button>
            </div>
            
            <!-- 选项列表 -->
            <div class="choice-list">
              <div
                v-for="option in options"
                :key="option.value"
                class="choice-item"
                :class="{ selected: selectedValue === option.value, danger: option.danger }"
                @click="handleSelect(option.value)"
              >
                <div class="choice-content">
                  <div class="choice-title">{{ option.title }}</div>
                  <div class="choice-desc">{{ option.desc }}</div>
                </div>
                <div class="choice-check" :class="{ checked: selectedValue === option.value, danger: option.danger }">
                  <Check v-if="selectedValue === option.value" :size="16" />
                </div>
              </div>
            </div>
            
            <!-- 底部按钮 -->
            <div class="dialog-footer">
              <button class="dialog-btn cancel-btn" @click="handleCancel">取消</button>
              <button 
                class="dialog-btn confirm-btn" 
                :class="{ danger: isDangerSelected }"
                :disabled="!selectedValue"
                @click="handleConfirm"
              >
                确认
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import { X, Check } from 'lucide-vue-next'
import { setStatusBarForDialog } from '@/utils/statusBar'
import { useDialogStore } from '@/stores/dialogStore'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '选择操作' },
  options: {
    type: Array,
    default: () => [
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
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dialogStore = useDialogStore()
let closeCallback = null

const selectedValue = ref('')

const isDangerSelected = computed(() => {
  const option = props.options.find(o => o.value === selectedValue.value)
  return option?.danger === true
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedValue.value = ''
  }
  setStatusBarForDialog(newVal)
  if (newVal) {
    closeCallback = () => emit('update:modelValue', false)
    dialogStore.push(closeCallback)
    document.body.classList.add('dialog-open')
  } else if (closeCallback) {
    dialogStore.remove(closeCallback)
    closeCallback = null
    document.body.classList.remove('dialog-open')
  }
})

onUnmounted(() => {
  if (closeCallback) {
    dialogStore.remove(closeCallback)
    closeCallback = null
  }
  document.body.classList.remove('dialog-open')
})

function handleSelect(value) {
  selectedValue.value = value
}

function handleConfirm() {
  if (selectedValue.value) {
    emit('confirm', selectedValue.value)
    emit('update:modelValue', false)
  }
}

function handleCancel() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
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

.choice-list {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #F5F7FA;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.choice-item:active {
  background: #EEF0F3;
}

.choice-item.selected {
  background: #E8F0FE;
  border-color: #165DFF;
}

.choice-item.selected.danger {
  background: #FFF2F0;
  border-color: #F53F3F;
}

.choice-content {
  flex: 1;
  min-width: 0;
}

.choice-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D2129;
  margin-bottom: 4px;
}

.choice-item.danger .choice-title {
  color: #F53F3F;
}

.choice-desc {
  font-size: 12px;
  color: #86909C;
  line-height: 1.4;
}

.choice-check {
  width: 22px;
  height: 22px;
  border: 2px solid #DCDFE6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.choice-check.checked {
  background: #165DFF;
  border-color: #165DFF;
  color: white;
}

.choice-check.checked.danger {
  background: #F53F3F;
  border-color: #F53F3F;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  padding: 20px;
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

.confirm-btn {
  background: #165DFF;
  color: #FFFFFF;
}

.confirm-btn:active:not(:disabled) {
  background: #0E42D2;
}

.confirm-btn.danger {
  background: #F53F3F;
}

.confirm-btn.danger:active:not(:disabled) {
  background: #DC2626;
}

.confirm-btn:disabled {
  background: #A0C4FF;
  cursor: not-allowed;
}

/* 过渡动画 */
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
