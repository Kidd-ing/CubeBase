import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const visible = ref(false)
  const message = ref('')
  const type = ref('info')
  let timer = null

  function show(msg, toastType = 'info', duration = 2000) {
    if (timer) clearTimeout(timer)
    message.value = msg
    type.value = toastType
    visible.value = true
    timer = setTimeout(() => {
      visible.value = false
    }, duration)
  }

  function hide() {
    visible.value = false
    if (timer) clearTimeout(timer)
  }

  function success(msg, duration) { show(msg, 'success', duration) }
  function error(msg, duration) { show(msg, 'error', duration) }
  function warning(msg, duration) { show(msg, 'warning', duration) }
  function info(msg, duration) { show(msg, 'info', duration) }

  return { visible, message, type, show, hide, success, error, warning, info }
})
