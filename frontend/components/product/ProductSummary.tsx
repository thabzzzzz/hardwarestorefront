import React from 'react'

type Props = {
  title: string
  brand?: string
  productId?: string
  stock?: { qty_available?: number; status?: string }
}

export default function ProductSummary({ title, brand, productId, stock }: Props) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: '0 0 8px 0' }}>{title}</h2>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Product ID: <strong>{productId}</strong></div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>Availability</div>
          <div style={{ color: stock?.status === 'in_stock' ? 'green' : '#c00' }}>{stock?.status === 'in_stock' ? `In stock (${stock?.qty_available})` : 'Out of stock'}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button style={{ background: '#ff8c00', color: '#fff', border: 'none', padding: '8px 12px' }}>Confirm Availability</button>
          <button style={{ background: '#eee', border: '1px solid #ddd', padding: '8px 12px' }}>Calculate Delivery</button>
        </div>
      </div>

      <div style={{ minWidth: 160, textAlign: 'right' }}>
        <div style={{ fontSize: 14, color: '#888' }}>Brand</div>
        <div style={{ marginTop: 6, padding: '6px 10px', background: '#333', color: '#fff', display: 'inline-block' }}>{brand}</div>
      </div>
    </div>
  )
}
