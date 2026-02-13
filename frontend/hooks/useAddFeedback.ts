import { useCallback, useEffect, useRef, useState } from 'react'

export default function useAddFeedback(duration = 700) {
  const [showPlus, setShowPlus] = useState(false)
  const [showTick, setShowTick] = useState(false)
  const plusTimerRef = useRef<number | null>(null)
  const tickTimerRef = useRef<number | null>(null)

  const trigger = useCallback((added: boolean) => {
    if (added) {
      setShowTick(true)
      if (tickTimerRef.current) window.clearTimeout(tickTimerRef.current)
      tickTimerRef.current = window.setTimeout(() => setShowTick(false), duration) as unknown as number
    } else {
      setShowPlus(true)
      if (plusTimerRef.current) window.clearTimeout(plusTimerRef.current)
      plusTimerRef.current = window.setTimeout(() => setShowPlus(false), duration) as unknown as number
    }
  }, [duration])

  useEffect(() => {
    return () => {
      if (plusTimerRef.current) window.clearTimeout(plusTimerRef.current)
      if (tickTimerRef.current) window.clearTimeout(tickTimerRef.current)
    }
  }, [])

  return { showPlus, showTick, trigger }
}
