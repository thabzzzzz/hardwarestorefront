import React, { useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'
import styles from './ProductActions.module.css'

type Props = {
  price?: { amount_cents: number; currency: string } | null
}

export default function ProductActions({ price }: Props) {
  const [qty, setQty] = useState(1)

  const displayPrice = price ? formatPriceFromCents(price.amount_cents) : 'Call for price'

  return (
    <div className={styles.container}>
      <div className={styles.price}>{displayPrice}</div>

      <div className={styles.controls}>
        <label className={styles.qtyLabel}>Qty
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 1))} className={styles.qtyInput} />
        </label>
        <button className={styles.addButton}>Add to Basket</button>
      </div>
    </div>
  )
}
