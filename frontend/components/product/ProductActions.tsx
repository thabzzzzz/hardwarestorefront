import React, { useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'
import styles from './ProductActions.module.css'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import { toast } from 'react-toastify'

type Props = {
  price?: { amount_cents: number; currency: string } | null,
  id?: string | null,
  title?: string | null,
  thumbnail?: string | null,
  stock?: { qty_available?: number; qty_reserved?: number; status?: string } | null
}

export default function ProductActions({ price, id, title, thumbnail, stock }: Props) {
  const [qty, setQty] = useState(1)
  const cart = useCart()
  const wishlist = useWishlist()
  const [busyAdd, setBusyAdd] = useState(false)
  const [busyWish, setBusyWish] = useState(false)

  const displayPrice = price ? formatPriceFromCents(price.amount_cents) : 'Call for price'

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!id) return toast.error('Missing product id')
    if (busyAdd) return
    setBusyAdd(true)
    try {
      const entry = {
        id,
        title: title || 'Product',
        thumbnail: thumbnail || null,
        price: price ? { amount_cents: price.amount_cents } : null,
        stock: stock || null
      }
      const res = cart.addOrUpdate(entry, qty)
      if (res.added) {
        toast.success('Added to cart')
      } else {
        toast.info(res.message || 'Updated cart')
      }
    } catch (err) {
      console.error('Failed to add to cart', err)
      toast.error('Failed to add to cart')
    } finally {
      setBusyAdd(false)
    }
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    if (!id) return toast.error('Missing product id')
    if (busyWish) return
    setBusyWish(true)
    try {
      const already = wishlist.isWished(id)
      if (already) {
        wishlist.remove(id)
        toast.info('Removed from wishlist')
      } else {
        wishlist.addOrUpdate({ id, title: title || 'Product', thumbnail: thumbnail || null, price: price ? { amount_cents: price.amount_cents } : null, stock: stock || null }, 1)
        toast.success('Added to wishlist')
      }
    } catch (err) {
      console.error('Wishlist error', err)
      toast.error('Could not update wishlist')
    } finally {
      setBusyWish(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.price}>{displayPrice}</div>

      <div className={styles.controls}>
        <label className={styles.qtyLabel}>Qty
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value || 1))} className={styles.qtyInput} />
        </label>
        <button className={styles.addButton} onClick={handleAddToCart} disabled={busyAdd} aria-busy={busyAdd}>{busyAdd ? 'Adding...' : 'Add to Basket'}</button>
        <button className={styles.wishlistButtonLarge} onClick={handleWishlist} disabled={busyWish} aria-pressed={wishlist.isWished(id || '')} aria-busy={busyWish} title={wishlist.isWished(id || '') ? 'Remove from wishlist' : 'Add to wishlist'}>
          {wishlist.isWished(id || '') ? 'In Wishlist' : (busyWish ? '...' : 'Add to Wishlist')}
        </button>
      </div>
    </div>
  )
}
