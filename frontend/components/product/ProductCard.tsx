import React from 'react'
import Link from 'next/link'
import styles from './ProductCard.module.css'
import formatPriceFromCents from '../../lib/formatPrice'

type Props = {
  title: string
  vendor?: string | null
  name?: string
  sku?: string
  stock?: { qty_available?: number; qty_reserved?: number; status?: string } | null
  thumbnail?: string | null
  price?: { amount_cents: number; currency: string } | null
  slug?: string
  manufacturer?: string | null
  productType?: string | null
  cores?: number | string | null
  boostClock?: string | null
  microarchitecture?: string | null
  socket?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function ProductCard({ name, title, vendor, sku, stock, thumbnail, price, slug, manufacturer, productType, cores, boostClock, microarchitecture, socket }: Props) {
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

  let displayTitle = (name && String(name).trim().length) ? String(name) : title
  let vendorLabel: string | null = vendor ? String(vendor).trim() : null

  // Keep the full product title by default. For CPUs, append structured specs when available.
  const isCpu = (productType && String(productType).toLowerCase().includes('cpu')) || /\b(ryzen|core|athlon|epyc|xeon)\b/i.test(title)
  if (isCpu) {
    // Prefix manufacturer if provided and not already present in title
    if (manufacturer && !new RegExp('^\\s*' + manufacturer.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i').test(displayTitle)) {
      displayTitle = `${manufacturer} ${displayTitle}`
    }
    // Keep CPU card titles concise and consistent with the product detail page.
    // Only ensure the manufacturer is present; do not append technical spec suffixes here.
  }

  const content = (
    <article className={styles.container}>
      <div className={styles.title}>{displayTitle}</div>
      <div className={styles.imageWrapper}>
        <img src={src} alt={title} className={styles.img} />
      </div>
      {/* removed brand/vendor display */}
      <div className={`${styles.sku} ${stock ? (stock.status === 'out_of_stock' ? styles.stockOut : (stock.status === 'reserved' ? styles.stockReserved : styles.stockIn)) : ''}`}>
        {stock ? (
          stock.status === 'out_of_stock' ? 'Out of stock' : (stock.status === 'reserved' ? `Reserved (${stock.qty_reserved ?? 0})` : `In stock (${stock.qty_available ?? 0})`)
        ) : (
          'Availability unknown'
        )}
      </div>
      <div className={styles.priceWrap}>
        {price ? (
          <div className={styles.price}>{formatPriceFromCents(price.amount_cents)}</div>
        ) : (
          <div className={styles.priceEmpty}>Price not available</div>
        )}
      </div>
      {/* Wishlist removed - feature deleted. */}
    </article>
  )

  if (slug) {
    return (
      <Link href={`/product/${slug}`} className={styles.link}>{content}</Link>
    )
  }

  return content
}
