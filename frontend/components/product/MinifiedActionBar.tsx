import React, { useState, useEffect } from 'react'
import styles from './MinifiedActionBar.module.css'
import formatPriceFromCents from '../../lib/formatPrice'
import useCart from '../../hooks/useCart'
import useWishlist from '../../hooks/useWishlist'
import Button from '@mui/material/node/Button/index.js'
import Typography from '@mui/material/node/Typography/index.js'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward.js'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder.js'
import FavoriteIcon from '@mui/icons-material/Favorite.js'
import AddIcon from '@mui/icons-material/Add.js'
import RemoveIcon from '@mui/icons-material/Remove.js'
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
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return
      setIsMobile(window.innerWidth <= 600)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

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
        toast.success(res.message || 'Cart updated')
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

  function incrementQty() {
    setQty(prev => prev + 1)
  }

  function decrementQty() {
    setQty(prev => Math.max(1, prev - 1))
  }

  // Determine container class
  const containerClass = `${styles.container} ${visible ? styles.visible : ''}`

  return (
    <div className={containerClass}>
      {isMobile ? (
        <div className={styles.mobileRow}>
          <div className={styles.price}>
            {displayPrice}
          </div>
          
          <div className={styles.qtyControl}>
            <Button
              variant="outlined"
              size="small"
              onClick={decrementQty}
              disabled={qty <= 1}
              sx={{ minWidth: '32px', padding: '4px' }}
            >
              <RemoveIcon fontSize="small" />
            </Button>
            <Typography sx={{ minWidth: '32px', textAlign: 'center', fontSize: '14px' }}>
              {qty}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={incrementQty}
              sx={{ minWidth: '32px', padding: '4px' }}
            >
              <AddIcon fontSize="small" />
            </Button>
          </div>

          <Button 
            variant="contained" 
            color="primary"
            onClick={handleAddToCart}
            disabled={busyAdd}
            size="small"
            sx={{ textTransform: 'none', marginLeft: '8px' }}
          >
            <span className={styles.plusIcon} aria-hidden>
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M3 8h10"/></svg>
            </span>
            Add to cart
          </Button>

          <Button 
            variant="outlined" 
            color="secondary"
            onClick={handleWishlist}
            disabled={busyWish}
            size="small"
            aria-pressed={inWishlist}
            sx={{ textTransform: 'none', minWidth: '40px', marginLeft: '8px' }}
            title={inWishlist ? "Un-save" : "Save for later"}
          >
            {inWishlist ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </Button>
        </div>
      ) : (
        <>
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
                <span className={styles.plusIcon} aria-hidden>
                  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v10M3 8h10"/></svg>
                </span>
                Add to cart
              </Button>

              <Button 
                variant="outlined" 
                color="secondary"
                onClick={handleWishlist}
                disabled={busyWish}
                size="small"
                aria-pressed={inWishlist}
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
        </>
      )}
    </div>
  )
}
