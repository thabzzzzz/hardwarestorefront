import React from 'react'
import styles from './ProductSummary.module.css'

type Props = {
  title: string
  brand?: string
  productId?: string
  stock?: { qty_available?: number; qty_reserved?: number; status?: string }
}

export default function ProductSummary({ title, brand, productId, stock }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.meta}>Product ID: <strong>{productId}</strong></div>
        <div className={styles.availabilityBlock}>
          <div className={styles.availabilityLabel}>Availability</div>
          <div>
            {stock?.status === 'in_stock' && (
              <div className={styles.statusInStock}>In stock — {stock.qty_available ?? '—'}</div>
            )}
            {stock?.status === 'out_of_stock' && (
              <div className={styles.statusOutOfStock}>Out of stock</div>
            )}
            {stock?.status === 'reserved' && (
              <div className={styles.statusReserved}>Reserved — {stock.qty_reserved ?? '—'}</div>
            )}
            {!stock && <div className={styles.statusUnknown}>No stock info</div>}
          </div>
        </div>

        {/* availability and delivery actions removed per request */}
      </div>

      <div className={styles.brandCol}>
        <div className={styles.brandLabel}>Brand</div>
        <div className={styles.brandPill}>{brand}</div>
      </div>
    </div>
  )
}
