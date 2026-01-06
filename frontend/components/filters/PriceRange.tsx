import React, { useEffect, useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'
import styles from './PriceRange.module.css'

type Props = {
  maxCents: number
  valueMin?: number
  valueMax?: number
  onChange?: (minCents: number, maxCents: number) => void
}

export default function PriceRange({ maxCents, valueMin = 0, valueMax, onChange }: Props) {
  const maxInit = Math.max(0, maxCents)
  const [min, setMin] = useState<number>(valueMin)
  const [max, setMax] = useState<number>(valueMax ?? maxInit)

  useEffect(() => {
    setMax(valueMax ?? maxInit)
  }, [valueMax, maxInit])

  useEffect(() => {
    if (onChange) onChange(min, max)
  }, [min, max])

  function onMinChange(v: number) {
    const next = Math.min(v, max)
    setMin(next)
  }

  function onMaxChange(v: number) {
    const next = Math.max(v, min)
    setMax(next)
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Price</label>
      <div className={styles.rangesRow}>
        <div className={styles.rangeCol}>
          <div className={styles.rangeLabelLeft}>Min</div>
          <input type="range" min={0} max={maxInit} value={min} onChange={(e) => onMinChange(Number(e.target.value))} className={styles.range} />
        </div>
        <div className={styles.gutter} />
        <div className={styles.rangeCol}>
          <div className={styles.rangeLabelRight}>Max</div>
          <input type="range" min={0} max={maxInit} value={max} onChange={(e) => onMaxChange(Number(e.target.value))} className={styles.range} />
        </div>
      </div>
      <div className={styles.totalsRow}>
        <div>{formatPriceFromCents(min)}</div>
        <div>{formatPriceFromCents(max)}</div>
      </div>
    </div>
  )
}
