import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/header/header'
import ProductCard from '../components/product/ProductCard'
import styles from '../styles/home.module.css'
import pageStyles from './search.module.css'
import MobileFiltering from '../components/filters/MobileFiltering'

import formatPriceFromCents from '../lib/formatPrice'
import Paper from '@mui/material/node/Paper'
import Box from '@mui/material/node/Box'
import Typography from '@mui/material/node/Typography'
import FormControl from '@mui/material/node/FormControl'
import FormGroup from '@mui/material/node/FormGroup'
import FormControlLabel from '@mui/material/node/FormControlLabel'
import Checkbox from '@mui/material/node/Checkbox'
import Button from '@mui/material/node/Button'
import InputLabel from '@mui/material/node/InputLabel'
import Select from '@mui/material/node/Select'
import MenuItem from '@mui/material/node/MenuItem'
import Pagination from '@mui/material/node/Pagination'
import PaginationItem from '@mui/material/node/PaginationItem'
import Slider from '@mui/material/node/Slider'
import TextField from '@mui/material/node/TextField'

type SearchItem = {
  variant_id: string
  title: string
  sku?: string
  current_price?: { amount_cents: number; currency: string } | null
  thumbnail?: string | null
  stock?: { qty_available: number; qty_reserved?: number; status: string } | null
  slug?: string | null
  manufacturer?: string | null
  board_partner?: string | null
  product_type?: string | null
  cores?: number | string | null
  boost_clock?: string | null
  microarchitecture?: string | null
  socket?: string | null
  name?: string
  brand?: string
}

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

