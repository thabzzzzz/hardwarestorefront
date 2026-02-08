import React, { useState } from 'react'
import Head from 'next/head'
import useWishlist from '../hooks/useWishlist'
import Header from '../components/header/header'
import styles from './wishlist.module.css'

import Paper from '@mui/material/node/Paper/index.js'
import Box from '@mui/material/node/Box/index.js'
import Typography from '@mui/material/node/Typography/index.js'
import Select from '@mui/material/node/Select/index.js'
import MenuItem from '@mui/material/node/MenuItem/index.js'
import TextField from '@mui/material/node/TextField/index.js'
import Button from '@mui/material/node/Button/index.js'
import FormControl from '@mui/material/node/FormControl/index.js'
import IconButton from '@mui/material/node/IconButton/index.js'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline.js'
import AddIcon from '@mui/icons-material/Add.js'
import RemoveIcon from '@mui/icons-material/Remove.js'

export default function WishlistPage(): JSX.Element {
  const w = useWishlist()
  const [errors, setErrors] = useState<Record<string,string>>({})

  function onQtyChange(id: string, value: string) {
    const qty = Number(value || 0)
    const res = w.updateQty(id, qty)
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
    w.remove(id)
  }

  // Calculate total for internal use if strictly needed, though w.totalCents exists
  const totalCents = w.totalCents || 0

  return (
    <div className={styles.root}>
      <Head>
        <title>Wishlist - WiredWorkshop</title>
      </Head>
      <Header />
      <main className={styles.main}>
        {/* Mobile Header */}
        <div className={styles.mobileOnly}>
           <div className={styles.heading}>
              <Typography variant="h6" component="h1" sx={{ fontFamily: 'Helvetica, Roboto, Arial, sans-serif', fontWeight: 700, fontSize: '18px' }}>
                My Wishlist ({w.count} items)
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
          My Wishlist
        </Typography>

        {w.count === 0 ? (
          <Paper className={styles.emptyCard} elevation={1}>
            <Box textAlign="center" py={6}>
              <Typography variant="h6">{'No items in wishlist¯\\_(ツ)_/¯'}</Typography>
              <Typography variant="body2" color="text.secondary" className={styles.emptySub}>Browse the catalog and add some</Typography>
            </Box>
          </Paper>
        ) : (
          <>
          <div className={`${styles.tableCard} ${styles.desktopOnly}`}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.headerRow}>
                  <th className={styles.cell}>Product</th>
                  <th className={`${styles.cell} ${styles.colDate}`}>Date added</th>
                  <th className={`${styles.cell} ${styles.colTag}`}>Tag</th>
                  <th className={`${styles.cell} ${styles.colPriority}`}>Priority</th>
                  <th className={`${styles.cell} ${styles.colQty}`}>
                    Qty <span className={styles.smallNote}>(limited by stock)</span>
                  </th>
                  <th className={`${styles.cell} ${styles.colSubtotal}`}>Subtotal</th>
                  <th className={`${styles.cell} ${styles.colActions}`}></th>
                </tr>
              </thead>
              <tbody>
                {w.items.map(item => {
                  const tagClass = item.tag === 'gift' ? styles.tagGiftWrap : item.tag === 'research' ? styles.tagResearchWrap : styles.tagNoneWrap
                  const priorityClass = item.priority === 'high' ? styles.priorityHighWrap : item.priority === 'medium' ? styles.priorityMedWrap : styles.priorityLowWrap

                  return (
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
                        <FormControl size="small" variant="outlined" className={`${styles.pillControl} ${tagClass}`} fullWidth>
                          <Select
                            value={item.tag ?? 'none'}
                            onChange={(e) => w.updateMeta(item.id, { tag: e.target.value as any })}
                            fullWidth
                          >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="gift">Gift</MenuItem>
                            <MenuItem value="research">Research</MenuItem>
                          </Select>
                        </FormControl>
                      </td>

                      <td className={styles.cell}>
                        <FormControl size="small" variant="outlined" className={`${styles.pillControl} ${priorityClass}`} fullWidth>
                          <Select
                            value={item.priority ?? 'low'}
                            onChange={(e) => w.updateMeta(item.id, { priority: e.target.value as any })}
                            fullWidth
                          >
                            <MenuItem value="low">Low</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="high">High</MenuItem>
                          </Select>
                        </FormControl>
                      </td>

                      <td className={styles.cell}>
                        <TextField
                          type="number"
                          size="small"
                          value={item.qty}
                          onChange={(e) => onQtyChange(item.id, e.target.value)}
                          inputProps={{ min: 1, max: item.stock?.qty_available ?? undefined }}
                          error={Boolean(errors[item.id])}
                          helperText={errors[item.id] || ''}
                        />
                      </td>

                      <td className={styles.cell}>
                        <Typography variant="body1" component="span">{w.formatPrice(item.price?.amount_cents ?? 0)}</Typography>
                      </td>

                      <td className={`${styles.cell} ${styles.colActions}`}>
                        <IconButton size="small" color="error" onClick={() => onRemove(item.id)} aria-label="Remove">
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className={styles.cellBold}>Total</td>
                  <td className={styles.cellBold}><Typography variant="body1" component="span" sx={{ fontWeight: 700 }}>{w.formatPrice(w.totalCents)}</Typography></td>
                  <td>
                    <Button size="small" variant="outlined" color="error" onClick={() => w.clear()} sx={{ fontWeight: 700 }}>
                      Clear wishlist
                    </Button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Mobile Card Layout */}
          <div className={`${styles.mobileList} ${styles.mobileOnly}`}>
             {w.items.map(item => {
                const tagClass = item.tag === 'gift' ? styles.tagGiftWrap : item.tag === 'research' ? styles.tagResearchWrap : styles.tagNoneWrap
                const priorityClass = item.priority === 'high' ? styles.priorityHighWrap : item.priority === 'medium' ? styles.priorityMedWrap : styles.priorityLowWrap

                return (
                  <div key={item.id} className={styles.mobileCard}>
                    <div className={styles.cardTop}>
                      <img src={item.thumbnail || '/images/products/placeholder.png'} alt={item.title} className={styles.mobileThumb} />
                      <div className={styles.cardContent}>
                          <div className={styles.mobileTitleLink}>{item.title}</div>
                          <div className={styles.mobilePrice}>{w.formatPrice(item.price?.amount_cents ?? 0)}</div>
                      </div>
                    </div>

                    <div className={styles.cardActions}>
                      <IconButton className={styles.iconBtn} onClick={() => onRemove(item.id)}>
                          <DeleteOutlineIcon fontSize="small" />
                      </IconButton>

                      <div className={styles.qtyControl}>
                        <button className={styles.qtyBtn} onClick={() => decrement(item.id, item.qty)}>
                            <RemoveIcon fontSize="small" />
                        </button>
                        <div className={styles.qtyVal}>{item.qty}</div>
                        <button className={styles.qtyBtn} onClick={() => increment(item.id, item.qty)}>
                            <AddIcon fontSize="small" />
                        </button>
                      </div>
                    </div>

                    <div className={styles.metaRow} style={{ marginTop: 12 }}>
                        <FormControl size="small" variant="outlined" className={`${styles.metaControl} ${styles.pillControl} ${tagClass}`} sx={{minWidth: 90}}>
                            <Select
                                value={item.tag ?? 'none'}
                                onChange={(e) => w.updateMeta(item.id, { tag: e.target.value as any })}
                                fullWidth
                                inputProps={{ style: { padding: '6px 10px', fontSize: 13 } }}
                            >
                                <MenuItem value="none">None</MenuItem>
                                <MenuItem value="gift">Gift</MenuItem>
                                <MenuItem value="research">Research</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" variant="outlined" className={`${styles.metaControl} ${styles.pillControl} ${priorityClass}`} sx={{minWidth: 90}}>
                            <Select
                                value={item.priority ?? 'low'}
                                onChange={(e) => w.updateMeta(item.id, { priority: e.target.value as any })}
                                fullWidth
                                inputProps={{ style: { padding: '6px 10px', fontSize: 13 } }}
                            >
                                <MenuItem value="low">Low</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                            </Select>
                        </FormControl>
                    </div>

                    <div className={styles.mobileDate}>Date Added: {item.added_at ? new Date(item.added_at).toLocaleDateString() : 'Unknown'}</div>
                  </div>
                )
             })}
              
             <Box sx={{ p: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth 
                    onClick={() => w.clear()}
                    sx={{ fontWeight: 700, bgcolor: 'white' }}
                  >
                    Clear Wishlist
                  </Button>
             </Box>

             <div className={styles.footerCta}>
                 <div className={styles.estTotalLine} style={{marginBottom: 0}}>
                    <span className={styles.totalLabel}>Total Value</span>
                    <span className={styles.totalAmt}>{w.formatPrice(w.totalCents)}</span>
                 </div>
             </div>
          </div>
          </>        )}
      </main>
    </div>
  )
}
