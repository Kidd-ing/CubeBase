<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="modelValue" class="dialog-overlay" @click.self="handleCancel">
        <Transition name="dialog-scale">
          <div v-if="modelValue" class="dialog-container" :class="dialogClass" :style="dialogStyle">
            <!-- 标题栏 -->
            <div class="dialog-header">
              <span class="dialog-title">{{ title }}</span>
              <button class="dialog-close" @click="handleCancel">
                <X :size="20" />
              </button>
            </div>
            
            <!-- 内容区域 -->
            <div class="dialog-content">
              <slot />
            </div>
            
            <!-- 底部按钮 -->
            <div class="dialog-footer">
              <template v-if="showOnlyClose">
                <button class="dialog-btn cancel-btn" @click="handleCancel">关闭</button>
              </template>
              <template v-else>
                <button class="dialog-btn cancel-btn" @click="handleCancel">取消</button>
                <button class="dialog-btn confirm-btn" :class="confirmBtnClass" @click="handleSubmit">{{ confirmText }}</button>
              </template>
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
  title: { type: String, default: '' },
  showOnlyClose: { type: Boolean, default: false },
  confirmText: { type: String, default: '确定' },
  confirmBtnClass: { type: String, default: '' },
  dialogClass: { type: String, default: '' },
  dialogStyle: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'submit'])

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

function handleSubmit() {
  emit('submit')
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
  max-height: calc(100vh - var(--status-bar-height, 0px) - 48px);
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
  padding: 0 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
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

.confirm-btn {
  background: #165DFF;
  color: #FFFFFF;
}

.confirm-btn.confirm-wechat {
  background: #07C160;
}

.confirm-btn.confirm-alipay {
  background: #1677FF;
}

.confirm-btn:active:not(.confirm-wechat):not(.confirm-alipay) {
  background: #0E42D2;
}

.confirm-btn.confirm-wechat:active {
  background: #06A853;
}

.confirm-btn.confirm-alipay:active {
  background: #0E6ACC;
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

<!-- 圆角输入框样式 -->
<style>
.el-input__wrapper {
  border-radius: 10px !important;
  box-shadow: none !important;
  background: #F5F7FA !important;
  border: 1px solid #E5E7EB !important;
}

.el-input__wrapper:hover {
  border-color: #165DFF !important;
}

.el-input__wrapper.is-focus {
  border-color: #165DFF !important;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1) !important;
}

.el-input__inner {
  color: #1D2129 !important;
}

.el-input__inner::placeholder {
  color: #86909C !important;
}

.el-form-item__label {
  color: #1D2129 !important;
  font-weight: 500 !important;
}

.el-textarea__inner {
  border-radius: 10px !important;
  box-shadow: none !important;
  background: #F5F7FA !important;
  border: 1px solid #E5E7EB !important;
  color: #1D2129 !important;
}

.el-textarea__inner:hover {
  border-color: #165DFF !important;
}

.el-textarea__inner:focus {
  border-color: #165DFF !important;
  box-shadow: 0 0 0 2px rgba(22, 93, 255, 0.1) !important;
}
</style>
