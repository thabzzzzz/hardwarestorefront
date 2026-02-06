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
    <div className={styles.root}>
      <Head>
        <title>Cart - WiredWorkshop</title>
      </Head>
      <Header />
      <main className={styles.main}>
        <Typography
          variant="h4"
          component="h1"
          className={styles.heading}
          sx={{ fontFamily: 'Helvetica, Roboto, Arial, sans-serif', fontWeight: 700 }}
        >
          My Cart
        </Typography>

        {cart.count === 0 ? (
          <Paper className={styles.emptyCard} elevation={1}>
            <Box textAlign="center" py={6}>
              <Typography variant="h6">{'No items in cart ¯\\_(ツ)_/¯'}</Typography>
              <Typography variant="body2" color="text.secondary" className={styles.emptySub}>Browse the catalog and add some</Typography>
            </Box>
          </Paper>
        ) : (
          <div className={styles.tableCard}>
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
                    <td className={`${styles.cell} ${styles.metaCell}`}>{item.added_at ? new Date(item.added_at).toLocaleString() : '-'}</td>
                    <td className={styles.cell}>
                      <TextField
                        type="number"
                        size="small"
                        value={item.qty}
                        onChange={(e) => onQtyChange(item.id, e.target.value)}
                        inputProps={{ min: 1 }}
                        error={Boolean(errors[item.id])}
                        helperText={errors[item.id] || ''}
                        sx={{ width: '80px' }}
                      />
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
        )}
      </main>
    </div>
  )
}
