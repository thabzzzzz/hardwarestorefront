import React, { useState } from 'react'
import Head from 'next/head'
import useCart from '../hooks/useCart'
import Header from '../components/header/header'
import styles from './cart.module.css'

import Paper from '@mui/material/node/Paper/index.js'
import Box from '@mui/material/node/Box/index.js'
import Typography from '@mui/material/node/Typography/index.js'
import TextField from '@mui/material/node/TextField/index.js'
import Button from '@mui/material/node/Button/index.js'
import IconButton from '@mui/material/node/IconButton/index.js'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline.js'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder.js'

export default function CartPage(): JSX.Element {
  const cart = useCart()
  const [errors, setErrors] = useState<Record<string,string>>({})

  function fmtDate(dateStr?: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  function onQtyChange(id: string, value: string) {
    const qty = Number(value || 0)
    const res = cart.updateQty(id, qty)
    setErrors(prev => ({ ...prev, [id]: res.ok ? '' : (res.message || 'Invalid quantity') }))
  }

  function increment(id: string, current: number) {
    onQtyChange(id, String(current + 1))
  }

  function decrement(id: string, current: number) {
    if (current > 1) {
      onQtyChange(id, String(current - 1))
    }
  }

  function onRemove(id: string) {
    cart.remove(id)
  }

  return (
    <div className={styles.root}>
      <Head>
        <title>Shopping Cart - WiredWorkshop</title>
      </Head>
      <Header />
      <main className={styles.main}>
        {/* Mobile Header */}
        <div className={styles.mobileOnly}>
           <div className={styles.heading}>
              <Typography variant="h6" component="h1" sx={{ fontFamily: 'Helvetica, Roboto, Arial, sans-serif', fontWeight: 700, fontSize: '18px' }}>
                Shopping Cart ({cart.count} items)
              </Typography>
           </div>
        </div>

        {/* Desktop Header */}
        <Typography
          variant="h4"
          component="h1"
          className={`${styles.heading} ${styles.desktopOnly}`}
          sx={{ fontFamily: 'Helvetica, Roboto, Arial, sans-serif', fontWeight: 700 }}
        >
          My Cart
        </Typography>

        {cart.count === 0 ? (
          <Paper className={styles.emptyCard} elevation={0}>
            <Box textAlign="center" py={6}>
              <Typography variant="h6">{'No items in cart ¯\\_(ツ)_/¯'}</Typography>
              <Typography variant="body2" color="text.secondary" className={styles.emptySub}>Browse the catalog and add some</Typography>
            </Box>
          </Paper>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.cell}>Product</th>
                  <th className={`${styles.cell} ${styles.colDate}`}>Date added</th>
                  <th className={`${styles.cell} ${styles.colQty}`}>Qty</th>
                  <th className={`${styles.cell} ${styles.colSubtotal}`}>Subtotal</th>
                  <th className={`${styles.cell} ${styles.colActions}`}></th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map(item => (
                  <tr key={item.id} className={styles.row}>
                    <td className={styles.cell}>
                      <div className={styles.productCell}>
                        <img src={item.thumbnail || '/images/products/placeholder.png'} alt={item.title} className={styles.thumb} />
                        <div>
                          <Typography component="div" variant="body1" className={styles.prodTitle} sx={{ fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <div className={styles.prodStock}>
                            {item.stock?.status === 'out_of_stock' ? 'Out of stock' : item.stock?.status === 'reserved' ? 'Reserved' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`${styles.cell} ${styles.metaCell}`}>{item.added_at ? fmtDate(item.added_at) : '-'}</td>
                    <td className={styles.cell}>
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyButton}
                          aria-label="Decrease quantity"
                          onClick={() => decrement(item.id, item.qty)}
                          disabled={item.qty <= 1}
                        >-</button>
                        <div className={styles.qtyValue} aria-live="polite">{item.qty}</div>
                        <button
                          className={styles.qtyButton}
                          aria-label="Increase quantity"
                          onClick={() => increment(item.id, item.qty)}
                          disabled={item.stock?.status === 'out_of_stock' || (item.stock?.qty_available !== undefined && item.qty >= (item.stock?.qty_available || 1))}
                        >+</button>
                      </div>
                      {errors[item.id] && <div className={styles.qtyError}>{errors[item.id]}</div>}
                    </td>
                    <td className={styles.cell}>
                      <Typography variant="body1" component="span">{cart.formatPrice((item.price?.amount_cents ?? 0) * item.qty)}</Typography>
                    </td>
                    <td className={`${styles.cell} ${styles.colActions}`}>
                      <IconButton size="small" color="error" onClick={() => onRemove(item.id)} aria-label="Remove">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  <td />
                  <td className={styles.cellBold}>Total</td>
                  <td className={styles.cellBold}><Typography variant="body1" component="span" sx={{ fontWeight: 700 }}>{cart.formatPrice(cart.totalCents)}</Typography></td>
                  <td>
                    <Button size="small" variant="outlined" color="error" onClick={() => cart.clear()} sx={{ fontWeight: 700 }}>
                      Clear cart
                    </Button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className={`${styles.mobileList} ${styles.mobileOnly}`}>
              {cart.items.map(item => (
                <div key={item.id} className={styles.mobileCard}>
                    <div className={styles.cardHeaderRow}>
                      <div style={{ flex: 1 }} />
                      <IconButton className={styles.iconBtn} onClick={() => onRemove(item.id)} aria-label="Remove">
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </div>

                    <div className={styles.mobileThumbWrap}>
                      <img src={item.thumbnail || '/images/products/placeholder.png'} alt={item.title} className={styles.mobileThumb} />
                    </div>

                    <div className={styles.mobileTitleLink}>{item.title}</div>

                    <div className={styles.priceRow}>
                      <div className={styles.mobilePrice}>{cart.formatPrice((item.price?.amount_cents ?? 0) * item.qty)}</div>
                      <div className={styles.qtyControl}>
                         <button className={styles.qtyBtn} onClick={() => decrement(item.id, item.qty)} disabled={item.qty <= 1}>-</button>
                         <div className={styles.qtyVal}>{item.qty}</div>
                         <button className={styles.qtyBtn} onClick={() => increment(item.id, item.qty)} disabled={item.stock?.status === 'out_of_stock' || (item.stock?.qty_available !== undefined && item.qty >= (item.stock?.qty_available || 1))}>+</button>
                      </div>
                    </div>
                  
                  <div className={styles.mobileDate}>Date Added: {item.added_at ? new Date(item.added_at).toLocaleDateString() : 'Unknown'}</div>
                </div>
              ))}
              
              <Box sx={{ px: 0 }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth 
                    onClick={() => cart.clear()}
                    sx={{ fontWeight: 700, bgcolor: 'white' }}
                  >
                    Clear Cart
                  </Button>
              </Box>

              <div className={styles.footerCta}>
                 <div className={styles.estTotalLine}>
                    <span className={styles.totalLabel}>Est. Total</span>
                    <span className={styles.totalAmt}>{cart.formatPrice(cart.totalCents)}</span>
                 </div>
                 <Button variant="contained" className={styles.checkoutBtn}>Secure Checkout</Button>
              </div>
          </div>
          </>
        )}
      </main>
    </div>
  )
}
