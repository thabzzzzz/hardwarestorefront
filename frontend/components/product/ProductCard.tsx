import React, { useState } from 'react'
import Link from 'next/link'
import styles from './ProductCard.module.css'
import formatPriceFromCents from '../../lib/formatPrice'
import useWishlist from '../../hooks/useWishlist'
import useCart from '../../hooks/useCart'
import getDisplayTitle from '../../lib/getDisplayTitle'
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

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

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

  const displayTitle = getDisplayTitle({ title, name, manufacturer, productType })
  let vendorLabel: string | null = vendor ? String(vendor).trim() : null

  // wishlist hook (frontend-only localStorage)
  const wishlist = useWishlist()
  const cart = useCart()
  const id = String(slug || sku || name || title)
  const inCart = cart.items.some(i => i.id === (sku ?? id))

  // Click handler for the new Wishlist button. Locks the button until the operation
  // completes, shows appropriate toasts for success / already-in-wishlist / errors.
  const [busyAdd, setBusyAdd] = useState(false)
  const [busy, setBusy] = useState(false)
  async function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busyAdd) return
    setBusyAdd(true)
    try {
      const already = wishlist.isWished(id)
      if (already) {
        wishlist.remove(id)
        toast.info('Removed from wishlist')
      } else {
        try {
          wishlist.addOrUpdate({ id, title: displayTitle, thumbnail: t, price: price ? { amount_cents: price.amount_cents } : null, stock: stock || null }, 1)
          toast.success('Added to wishlist')
        } catch (err) {
          console.error('Failed to add to wishlist', err)
          toast.error('Could not add to wishlist')
        }
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
        <div className={styles.actionsRow}>
          <div>
            <button
              className={`${styles.wishlistButton} ${inCart ? styles.inCart : ''}`}
              onClick={async (e: React.MouseEvent) => {
                e.preventDefault()
                e.stopPropagation()
                if (busy || inCart) return
                setBusy(true)
                try {
                  const entry = {
                    id: sku ?? id,
                    title: displayTitle,
                    thumbnail: t,
                    price: price ? { amount_cents: price.amount_cents } : null,
                    stock: stock || null
                  }
                  const res = cart.addOrUpdate(entry, 1)
                  if (!res.added) {
                    toast.info('Product already in cart')
                  } else {
                    toast.success('Added to cart')
                  }
                } catch (e) {
                  toast.error('Failed to add to cart')
                } finally { setBusy(false) }
              }}
              disabled={busy || inCart}
              aria-busy={busy}
            >
              {inCart ? 'In cart' : (busy ? 'Adding...' : 'Add to cart')}
            </button>
          </div>
          <div>
            <button
              onClick={handleWishlistClick}
              disabled={busyAdd}
              aria-busy={busyAdd}
              aria-pressed={wishlist.isWished(id)}
              className={`${styles.wishlistHeart} ${wishlist.isWished(id) ? styles.inWishlistHeart : ''}`}
              title={wishlist.isWished(id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {wishlist.isWished(id) ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 3.99 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.09 4.81 13.76 4 15.5 4 18.01 4 20 6 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M20.8 8.6c0 4.2-3.4 7.3-8.1 11.8L12 21.35l-0.7-0.85C6.6 15.9 3.2 12.8 3.2 8.6 3.2 6 5.2 4 7.8 4c1.9 0 3.7 1 4.2 2.4.5-1.4 2.3-2.4 4.2-2.4 2.6 0 4.6 2 4.6 4.6z" />
                </svg>
              )}
            </button>
          </div>
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
