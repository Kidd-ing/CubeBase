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
            
            <!-- 内容区域 -->
            <div class="dialog-content">
              <p class="confirm-message">{{ message }}</p>
            </div>
            
            <!-- 底部按钮 -->
            <div class="dialog-footer">
              <button v-if="showCancel" class="dialog-btn cancel-btn" @click="handleCancel">取消</button>
              <button class="dialog-btn" :class="showCancel ? 'danger-btn' : 'cancel-btn'" @click="handleConfirm">{{ confirmText }}</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'
import { setStatusBarForDialog } from '@/utils/statusBar'
import { useDialogStore } from '@/stores/dialogStore'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '确定要执行此操作吗？' },
  confirmText: { type: String, default: '确定' },
  showCancel: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dialogStore = useDialogStore()
let closeCallback = null

watch(() => props.modelValue, (val) => {
  setStatusBarForDialog(val)
  if (val) {
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

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
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
}

.confirm-message {
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
  text-align: center;
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

.danger-btn {
  background: #F2F3F5;
  color: #F53F3F;
}

.danger-btn:active {
  background: #E5E7EB;
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
