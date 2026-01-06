import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import useWishlist from '../hooks/useWishlist'
import formatPriceFromCents from '../lib/formatPrice'
import Header from '../components/header/header'
import styles from './wishlist.module.css'

export default function WishlistPage(): JSX.Element {
  const w = useWishlist()
  const [errors, setErrors] = useState<Record<string,string>>({})

  function onQtyChange(id: string, value: string) {
    const qty = Number(value || 0)
    const res = w.updateQty(id, qty)
    setErrors(prev => ({ ...prev, [id]: res.ok ? '' : (res.message || 'Invalid quantity') }))
  }

  function onRemove(id: string) {
    w.remove(id)
  }

  return (
    <div className={styles.root}>
      <Head>
        <title>Wishlist - Wootware Clone</title>
      </Head>
      <Header />
      <h1 className={styles.heading}>My Wishlist</h1>
      {w.count === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyText}>
            <div>{'No items in wishlist¯\\_(ツ)_/¯'}</div>
            <div className={styles.emptySub}>Browse the cataloge and add some</div>
          </div>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr className={styles.headerRow}>
              <th className={styles.cell}>Product</th>
              <th className={`${styles.cell} ${styles.colDate}`}>Date added</th>
              <th className={`${styles.cell} ${styles.colTag}`}>Tag</th>
              <th className={`${styles.cell} ${styles.colPriority}`}>Priority</th>
              <th className={`${styles.cell} ${styles.colQty}`}>Qty <span className={styles.smallNote}>(limited by stock)</span></th>
              <th className={`${styles.cell} ${styles.colSubtotal}`}>Subtotal</th>
              <th className={`${styles.cell} ${styles.colActions}`}></th>
            </tr>
          </thead>
          <tbody>
            {w.items.map(item => (
              <tr key={item.id} className={styles.row}>
                <td className={styles.cell}>
                  <div className={styles.productCell}>
                    <img src={item.thumbnail || '/images/products/placeholder.png'} alt={item.title} className={styles.thumb} />
                    <div>
                      <div className={styles.prodTitle}>{item.title}</div>
                      <div className={styles.prodStock}>{item.stock?.status === 'out_of_stock' ? 'Out of stock' : (item.stock?.status === 'reserved' ? 'Reserved' : '')}</div>
                    </div>
                  </div>
                </td>
                <td className={`${styles.cell} ${styles.metaCell}`}>{item.added_at ? new Date(item.added_at).toLocaleString() : '-'}</td>
                <td className={styles.cell}>
                  <select value={item.tag ?? 'none'} onChange={(e) => w.updateMeta(item.id, { tag: e.target.value as any })} className={styles.select}>
                    <option value="none">None</option>
                    <option value="gift">Gift</option>
                    <option value="research">Research</option>
                  </select>
                </td>
                <td className={styles.cell}>
                  <select value={item.priority ?? 'low'} onChange={(e) => w.updateMeta(item.id, { priority: e.target.value as any })} className={styles.select}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </td>
                <td className={styles.cell}>
                  <input type="number" min={1} value={item.qty} onChange={(e) => onQtyChange(item.id, e.target.value)} className={styles.qtyInput} max={item.stock?.qty_available ?? undefined} />
                  {errors[item.id] && <div className={styles.error}>{errors[item.id]}</div>}
                </td>
                <td className={styles.cell}>{w.formatPrice(item.price?.amount_cents ?? 0)}</td>
                <td className={styles.cell}>
                  <button onClick={() => onRemove(item.id)} className={styles.removeButton}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td />
              <td className={styles.cellBold}>Total</td>
              <td className={styles.cellBold}>{w.formatPrice(w.totalCents)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}
