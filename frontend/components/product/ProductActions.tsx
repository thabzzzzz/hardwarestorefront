import React, { useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'
import styles from './ProductActions.module.css'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import Button from '@mui/material/node/Button/index.js'
import TextField from '@mui/material/node/TextField/index.js'
import Paper from '@mui/material/node/Paper/index.js'
import Typography from '@mui/material/node/Typography/index.js'
import { toast } from '../../lib/toast'

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
    if (!id) { console.error('Missing product id'); return }
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
        console.info('Added to cart')
        toast.success(`Check cart: Added ${qty} item(s)`)
      } else {
        console.info(res.message || 'Updated cart')
        toast('Already in cart')
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
    if (!id) { console.error('Missing product id'); return }
    if (busyWish) return
    setBusyWish(true)
    try {
      const already = wishlist.isWished(id)
      if (already) {
        wishlist.remove(id)
        console.info('Removed from wishlist')
        toast('Removed from wishlist')
      } else {
        wishlist.addOrUpdate({ id, title: title || 'Product', thumbnail: thumbnail || null, price: price ? { amount_cents: price.amount_cents } : null, stock: stock || null }, 1)
        console.info('Added to wishlist')
        toast.success('Added to wishlist')
      }
    } catch (err) {
      console.error('Wishlist error', err)
      console.error('Could not update wishlist')
      toast.error('Could not update wishlist')
    } finally {
      setBusyWish(false)
    }
  }

  return (
    <Paper className={styles.container} elevation={0}>
      <div className={styles.price}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>{displayPrice}</Typography>
      </div>

      <div className={styles.controls}>
        <TextField
          type="number"
          inputProps={{ min: 1 }}
          value={qty}
          size="small"
          onChange={(e) => setQty(Number((e.target as HTMLInputElement).value || 1))}
          className={styles.qtyInput}
          label="Qty"
        />

        <Button variant="contained" className={styles.addButton} onClick={handleAddToCart} disabled={busyAdd} aria-busy={busyAdd}>
          {busyAdd ? 'Adding...' : 'Add to Basket'}
        </Button>

        <Button variant="outlined" className={styles.wishlistButtonLarge} onClick={handleWishlist} disabled={busyWish} aria-pressed={wishlist.isWished(id || '')} aria-busy={busyWish} title={wishlist.isWished(id || '') ? 'Remove from wishlist' : 'Add to wishlist'}>
          {wishlist.isWished(id || '') ? 'In Wishlist' : (busyWish ? '...' : 'Add to Wishlist')}
        </Button>
      </div>
    </Paper>
  )
}
