import React, { useState, useEffect } from 'react'
import styles from './MobileStickyAction.module.css'
import formatPriceFromCents from '../../lib/formatPrice'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder.js'
import FavoriteIcon from '@mui/icons-material/Favorite.js'
import Button from '@mui/material/node/Button/index.js'
import { toast } from '../../lib/toast'
import useAddFeedback from '../../hooks/useAddFeedback'

type Props = {
  visible: boolean
  product: {
    id: string
    price?: { amount_cents: number; currency: string } | null
    title?: string
    thumbnail?: string | null
    stock?: { qty_available?: number; qty_reserved?: number; status?: string } | null
  }
}

export default function MobileStickyAction({ visible, product }: Props) {
  const [qty] = useState(1)
  const cart = useCart()
  const wishlist = useWishlist()
  const [busyAdd, setBusyAdd] = useState(false)
  const [busyWish, setBusyWish] = useState(false)
  const { showPlus, showTick, trigger } = useAddFeedback()

  const { id, price, title, thumbnail, stock } = product
  const displayPrice = price ? formatPriceFromCents(price.amount_cents) : 'Call'

  async function handleAddToCart() {
    if (!id) return
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
        trigger(true)
        toast.success(`Check cart: Added ${qty} item(s)`)
      } else {
        trigger(false)
        toast.success(res.message || 'Cart updated')
      }
    } catch (err) {
      console.error('Failed to add to cart', err)
      toast.error('Failed to add to cart')
    } finally {
      setBusyAdd(false)
    }
  }

  // useAddFeedback handles timer cleanup

  async function handleWishlist() {
    if (!id) return
    if (busyWish) return
    setBusyWish(true)
    try {
      if (wishlist.isWished(id)) {
        wishlist.remove(id)
        toast('Removed from wishlist')
      } else {
        wishlist.addOrUpdate({ 
          id, 
          title: title || 'Product', 
          thumbnail: thumbnail || null, 
          price: price ? { amount_cents: price.amount_cents } : null, 
          stock: stock || null 
        }, 1)
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
    <div className={`${styles.container} ${visible ? styles.visible : ''}`}>
      <div className={styles.price}>
        {displayPrice}
      </div>
      <div className={styles.controls}>
        <Button 
          variant="contained" 
          onClick={handleAddToCart}
          className={styles.addButton}
          disabled={!stock || stock.status === 'out_of_stock' || busyAdd}
        >
          {busyAdd ? '...' : <>
              {showPlus ? <span className={styles.plusFeedbackMobile}>+1</span> : showTick ? <span className={styles.tickFeedbackMobile}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span> : 'Buy'}
            </>}
        </Button>

        <Button
          variant="outlined" 
          onClick={handleWishlist}
          className={styles.wishlistButton}
          disabled={busyWish}
          title={wishlist.isWished(id) ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={wishlist.isWished(id)}
        >
          {busyWish ? '...' : (wishlist.isWished(id) ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />)}
        </Button>
      </div>
    </div>
  )
}
