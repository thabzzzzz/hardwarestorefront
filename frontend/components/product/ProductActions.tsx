import React, { useState } from 'react'
import formatPriceFromCents from '../../lib/formatPrice'
import styles from './ProductActions.module.css'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder.js'
import FavoriteIcon from '@mui/icons-material/Favorite.js'
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
  stock?: { qty_available?: number; qty_reserved?: number; status?: string } | null,
  useNativeQty?: boolean
}

export default function ProductActions({ price, id, title, thumbnail, stock, useNativeQty = true }: Props) {
  const [qty, setQty] = useState(1)
  const cart = useCart()
  const wishlist = useWishlist()
  const inWishlist = (() => {
    try {
      return wishlist.items.some(i => (
        i.id === (id || '') || (i.title && title && i.title === title) || (i.thumbnail && thumbnail && i.thumbnail === thumbnail)
      ))
    } catch (e) { return wishlist.isWished(id || '') }
  })()
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
        toast.success(res.message || 'Cart updated')
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
      const found = wishlist.items.find(i => (
        i.id === (id || '') || (i.title && title && i.title === title) || (i.thumbnail && thumbnail && i.thumbnail === thumbnail)
      ))
      if (found) {
        wishlist.remove(found.id)
        console.info('Removed from wishlist')
        toast('Removed from wishlist')
      } else {
        wishlist.addOrUpdate({ id: id || '', title: title || 'Product', thumbnail: thumbnail || null, price: price ? { amount_cents: price.amount_cents } : null, stock: stock || null }, 1)
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
        {useNativeQty ? (
          <TextField
            type="number"
            inputProps={{ min: 1 }}
            value={qty}
            size="small"
            onChange={(e) => setQty(Number((e.target as HTMLInputElement).value || 1))}
            className={styles.qtyInput}
            label="Qty"
          />
        ) : (
          <div className={styles.qtyControl}>
            <button
              className={styles.qtyButton}
              aria-label="Decrease quantity"
              onClick={() => setQty(q => Math.max(1, q - 1))}
              disabled={stock?.status === 'out_of_stock' || (stock?.qty_available !== undefined && qty <= 1)}
            >-</button>
            <div className={styles.qtyValue} aria-live="polite">{qty}</div>
            <button
              className={styles.qtyButton}
              aria-label="Increase quantity"
              onClick={() => setQty(q => {
                const max = stock?.qty_available
                if (typeof max === 'number') return Math.min(max, q + 1)
                return q + 1
              })}
              disabled={stock?.status === 'out_of_stock' || (stock?.qty_available !== undefined && qty >= (stock?.qty_available || 1))}
            >+</button>
          </div>
        )}

        <Button 
          variant="contained" 
          className={styles.addButton} 
          onClick={handleAddToCart} 
          disabled={busyAdd} 
          aria-busy={busyAdd}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {busyAdd ? 'Adding...' : <>
            <span className={styles.plusIcon} aria-hidden>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M3 8h10"/></svg>
            </span>
            <span className={styles.hideOnMobile}>Add to cart</span>
            <span className={styles.showOnMobile}>Add to cart</span>
          </>}
        </Button>

        <Button 
          variant="outlined" 
          className={styles.wishlistButtonLarge} 
          onClick={handleWishlist} 
          disabled={busyWish} 
          aria-pressed={inWishlist} 
          aria-busy={busyWish} 
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          color="secondary"
          sx={{ textTransform: 'none', fontWeight: 700, minWidth: '44px', padding: '8px' }}
        >
          {busyWish ? '...' : (inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />)}
        </Button>
      </div>
    </Paper>
  )
}
