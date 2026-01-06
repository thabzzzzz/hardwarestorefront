import React, { useEffect, useRef, useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'
import styles from './PriceRange.module.css'

type Props = {
  maxCents: number
  valueMin?: number
  valueMax?: number
  onChange?: (minCents: number, maxCents: number) => void
  onCommit?: (minCents: number, maxCents: number) => void
}

export default function PriceRange({ maxCents, valueMin = 0, valueMax, onChange, onCommit }: Props) {
  const maxInit = Math.max(0, maxCents)
  const [min, setMin] = useState<number>(valueMin)
  const [max, setMax] = useState<number>(valueMax ?? maxInit)
  const [draggingMax, setDraggingMax] = useState(false)
  const [draggingMin, setDraggingMin] = useState(false)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    // do not stomp the user's active drag
    if (!draggingMax) setMax(valueMax ?? maxInit)
  }, [valueMax, maxInit])

  // keep min synced when parent updates it
  useEffect(() => {
    setMin(valueMin)
  }, [valueMin])

  useEffect(() => {
    if (!onChange) return

    const isDragging = draggingMin || draggingMax
    // when dragging, debounce updates to parent to avoid stomping and re-renders
    if (isDragging) {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      // send intermittent updates while dragging (150ms)
      debounceRef.current = window.setTimeout(() => {
        debounceRef.current = null
        onChange(min, max)
      }, 150)
    } else {
      // immediate update when not dragging
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      onChange(min, max)
    }

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [min, max, draggingMin, draggingMax, onChange])

  function onMinChange(v: number) {
    const next = Math.min(v, max)
    setMin(next)
  }

  function onMaxChange(v: number) {
    const next = Math.max(v, min)
    setMax(next)
  }

  useEffect(() => {
    function handlePointerUp() {
      // commit any pending debounce immediately on pointerup
      setDraggingMin(false)
      setDraggingMax(false)
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (onCommit) onCommit(min, max)
      else if (onChange) onChange(min, max)
    }
    window.addEventListener('pointerup', handlePointerUp)
    return () => window.removeEventListener('pointerup', handlePointerUp)
  }, [min, max, onChange, onCommit])

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Price</label>
      <div className={styles.rangesRow}>
        <div className={styles.rangeCol}>
          <div className={styles.rangeLabelLeft}>Min</div>
          <input
            type="range"
            min={0}
            max={maxInit}
            value={min}
            onChange={(e) => onMinChange(Number(e.target.value))}
            onPointerDown={() => setDraggingMin(true)}
            className={styles.range}
          />
        </div>
        <div className={styles.gutter} />
        <div className={styles.rangeCol}>
          <div className={styles.rangeLabelRight}>Max</div>
          <input
            type="range"
            min={0}
            max={maxInit}
            value={max}
            onChange={(e) => onMaxChange(Number(e.target.value))}
            onPointerDown={() => setDraggingMax(true)}
            className={styles.range}
          />
        </div>
      </div>
      <div className={styles.totalsRow}>
        <div>{formatPriceFromCents(min)}</div>
        <div>{formatPriceFromCents(max)}</div>
      </div>
    </div>
  )
}
