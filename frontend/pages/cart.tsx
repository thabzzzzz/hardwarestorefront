import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import useCart from '../hooks/useCart'
import formatPriceFromCents from '../lib/formatPrice'
import Header from '../components/header/header'

export default function CartPage(): JSX.Element {
  const cart = useCart()
  const [errors, setErrors] = useState<Record<string,string>>({})

  function onQtyChange(id: string, value: string) {
    const qty = Number(value || 0)
    const res = cart.updateQty(id, qty)
    setErrors(prev => ({ ...prev, [id]: res.ok ? '' : (res.message || 'Invalid quantity') }))
  }

  function onRemove(id: string) {
    cart.remove(id)
  }

  return (
    <div style={{ padding: 24 }}>
      <Head>
        <title>Cart - Wootware Clone</title>
      </Head>
      <Header />
      <h1 style={{ marginTop: 16 }}>My Cart</h1>
      {cart.count === 0 ? (
        <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', fontWeight: 700 }}>
            <div>{'No items in wishlist¯\\_(ツ)_/¯'}</div>
            <div style={{ marginTop: 8, fontWeight: 700 }}>Browse the cataloge and add some</div>
          </div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '8px 6px' }}>Product</th>
              <th style={{ padding: '8px 6px', width: 160 }}>Date added</th>
              <th style={{ padding: '8px 6px', width: 140 }}>Qty</th>
              <th style={{ padding: '8px 6px', width: 160 }}>Subtotal</th>
              <th style={{ padding: '8px 6px', width: 120 }}></th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px 6px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <img src={item.thumbnail || '/images/products/placeholder.png'} alt={item.title} style={{ width: 64, height: 48, objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{item.stock?.status === 'out_of_stock' ? 'Out of stock' : (item.stock?.status === 'reserved' ? 'Reserved' : '')}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 6px', fontSize: 13, color: '#444' }}>{item.added_at ? new Date(item.added_at).toLocaleString() : '-'}</td>
                <td style={{ padding: '12px 6px' }}>
                  <input type="number" min={1} value={item.qty} onChange={(e) => onQtyChange(item.id, e.target.value)} style={{ width: 80, padding: 6 }} max={item.stock?.qty_available ?? undefined} />
                  {errors[item.id] && <div style={{ color: '#c00', fontSize: 12 }}>{errors[item.id]}</div>}
                </td>
                <td style={{ padding: '12px 6px' }}>{cart.formatPrice(item.price?.amount_cents ?? 0)}</td>
                <td style={{ padding: '12px 6px' }}>
                  <button onClick={() => onRemove(item.id)} style={{ background: 'transparent', border: '1px solid #ddd', padding: '6px 10px', cursor: 'pointer' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td style={{ padding: '12px 6px', fontWeight: 700 }}>Total</td>
              <td style={{ padding: '12px 6px', fontWeight: 700 }}>{cart.formatPrice(cart.totalCents)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
