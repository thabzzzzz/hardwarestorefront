import React from 'react'
import Link from 'next/link'

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
    <article style={{ border: '1px solid #eee', padding: 12, borderRadius: 6, minHeight: 260 }}>
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <img src={src} alt={title} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: 12, color: '#666', fontWeight: 700, marginBottom: 4 }}>
        <span style={{ display: 'inline-block', minWidth: 80 }}>{vendorLabel || ''}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{displayTitle}</div>
      <div style={{ color: '#666', fontSize: 13 }}>{sku}</div>
      <div style={{ marginTop: 8 }}>
        {price ? (
          <div style={{ color: '#ff8c00', fontWeight: 700 }}>{(price.amount_cents / 100).toLocaleString()} {price.currency}</div>
        ) : (
          <div style={{ color: '#999' }}>Price not available</div>
        )}
      </div>
    </article>
  )

  if (slug) {
    return (
      <Link href={`/product/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>
    )
  }

  return content
}
