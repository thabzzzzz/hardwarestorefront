import { toast } from './toast'

const lastShown = new Map<string, number>()
const MIN_INTERVAL = 800 // ms

function now() { return Date.now() }

export default {
  success(msg: string) {
    const t = lastShown.get(msg) || 0
    if (now() - t < MIN_INTERVAL) return
    lastShown.set(msg, now())
    toast.success(msg)
  },
  error(msg: string) {
    const t = lastShown.get(msg) || 0
    if (now() - t < MIN_INTERVAL) return
    lastShown.set(msg, now())
    toast.error(msg)
  },
  info(msg: string) {
    const t = lastShown.get(msg) || 0
    if (now() - t < MIN_INTERVAL) return
    lastShown.set(msg, now())
    toast(msg)
  }
}
