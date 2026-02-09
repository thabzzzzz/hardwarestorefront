import React, { useState } from 'react'
import styles from './MinifiedActionBar.module.css'
import formatPriceFromCents from '../../lib/formatPrice'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import Button from '@mui/material/node/Button/index.js'
import Typography from '@mui/material/node/Typography/index.js'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward.js'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder.js'
import FavoriteIcon from '@mui/icons-material/Favorite.js'
import { toast } from '../../lib/toast'

type Props = {
  visible: boolean
  product: {
    id: string
    title: string
    thumbnail: string | null
    price?: { amount_cents: number; currency: string } | null
    stock?: { qty_available?: number; qty_reserved?: number; status?: string } | null
  }
}

export default function MinifiedActionBar({ visible, product }: Props) {
  const [qty, setQty] = useState(1)
  const cart = useCart()
  const wishlist = useWishlist()
  const [busyAdd, setBusyAdd] = useState(false)
  const [busyWish, setBusyWish] = useState(false)

  const { id, title, thumbnail, price, stock } = product
  const displayPrice = price ? formatPriceFromCents(price.amount_cents) : 'Call for price'
  const displayStock = stock?.qty_available ? `${stock.qty_available} In Stock` : (stock?.status || 'Unknown Status')
  const inWishlist = wishlist.isWished(id)

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
        toast.success(`Check cart: Added ${qty} item(s)`)
      } else {
        toast('Already in cart')
      }
    } catch (err) {
      console.error('Failed to add to cart', err)
      toast.error('Failed to add to cart')
    } finally {
      setBusyAdd(false)
    }
  }

  async function handleWishlist() {
    if (!id) return
    if (busyWish) return
    setBusyWish(true)
    try {
      if (inWishlist) {
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

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Determine container class
  const containerClass = `${styles.container} ${visible ? styles.visible : ''}`

  return (
    <div className={containerClass}>
      <div className={styles.leftSection}>
        {thumbnail && (
          <img src={thumbnail} alt={title} className={styles.thumbnail} />
        )}
        <div className={styles.productInfo}>
          <Typography className={styles.title}>{title}</Typography>
          <Typography className={styles.stock} variant="caption">
             {displayStock}
          </Typography>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.price}>
          {displayPrice}
        </div>
        
        <div className={styles.actions}>
           <Button 
            variant="contained" 
            color="primary"
            onClick={handleAddToCart}
            disabled={busyAdd}
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Add to Cart
          </Button>

          <Button 
            variant="outlined" 
            color={inWishlist ? "secondary" : "inherit"}
            onClick={handleWishlist}
            disabled={busyWish}
            size="small"
            sx={{ textTransform: 'none', minWidth: '40px' }}
            title={inWishlist ? "Un-save" : "Save for later"}
          >
            {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </Button>

           <Button 
            variant="outlined" 
            className={styles.topButton} 
            onClick={scrollToTop}
            title="Scroll to Top"
          >
            <ArrowUpwardIcon fontSize="small" />
          </Button>
        </div>
      </div>
    </div>
  )
}
