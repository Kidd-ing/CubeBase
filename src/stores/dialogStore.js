import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDialogStore = defineStore('dialog', () => {
  const stack = ref([])

  function push(closeCallback) {
    stack.value.push(closeCallback)
  }

  function remove(closeCallback) {
    const idx = stack.value.indexOf(closeCallback)
    if (idx > -1) {
      stack.value.splice(idx, 1)
    }
  }

  function pop() {
    if (stack.value.length > 0) {
      const close = stack.value.pop()
      close()
    }
  }

  function isOpen() {
    return stack.value.length > 0
  }

  function clear() {
    stack.value = []
  }

  return { stack, push, remove, pop, isOpen, clear }
})
