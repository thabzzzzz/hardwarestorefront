import React from 'react'
import styles from './ProductSummary.module.css'

type Props = {
  title: string
  brand?: string
  productId?: string
  stock?: { qty_available?: number; qty_reserved?: number; status?: string }
  specs?: Record<string, string> | null
}

export default function ProductSummary({ title, brand, productId, stock, specs }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.infoRow}>
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
        </div>

        <div className={styles.services}>
          <div className={styles.serviceItem}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>Free Delivery Available</span>
          </div>
          <div className={styles.serviceItem}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
             <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>3 Year Warranty</span>
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
