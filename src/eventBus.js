import { reactive } from 'vue'
import mitt from 'mitt'

export const EventBus = reactive({
  on: (...args) => emitter.on(...args),
  emit: (...args) => emitter.emit(...args),
  off: (...args) => emitter.off(...args),
})

const emitter = mitt()