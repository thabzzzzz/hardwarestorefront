import React, { useState } from 'react'

type Props = {
  price?: { amount_cents: number; currency: string } | null
}

export default function ProductActions({ price }: Props) {
  const [qty, setQty] = useState(1)

  const displayPrice = price ? `${(price.amount_cents / 100).toFixed(2)} ${price.currency}` : 'Call for price'

  return (
    <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{displayPrice}</div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ fontSize: 13 }}>Qty
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 1))} style={{ width: 56, marginLeft: 6 }} />
        </label>
        <button style={{ background: '#ff8c00', color: '#fff', border: 'none', padding: '10px 14px' }}>Add to Basket</button>
      </div>
    </div>
  )
}
