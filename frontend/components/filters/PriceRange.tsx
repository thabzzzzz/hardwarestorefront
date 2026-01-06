import React, { useEffect, useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700 }}>Price</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, marginBottom: 6, textAlign: 'left' }}>Min</div>
          <input type="range" min={0} max={maxInit} value={min} onChange={(e) => onMinChange(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
        <div style={{ width: 12 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, marginBottom: 6, textAlign: 'right' }}>Max</div>
          <input type="range" min={0} max={maxInit} value={max} onChange={(e) => onMaxChange(Number(e.target.value))} style={{ width: '100%' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <div>{formatPriceFromCents(min)}</div>
        <div>{formatPriceFromCents(max)}</div>
      </div>
    </div>
  )
}
