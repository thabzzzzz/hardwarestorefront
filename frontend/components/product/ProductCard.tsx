import React from 'react'
import Link from 'next/link'
import styles from './ProductCard.module.css'

type Props = {
  title: string
  vendor?: string | null
  sku?: string
  thumbnail?: string | null
  price?: { amount_cents: number; currency: string } | null
  slug?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function ProductCard({ title, vendor, sku, thumbnail, price, slug }: Props) {
  // normalize legacy `/products/...` paths to `/images/products/...` so thumbnails resolve
  let t = thumbnail || null
  if (t && typeof t === 'string' && t.startsWith('/products/')) {
    t = t.replace(/^\/products\//, '/images/products/')
  }
  // If `t` is an absolute path (starts with '/'), use it directly so the browser
  // requests the asset from the same origin (avoids cross-origin opaque blocking).
  const src = t
    ? (t.startsWith('http') ? t : (t.startsWith('/') ? t : `${API_BASE}${t}`))
    : '/images/products/placeholder.png'

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  let displayTitle = title
  let vendorLabel: string | null = vendor ? String(vendor).trim() : null
  if (vendorLabel) {
    // match vendor at start followed by separators (colon, dash, en-dash, or whitespace)
    const rx = new RegExp('^\\s*' + escapeRegExp(vendorLabel) + '(?:[:\\s\\-–]+)', 'i')
    if (rx.test(displayTitle)) {
      displayTitle = displayTitle.replace(rx, '').trim()
    }
  } else {
    vendorLabel = null
  }

  const content = (
    <article className={styles.container}>
      <div className={styles.imageWrapper}>
        <img src={src} alt={title} className={styles.img} />
      </div>
      <div className={styles.vendor}>
        <span className={styles.vendorSpan}>{vendorLabel || ''}</span>
      </div>
      <div className={styles.title}>{displayTitle}</div>
      <div className={styles.sku}>{sku}</div>
      <div className={styles.priceWrap}>
        {price ? (
          <div className={styles.price}>{(price.amount_cents / 100).toLocaleString()} {price.currency}</div>
        ) : (
          <div className={styles.priceEmpty}>Price not available</div>
        )}
      </div>
    </article>
  )

  if (slug) {
    return (
      <Link href={`/product/${slug}`} className={styles.link}>{content}</Link>
    )
  }

  return content
}
