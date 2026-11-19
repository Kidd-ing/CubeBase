<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastStore.visible" class="toast-container">
        <div class="toast-content" :class="toastClass">
          <span>{{ toastStore.message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useToastStore } from '@/stores/toastStore'

const toastStore = useToastStore()

const toastClass = computed(() => ({
  'toast-success': toastStore.type === 'success',
  'toast-error': toastStore.type === 'error',
  'toast-warning': toastStore.type === 'warning',
  'toast-info': toastStore.type === 'info'
}))
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: calc(var(--status-bar-height, 0px) + 56px + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.toast-content {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: #00B42A;
  color: white;
}

.toast-error {
  background: #F53F3F;
  color: white;
}

.toast-warning {
  background: #FF7D00;
  color: white;
}

.toast-info {
  background: #165DFF;
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
