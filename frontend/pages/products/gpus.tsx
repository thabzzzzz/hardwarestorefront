import React, { useEffect, useMemo, useState } from 'react'
import Header from '../../components/header/header'
import ProductCard from '../../components/product/ProductCard'
import styles from '../../styles/home.module.css'
import pageStyles from './gpus.module.css'

import formatPriceFromCents from '../../lib/formatPrice'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Slider from '@mui/material/Slider'
import TextField from '@mui/material/TextField'

type GpuItem = {
  variant_id: string
  title: string
  sku?: string
  current_price?: { amount_cents: number; currency: string } | null
  thumbnail?: string | null
  stock?: { qty_available: number; qty_reserved?: number; status: string } | null
  slug?: string | null
  manufacturer?: string | null
  product_type?: string | null
  cores?: number | string | null
  boost_clock?: string | null
  microarchitecture?: string | null
  socket?: string | null
}

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

export default function GpuListing(): JSX.Element {
  const [items, setItems] = useState<GpuItem[]>([])
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

  // resync max when items change
  useEffect(() => {
    const nextMaxCents = Math.max(0, Math.ceil(maxCents || 0))
    setPriceMax(nextMaxCents)
    setPriceRangeRand([Math.max(0, Math.round(priceMin / 100)), Math.max(0, Math.ceil(nextMaxCents / 100))])
  }, [maxCents])

  const [filterInStock, setFilterInStock] = useState(false)
  const [filterReserved, setFilterReserved] = useState(false)
  const [filterOutOfStock, setFilterOutOfStock] = useState(false)
  const [sortBy, setSortBy] = useState<string>('price_asc')

  const manufacturers = useMemo(() => {
    const s = new Set<string>()
    for (const it of items) {
      const m = String(it.manufacturer || '').trim()
      if (m) s.add(m)
    }
    return Array.from(s).sort()
  }, [items])
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([])

  function toggleManufacturer(m: string) {
    setSelectedManufacturers(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  const sliderMaxRand = Math.max(Math.ceil((maxCents || 0) / 100), 1)
  const sliderStep = 1

  useEffect(() => {
    const boundedMin = Math.max(0, Math.min(Math.round(priceMin / 100), sliderMaxRand))
    const boundedMax = Math.max(boundedMin, Math.min(Math.round((priceMax || sliderMaxRand * 100) / 100), sliderMaxRand))
    setPriceRangeRand([boundedMin, boundedMax])
  }, [priceMin, priceMax, sliderMaxRand])

  function handlePriceSliderChange(_event: Event, value: number | number[]) {
    if (Array.isArray(value)) {
      const [min, max] = value
      const boundedMin = Math.max(0, Math.min(Math.round(min), sliderMaxRand))
      const boundedMax = Math.max(boundedMin, Math.min(Math.round(max), sliderMaxRand))
      setPriceRangeRand([boundedMin, boundedMax])
    }
  }

  function handlePriceSliderCommit() {
    const [min, max] = priceRangeRand
    setPriceMin(min * 100)
    setPriceMax(max * 100)
  }

  function handlePriceInput(kind: 'min' | 'max') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value)
      const safe = Number.isFinite(raw) ? Math.round(raw) : 0
      if (kind === 'min') {
        const bounded = Math.max(0, Math.min(safe, Math.round((priceMax ?? sliderMaxRand * 100) / 100)))
        setPriceMin(bounded * 100)
      } else {
        const bounded = Math.max(Math.round(priceMin / 100), Math.min(safe, sliderMaxRand))
        setPriceMax(bounded * 100)
      }
    }
  }

  const filtered = useMemo(() => {
    return items.filter(it => {
      // manufacturer filter
      if (selectedManufacturers.length > 0) {
        const man = String(it.manufacturer || '').trim()
        if (!selectedManufacturers.includes(man)) return false
      }
      const cents = Number(it.current_price?.amount_cents || 0)
      if (cents < priceMin || cents > priceMax) return false

      const raw = String(it.stock?.status || '').toLowerCase()
      const status = raw === 'out_of_stock' ? 'out_of_stock' : (raw === 'reserved' ? 'reserved' : 'in_stock')

      const anyStockFilter = filterInStock || filterReserved || filterOutOfStock
      if (!anyStockFilter) return true

      if (status === 'in_stock' && filterInStock) return true
      if (status === 'reserved' && filterReserved) return true
      if (status === 'out_of_stock' && filterOutOfStock) return true
      return false
    })
  }, [items, priceMin, priceMax, filterInStock, filterReserved, filterOutOfStock, selectedManufacturers])
  

  // apply client-side sorting for price options (server handles date sorting)
  const sortedProducts = useMemo(() => {
    const arr = filtered.slice()
    if (sortBy === 'price_asc') {
      arr.sort((a, b) => (Number(a.current_price?.amount_cents || 0) - Number(b.current_price?.amount_cents || 0)))
    } else if (sortBy === 'price_desc') {
      arr.sort((a, b) => (Number(b.current_price?.amount_cents || 0) - Number(a.current_price?.amount_cents || 0)))
    }
    return arr
  }, [filtered, sortBy])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let url = `${API_BASE}/api/gpus?per_page=${perPage}&page=${page}`
        if (sortBy.startsWith('date')) {
          const order = sortBy.endsWith('_asc') ? 'asc' : 'desc'
          url += `&sort=date&order=${order}`
        }
        const res = await fetch(url)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch gpus failed (non-JSON response)', res.status, text.slice(0, 400))
          setItems([])
          setTotalPages(1)
          return
        }

        const json = await res.json()
        setItems(json.data || [])
        const total = json.last_page || Math.ceil((json.total || 0) / perPage)
        setTotalPages(total)
      } catch (e) {
        console.error('fetch gpus failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, perPage, sortBy])

  // Reset to first page when sort changes
  useEffect(() => {
    setPage(1)
  }, [sortBy])

  // Reset to first page when price filters change
  useEffect(() => { setPage(1) }, [priceMin, priceMax])

  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.main} ${pageStyles.main}`}>
        <nav className={pageStyles.breadcrumb}>Home / Hardware / Graphics Cards</nav>
        <h1 className={pageStyles.title}>Graphics Cards</h1>

        <div className={pageStyles.controlsRow}>
          <div className={pageStyles.controlsLeft}>
            <FormControl size="small" className={pageStyles.smallSelectLabel}>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(String(e.target.value))}
              >
                <MenuItem value={"price_asc"}>Price: Low to High</MenuItem>
                <MenuItem value={"price_desc"}>Price: High to Low</MenuItem>
                <MenuItem value={"date_desc"}>Date: Newest</MenuItem>
                <MenuItem value={"date_asc"}>Date: Oldest</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" className={pageStyles.smallSelectLabel}>
              <InputLabel id="show-label">Show</InputLabel>
              <Select
                labelId="show-label"
                value={perPage}
                label="Show"
                onChange={(e) => setPerPage(Number(e.target.value))}
                disabled
              >
                <MenuItem value={12}>12</MenuItem>
                <MenuItem value={24}>24</MenuItem>
                <MenuItem value={48}>48</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className={pageStyles.pageNav}>
            <Pagination
              count={Math.max(1, totalPages)}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
              showFirstButton={false}
              showLastButton={false}
            />
            <div className={pageStyles.pageCount}>Page {page} / {totalPages}</div>
          </div>
        </div>

        <div className={pageStyles.container}>
          <Paper className={pageStyles.sidebar} elevation={1}>
            <Box p={1}>
              <Typography variant="h6" className={pageStyles.filterHeading}>Sort & Filter</Typography>

              <div className={pageStyles.priceBlock}>
                <Typography variant="subtitle1" className={pageStyles.stockLabel}>Price Range</Typography>
                <Slider
                  value={priceRangeRand}
                  onChange={handlePriceSliderChange}
                  onChangeCommitted={handlePriceSliderCommit}
                  valueLabelDisplay="auto"
                  step={sliderStep}
                  min={0}
                  max={sliderMaxRand}
                  disableSwap
                  valueLabelFormat={(v) => Math.round(v)}
                />
                <div className={pageStyles.priceInputs}>
                  <TextField
                    label="Min"
                    type="number"
                    size="small"
                    value={priceRangeRand[0]}
                    onChange={handlePriceInput('min')}
                    InputProps={{ inputProps: { min: 0, max: priceRangeRand[1], step: 1 } }}
                  />
                  <TextField
                    label="Max"
                    type="number"
                    size="small"
                    value={priceRangeRand[1] || ''}
                    onChange={handlePriceInput('max')}
                    InputProps={{ inputProps: { min: priceRangeRand[0], max: sliderMaxRand, step: 1 } }}
                  />
                  <Button size="small" onClick={() => { setPriceMin(0); setPriceMax(maxCents); setPriceRangeRand([0, Math.ceil(maxCents / 100)]); }}>Reset</Button>
                </div>
              </div>

              <div className={pageStyles.stockBlock}>
                <Typography variant="subtitle1" className={pageStyles.stockLabel}>Manufacturer</Typography>
                {manufacturers.length === 0 ? (
                  <div className={pageStyles.checkboxLabel}>No manufacturers</div>
                ) : (
                  <>
                    <FormControl component="fieldset" variant="standard">
                      <FormGroup>
                        {manufacturers.map(m => (
                          <FormControlLabel
                            key={m}
                            control={<Checkbox checked={selectedManufacturers.includes(m)} onChange={() => toggleManufacturer(m)} size="small" />}
                            label={m}
                          />
                        ))}
                      </FormGroup>
                    </FormControl>
                    <Box mt={1}>
                      <Button size="small" onClick={() => setSelectedManufacturers([])}>Clear</Button>
                    </Box>
                  </>
                )}
              </div>

              <div className={pageStyles.stockBlock}>
                <Typography variant="subtitle1" className={pageStyles.stockLabel}>Stock</Typography>
                <FormControl component="fieldset" variant="standard">
                  <FormGroup>
                    <FormControlLabel control={<Checkbox checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} size="small" />} label="In stock" />
                    <FormControlLabel control={<Checkbox checked={filterReserved} onChange={(e) => setFilterReserved(e.target.checked)} size="small" />} label="Reserved" />
                    <FormControlLabel control={<Checkbox checked={filterOutOfStock} onChange={(e) => setFilterOutOfStock(e.target.checked)} size="small" />} label="Out of stock" />
                  </FormGroup>
                </FormControl>
              </div>
            </Box>
          </Paper>
          <section className={pageStyles.resultsSection}>
            {loading && <div>Loading…</div>}
            <div className={pageStyles.grid}>
              {sortedProducts.map(it => (
                <ProductCard
                  key={it.variant_id}
                  name={(it as any).name}
                  title={it.title}
                  vendor={(it as any).brand}
                  sku={it.sku}
                  stock={(it as any).stock || null}
                  thumbnail={it.thumbnail}
                  price={it.current_price || null}
                  slug={it.slug}
                  manufacturer={(it as any).manufacturer}
                  productType={(it as any).product_type || (it as any).productType}
                  cores={(it as any).cores}
                  boostClock={(it as any).boost_clock}
                  microarchitecture={(it as any).microarchitecture}
                  socket={(it as any).socket}
                />
              ))}
            </div>

            {/* pagination moved to the small nav row under the breadcrumb */}
          </section>
        </div>
      </main>
    </div>
  )
}
