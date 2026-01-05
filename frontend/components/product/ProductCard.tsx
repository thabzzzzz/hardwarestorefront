import React, { useState } from 'react'
import Link from 'next/link'
import styles from './ProductCard.module.css'
import formatPriceFromCents from '../../lib/formatPrice'
import useWishlist from '../../hooks/useWishlist'
import { toast } from 'react-toastify'

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

  // wishlist hook (frontend-only localStorage)
  const wishlist = useWishlist()
  const id = String(slug || sku || name || title)

  // Click handler for the new Wishlist button. Locks the button until the operation
  // completes, shows appropriate toasts for success / already-in-wishlist / errors.
  const [busyAdd, setBusyAdd] = useState(false)
  async function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault()
    if (busyAdd) return
    setBusyAdd(true)
    try {
      const already = wishlist.isWished(id)
      if (already) {
        // remove (toggle) is allowed; but user requested to surface 'already in wishlist' as message
        toast.info('Item already in wishlist')
        return
      }

      try {
        // add synchronously; keep the async wrapper so we can lock UI while it completes
        wishlist.addOrUpdate({ id, title: displayTitle, thumbnail: t, price: price ? { amount_cents: price.amount_cents } : null, stock: stock || null }, 1)
        toast.success('Added to wishlist')
      } catch (err) {
        console.error('Failed to add to wishlist', err)
        toast.error('Could not add to wishlist')
      }
    } finally {
      setBusyAdd(false)
    }
  }

  const content = (
    <article className={styles.container}>
      {/* Wishlist button placed beneath the price (no heart icon) */}
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
        <div style={{ marginTop: 8 }}>
          <button
            onClick={handleWishlistClick}
            disabled={busyAdd}
            aria-busy={busyAdd}
            className={`${styles.wishlistButton} ${wishlist.isWished(id) ? styles.inWishlist : ''}`}
          >
            {busyAdd ? 'Adding...' : (wishlist.isWished(id) ? 'In wishlist' : 'Wishlist')}
          </button>
        </div>
      </div>
      {/* wishlist button present */}
    </article>
  )

  if (slug) {
    return (
      <Link href={`/product/${slug}`} className={styles.link}>{content}</Link>
    )
  }

  return content
}
