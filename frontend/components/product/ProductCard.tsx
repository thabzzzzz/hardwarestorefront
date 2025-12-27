import React from 'react'

type Props = {
  title: string
  sku?: string
  thumbnail?: string | null
  price?: { amount_cents: number; currency: string } | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function ProductCard({ title, sku, thumbnail, price }: Props) {
  const src = thumbnail ? (thumbnail.startsWith('http') ? thumbnail : `${API_BASE}${thumbnail}`) : '/images/products/placeholder.png'
  return (
    <article style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
      <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        <img src={src} alt={title} style={{ maxHeight: '100%', maxWidth: '100%' }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
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
}