export default function SearchPage(): JSX.Element {
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [totalPages, setTotalPages] = useState(1)

  const [priceMin, setPriceMin] = useState<number>(0)
  const maxCents = useMemo(() => {
    let m = 0
    for (const it of items) {
      const c = Number(it.current_price?.amount_cents || 0)
      if (c > m) m = c
    }
    return m
  }, [items])
  const [priceMax, setPriceMax] = useState<number>(maxCents)
  const [priceRangeRand, setPriceRangeRand] = useState<[number, number]>([0, Math.ceil(maxCents / 100)])
  const [globalMinCents, setGlobalMinCents] = useState<number | null>(null)
  const [globalMaxCents, setGlobalMaxCents] = useState<number | null>(null)
  const [hasAppliedPriceFilter, setHasAppliedPriceFilter] = useState(false)
  const userTouchedPrice = useRef(false)
  const effectiveMaxCents = globalMaxCents ?? Math.max(maxCents, priceMax || 0)
  const sliderMaxRand = Math.max(Math.ceil((effectiveMaxCents || 0) / 100), 1)
  const sliderStep = 1

  // resync max when items change — but do NOT shrink the slider max
  // once the user has interacted with it, and prefer server-provided
  // global bounds when available.
  useEffect(() => {
    if (userTouchedPrice.current) return

    const effectiveMax = globalMaxCents !== null ? globalMaxCents : maxCents
    const nextMaxCents = Math.max(0, Math.ceil(effectiveMax || 0))
    
    setPriceMax(nextMaxCents)
    setPriceRangeRand(prev => {
        const currentMinRand = prev ? prev[0] : 0
        const newMaxRand = Math.ceil(nextMaxCents / 100)
        const finalMaxRand = Math.max(1, newMaxRand)
        return [currentMinRand, finalMaxRand]
    })
  }, [maxCents, globalMaxCents])

  const [filterInStock, setFilterInStock] = useState(false)
  const [filterReserved, setFilterReserved] = useState(false)
  const [filterOutOfStock, setFilterOutOfStock] = useState(false)
  const [sortBy, setSortBy] = useState<string>('price_asc')

  const router = useRouter()
  // const [lastAction, setLastAction] = useState<string>('') // Not really needed for functional logic but good for debug
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const initialPageSynced = useRef(false)

  // On first ready, initialize `page` from the URL query if present.
  useEffect(() => {
    if (!router.isReady) return
    if (initialPageSynced.current) return
    initialPageSynced.current = true
    const qp = router.query.page
    if (!qp) return
    const raw = Array.isArray(qp) ? qp[0] : qp
    const n = Number(raw)
    if (Number.isFinite(n) && n >= 1) {
      setPage(Math.max(1, Math.floor(n)))
    }
  }, [router.isReady, router.query.page])
  
  // Also sync `q` into local state if needed? 
  // We can just read router.query.q directly for the API call.

  useEffect(() => {
    if (!router.isReady) return

    async function load() {
      setLoading(true)
      try {
        const q = router.query.q || ''
        let url = `${API_BASE}/api/products?per_page=${perPage}&page=${page}`
        
        if (q) {
           url += `&q=${encodeURIComponent(String(q))}`
        }

        // Pass server-side filters
        if (hasAppliedPriceFilter) {
          if (priceMin !== null) url += `&price_min=${priceMin}`
          if (priceMax !== null) url += `&price_max=${priceMax}`
        }
        
        // Stock Status
        const stockStatus: string[] = []
        if (filterInStock) stockStatus.push('in_stock')
        if (filterReserved) stockStatus.push('reserved')
        if (filterOutOfStock) stockStatus.push('out_of_stock')
        if (stockStatus.length > 0) {
          const sParams = stockStatus.map(s => `stock_status[]=${encodeURIComponent(s)}`).join('&')
          url += `&${sParams}`
        }

        if (sortBy) {
          if (sortBy === 'price_asc') {
            url += '&sort=price&order=asc'
          } else if (sortBy === 'price_desc') {
            url += '&sort=price&order=desc'
          } else if (sortBy === 'date_desc') {
            url += '&sort=date&order=desc'
          } else if (sortBy === 'date_asc') {
            url += '&sort=date&order=asc'
          }
        }

        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to fetch search results')
        const json = await res.json()
        setItems(json.data || [])
        
        // Correctly read pagination from root (standard Laravel paginate response)
        const lastPage = json.last_page || 1
        setTotalPages(lastPage)

        // meta: { price_min, price_max }
        if (json.meta) {
            // If server returns global price bounds for this category/search
            if (typeof json.meta.price_min === 'number') setGlobalMinCents(json.meta.price_min)
            if (typeof json.meta.price_max === 'number') setGlobalMaxCents(json.meta.price_max)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [
    router.isReady, 
    router.query.q, 
    page, 
    perPage, 
    filterInStock, 
    filterReserved, 
    filterOutOfStock,
    hasAppliedPriceFilter, // only re-fetch if filter is applied
    // if we added debouncing for price, we would track that. 
    // For now, let's assume `hasAppliedPriceFilter` toggles or we rely on a manual apply or debounce.
    // In gpus.tsx, it triggers nicely. But wait, `priceMin/Max` changes on slider drag?
    // In gpus.tsx, the slider updates `priceRangeRand` (state) and only triggers fetch if we debounce or user stops?
    // Let's check gpus.tsx logic for slider interaction. 
    // It seems gpus.tsx might not re-fetch immediately on slider drag unless there is a debounce or "Apply" mechanism I missed.
    // Actually, gpus.tsx implementation I read:
    // `useEffect` for `load` depends on `[..., priceMin, priceMax, ...]`. 
    // So it fetches on every price change.
    // BUT the slider usually updates a local state and `onCommitted` updates the filter state?
    // Let's implement robust slider logic below.
    sortBy
  ])
  
  // IMPORTANT: The effect above depends on `sortBy`, `page`, etc.
  // Ideally we should depend on `priceMin`/`priceMax` IF `hasAppliedPriceFilter` is true.
  // Or we update `priceMin`/`priceMax` only when user commits slider change.

  // handle slider change
  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    const val = newValue as [number, number]
    setPriceRangeRand(val)
  }
  
  const handleSliderCommit = (event: Event | React.SyntheticEvent | undefined, newValue: number | number[]) => {
      const [minRand, maxRand] = newValue as [number, number]
      setPriceMin(minRand * 100)
      setPriceMax(maxRand * 100)
      setPriceRangeRand([minRand, maxRand])
      setHasAppliedPriceFilter(true)
      userTouchedPrice.current = true
      setPage(1) // reset page on filter
  }

  const handleStockInfoChange = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
      setter(val)
      setPage(1)
  }

  const handleSortChange = (e: any) => {
      setSortBy(e.target.value)
      setPage(1)
  }

  const q = String(router.query.q || '')

  if (!mounted) return <></>

  const filterContent = (
    <Box p={1}>
        <Typography variant="h6" className={pageStyles.filterHeading}>Filters</Typography>
        
        <div className={pageStyles.priceBlock}>
            <Typography variant="subtitle1" className={pageStyles.stockLabel}>Price Range</Typography>
            <Slider
                getAriaLabel={() => 'Price range'}
                value={priceRangeRand}
                onChange={handleSliderChange}
                onChangeCommitted={handleSliderCommit}
                valueLabelDisplay="auto"
                min={0}
                max={sliderMaxRand} // Rand
            />
            <div className={pageStyles.priceInputs}>
                <TextField 
                    size="small" 
                    label="Min" 
                    type="number" 
                    value={priceRangeRand[0]} 
                    onChange={(e) => {
                        const v = Number(e.target.value)
                        setPriceRangeRand([v, priceRangeRand[1]])
                    }}
                    onBlur={() => handleSliderCommit(undefined, priceRangeRand)}
                />
                <TextField 
                    size="small" 
                    label="Max" 
                    type="number" 
                    value={priceRangeRand[1]} 
                    onChange={(e) => {
                        const v = Number(e.target.value)
                        setPriceRangeRand([priceRangeRand[0], v])
                    }}
                    onBlur={() => handleSliderCommit(undefined, priceRangeRand)}
                />
            </div>
        </div>

        <div className={pageStyles.stockBlock}>
        <Typography variant="subtitle1" className={pageStyles.stockLabel}>Availability</Typography>
        <FormControl component="fieldset" variant="standard">
            <FormGroup>
                <FormControlLabel 
                    control={<Checkbox checked={filterInStock} onChange={(e) => handleStockInfoChange(setFilterInStock, e.target.checked)} size="small" />} 
                    label="In Stock" 
                />
                <FormControlLabel 
                    control={<Checkbox checked={filterReserved} onChange={(e) => handleStockInfoChange(setFilterReserved, e.target.checked)} size="small" />} 
                    label="Reserved" 
                />
                <FormControlLabel 
                    control={<Checkbox checked={filterOutOfStock} onChange={(e) => handleStockInfoChange(setFilterOutOfStock, e.target.checked)} size="small" />} 
                    label="Out of Stock" 
                />
            </FormGroup>
        </FormControl>
        </div>
    </Box>
  )

  return (
    <div className={styles.container}>
      <Header />
      <main className={pageStyles.main}>
        {q && <div className={pageStyles.breadcrumb}>Search results for: "{q}"</div>}
        
        <div className={pageStyles.controlsRow}>
            <h1 className={pageStyles.title}>{items.length} Results</h1>
            <div className={pageStyles.controlsLeft}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel id="sort-by-label">Sort By</InputLabel>
                    <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        label="Sort By"
                        onChange={handleSortChange}
                    >
                        <MenuItem value="price_asc">Price: Low to High</MenuItem>
                        <MenuItem value="price_desc">Price: High to Low</MenuItem>
                        <MenuItem value="date_desc">Newest Arrivals</MenuItem>
                        <MenuItem value="date_asc">Oldest</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="show-label">Show</InputLabel>
                    <Select
                        labelId="show-label"
                        value={perPage}
                        label="Show"
                        onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                    >
                        <MenuItem value={12}>12</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                        <MenuItem value={48}>48</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                    </Select>
                </FormControl>
            </div>
        </div>

        <div className={pageStyles.container}>
          <Paper className={pageStyles.sidebar} elevation={0}>
            {filterContent}
          </Paper>
          
          <section className={pageStyles.resultsSection}>
             {loading && items.length === 0 ? (
                 <div className={pageStyles.grid}>
                    {Array.from({length: 6}).map((_, i) => (
                        <div key={i} className={pageStyles.skelCard}>
                            <div className={`${pageStyles.skel}`} style={{height: 180, width: '100%'}}></div>
                            <div className={`${pageStyles.skel}`} style={{height: 20, width: '80%'}}></div>
                            <div className={`${pageStyles.skel}`} style={{height: 20, width: '40%'}}></div>
                        </div>
                    ))}
                 </div>
             ) : items.length === 0 ? (
                 <Paper sx={{p: 4, textAlign: 'center'}}>
                    <Typography variant="h6" color="text.secondary">No products found for "{q}" matching your filters.</Typography>
                    <Button variant="outlined" sx={{mt:2}} onClick={() => {
                        setPriceMin(0); setPriceMax(99999999);
                        setFilterInStock(false); setFilterReserved(false); setFilterOutOfStock(false);
                        setPriceRangeRand([0, 100000]); // heuristic reset
                        setHasAppliedPriceFilter(false);
                        router.reload(); // or just reset state
                    }}>Clear Filters</Button>
                 </Paper>
             ) : (
                <>
                  <div className={pageStyles.grid}>
                    {items.map(it => (
                      <ProductCard
                        key={it.variant_id}
                        name={it.name}
                        title={it.title}
                        vendor={it.brand || it.manufacturer} // fallback
                        sku={it.sku}
                        stock={it.stock || null}
                        thumbnail={it.thumbnail}
                        price={it.current_price || null}
                        slug={it.slug}
                        manufacturer={it.manufacturer}
                        productType={it.product_type}
                        cores={it.cores}
                        boostClock={it.boost_clock}
                        microarchitecture={it.microarchitecture}
                        socket={it.socket}
                      />
                    ))}
                  </div>
                  <div className={pageStyles.bottomPagination} style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                    <Pagination 
                        count={totalPages} 
                        page={page} 
                        onChange={(e, v) => { setPage(v); window.scrollTo({top:0, behavior:'smooth'}) }} 
                        color="primary" 
                    />
                  </div>
                </>
             )}
          </section>
        </div>
      </main>
      
      <MobileFiltering
        sortOptions={[
            { value: "price_asc", label: "Price: Low to High" },
            { value: "price_desc", label: "Price: High to Low" },
            { value: "date_desc", label: "Newest Arrivals" },
            { value: "date_asc", label: "Oldest" },
        ]}
        currentSort={sortBy}
        onSortChange={setSortBy}
      >
        {filterContent}
      </MobileFiltering>
    </div>
  )
}
