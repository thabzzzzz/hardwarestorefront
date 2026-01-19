import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import useCart from '../hooks/useCart'
import formatPriceFromCents from '../lib/formatPrice'
import Header from '../components/header/header'
import styles from './cart.module.css'

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
    <div className={styles.page}>
      <Head>
        <title>Cart - Wootware Clone</title>
      </Head>
      <Header />
      <h1 className={styles.title}>My Cart</h1>
      {cart.count === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyText}>
            <div>{'No items in wishlist¯\\_(ツ)_/¯'}</div>
            <div className={styles.emptySuggest}>Browse the cataloge and add some</div>
          </div>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.th}>Product</th>
                <th className={`${styles.th} ${styles.colDate}`}>Date added</th>
                <th className={`${styles.th} ${styles.colQty}`}>Qty <span className={styles.smallNote}>(limited by stock)</span></th>
                <th className={`${styles.th} ${styles.colSubtotal}`}>Subtotal</th>
                <th className={`${styles.th} ${styles.colActions}`}></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map(item => (
                <tr key={item.id} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.productCell}>
                      <img src={item.thumbnail || '/images/products/placeholder.png'} alt={item.title} className={styles.productImg} />
                      <div>
                        <div className={styles.productTitle}>{item.title}</div>
                        <div className={styles.productStock}>{item.stock?.status === 'out_of_stock' ? 'Out of stock' : (item.stock?.status === 'reserved' ? 'Reserved' : '')}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.dateCell}`}>{item.added_at ? new Date(item.added_at).toLocaleString() : '-'}</td>
                  <td className={styles.td}>
                    <input type="number" min={1} value={item.qty} onChange={(e) => onQtyChange(item.id, e.target.value)} className={styles.qtyInput} max={item.stock?.qty_available ?? undefined} />
                    {errors[item.id] && <div className={styles.errorText}>{errors[item.id]}</div>}
                  </td>
                  <td className={styles.td}>{cart.formatPrice(item.price?.amount_cents ?? 0)}</td>
                  <td className={styles.td}>
                    <button onClick={() => onRemove(item.id)} className={styles.removeButton}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td className={styles.tdSummaryLabel}>Total</td>
                <td className={styles.tdSummaryValue}>{cart.formatPrice(cart.totalCents)}</td>
                <td className={styles.td}>
                  <button onClick={() => { cart.clear() }} className={styles.clearAllButton}>Clear cart</button>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    )
  }
