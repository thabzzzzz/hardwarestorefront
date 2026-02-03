import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/header/header'
import ProductCard from '../../components/product/ProductCard'
import styles from '../../styles/home.module.css'
import pageStyles from './processors.module.css'

import formatPriceFromCents from '../../lib/formatPrice'
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
import Slider from '@mui/material/node/Slider'
import TextField from '@mui/material/node/TextField'

type ProcessorItem = {
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

export default function ProcessorListing(): JSX.Element {
  const [items, setItems] = useState<ProcessorItem[]>([])
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

  // -- Router & Page Sync --
  const router = useRouter()
  const [lastAction, setLastAction] = useState<string>('')
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
      setLastAction(`url:page:${n}`)
    }
  }, [router.isReady, router.query.page])

  // Ensure we cache the full catalog (safe since catalog size is modest)
  // Logic moved to fetchAndFilter in line with GPU page pattern
  
  const effectiveMaxCents = globalMaxCents ?? Math.max(maxCents, priceMax || 0)
  const sliderMaxRand = Math.max(Math.ceil((effectiveMaxCents || 0) / 100), 1)
  const sliderStep = 1

  // resync max when items change — but do NOT shrink the slider max once the
  // user has interacted with it, and prefer server-provided global bounds
  // when available.
  useEffect(() => {
    const nextMaxCents = Math.max(0, Math.ceil(maxCents || 0))
    if (globalMaxCents !== null) return
    if (userTouchedPrice.current) return

    setPriceMax(prev => Math.max(prev || 0, nextMaxCents))
    setPriceRangeRand(prev => {
      const minRand = Math.max(0, Math.round(priceMin / 100))
      const newMaxRand = Math.max(1, Math.ceil(nextMaxCents / 100))
      return [minRand, Math.max(prev?.[1] || 0, newMaxRand)]
    })
  }, [maxCents, globalMaxCents, priceMin])

  const [filterInStock, setFilterInStock] = useState(false)
  const [filterReserved, setFilterReserved] = useState(false)
  const [filterOutOfStock, setFilterOutOfStock] = useState(false)
  const [sortBy, setSortBy] = useState<string>('price_asc')

  const manufacturers = useMemo(() => ['AMD', 'INTEL'], [])
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([])
  const normalizeKey = (s: string | null | undefined) => String(s || '').trim().toLowerCase()
  const selectedIncludes = (name: string) => selectedManufacturers.some(sm => normalizeKey(sm) === normalizeKey(name))
  const canonicalManufacturer = (it: ProcessorItem) => {
    const m = String(it.manufacturer || '').trim().toLowerCase()
    const name = String(it.title || (it as any).name || '').toLowerCase()
    if (m.includes('intel') || name.includes('intel') || name.includes('core i')) return 'INTEL'
    if (m.includes('amd') || name.includes('amd') || name.includes('ryzen') || name.includes('threadripper')) return 'AMD'
    return String(it.manufacturer || '').trim().toUpperCase()
  }

  function toggleManufacturer(name: string) {
    setSelectedManufacturers(prev => {
      const exists = prev.some(p => normalizeKey(p) === normalizeKey(name))
      if (exists) return prev.filter(x => normalizeKey(x) !== normalizeKey(name))
      return [...prev, name]
    })
    setPage(1)
    setLastAction(`manufacturer:${name}`)
  }

  function handlePriceSliderChange(_event: Event, value: number | number[]) {
    userTouchedPrice.current = true
    const next: [number, number] = Array.isArray(value) ? [Number(value[0]), Number(value[1])] : [0, Number(value)]
    setPriceRangeRand(next)
  }

  function handlePriceSliderCommit(_event: Event, value: number | number[]) {
    userTouchedPrice.current = true
    const next: [number, number] = Array.isArray(value) ? [Number(value[0]), Number(value[1])] : [0, Number(value)]
    setPriceRangeRand(next)
    setPriceMin(next[0] * 100)
    setPriceMax(next[1] * 100)
    setPage(1)
    setHasAppliedPriceFilter(true)
  }

  function handlePriceInput(kind: 'min' | 'max') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value)
      const safe = Number.isFinite(raw) ? Math.round(raw) : 0
      userTouchedPrice.current = true
      if (kind === 'min') {
        const bounded = Math.max(0, Math.min(safe, Math.round((priceMax ?? sliderMaxRand * 100) / 100)))
        setPriceMin(bounded * 100)
      } else {
        const bounded = Math.max(Math.round(priceMin / 100), Math.min(safe, sliderMaxRand))
        setPriceMax(bounded * 100)
      }
    }
  }

  function applyPriceFilter() {
    const [min, max] = priceRangeRand
    setLastAction(`apply:${min}-${max}`)
    setPriceMin(min * 100)
    setPriceMax(max * 100)
    setPage(1)
    setHasAppliedPriceFilter(true)
  }

  // Sort helper - keeps client-side sorting logic in one place
  function sortItems(arr: ProcessorItem[], sortKey: string) {
    const out = arr.slice()
    if (sortKey === 'price_asc') {
      out.sort((a, b) => (Number(a.current_price?.amount_cents || 0) - Number(b.current_price?.amount_cents || 0)))
    } else if (sortKey === 'price_desc') {
      out.sort((a, b) => (Number(b.current_price?.amount_cents || 0) - Number(a.current_price?.amount_cents || 0)))
    } else if (sortKey === 'date_asc' || sortKey === 'date_desc') {
      const dir = sortKey === 'date_asc' ? 1 : -1
      out.sort((a, b) => {
        const da = new Date((a as any).created_at || 0).getTime()
        const db = new Date((b as any).created_at || 0).getTime()
        return (da - db) * dir
      })
    }
    return out
  }



  // Server handles all filtering and sorting now
  const filtered = items
  const sortedProducts = items

  useEffect(() => {
    if (!router.isReady) return

    async function load() {
      setLoading(true)
      try {
        let url = `${API_BASE}/api/cpus?per_page=${perPage}&page=${page}`
        
        // Pass server-side filters
        if (hasAppliedPriceFilter) {
          if (priceMin !== null) url += `&price_min=${priceMin}`
          if (priceMax !== null) url += `&price_max=${priceMax}`
        }
        
        // Manufacturers
        if (selectedManufacturers.length > 0) {
          const mParams = selectedManufacturers.map(m => `manufacturer[]=${encodeURIComponent(m)}`).join('&')
          url += `&${mParams}`
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

        // Sorting
        if (sortBy.startsWith('date')) {
          const order = sortBy.endsWith('_asc') ? 'asc' : 'desc'
          url += `&sort=date&order=${order}`
        } else if (sortBy.startsWith('price')) {
          const order = sortBy.endsWith('_asc') ? 'asc' : 'desc'
          url += `&sort=price&order=${order}`
        }
        
        const res = await fetch(url)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          setItems([])
          setTotalPages(1)
          return
        }

        const json = await res.json()
        setItems(json.data || [])
        // IMPORTANT: Server now handles filtering so totalPages is correct for the filtered set
        const total = json.last_page || Math.ceil((json.total || 0) / perPage)
        setTotalPages(total)

        // use server-provided global price metadata to seed the slider bounds
        if (json.meta && (json.meta.price_min !== undefined || json.meta.price_max !== undefined)) {
          if (globalMaxCents === null) {
            setGlobalMinCents(json.meta.price_min ?? 0)
            setGlobalMaxCents(json.meta.price_max ?? 0)
            const nextMax = json.meta.price_max ?? maxCents
            setPriceMax(Math.max(0, Math.ceil(nextMax || 0)))
            setPriceRangeRand([Math.max(0, Math.round(priceMin / 100)), Math.max(0, Math.ceil((nextMax || maxCents) / 100))])
          }
        }
      } catch (e) {
        console.error('fetch cpus failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, perPage, sortBy, router.isReady, hasAppliedPriceFilter, priceMin, priceMax, selectedManufacturers, filterInStock, filterReserved, filterOutOfStock, globalMaxCents, maxCents])

  useEffect(() => {
    setPage(1)
  }, [sortBy])



  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.main} ${pageStyles.main}`}>
        <nav className={pageStyles.breadcrumb}>Home / Hardware / CPUs</nav>
        <h1 className={pageStyles.title}>CPUs</h1>

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
                </div>
                <div className={pageStyles.priceActions}>
                  <Button size="small" onClick={applyPriceFilter}>Apply</Button>
                  <Button
                    size="small"
                    onClick={() => {
                      userTouchedPrice.current = false
                      setPriceMin(0)
                      setPriceMax(effectiveMaxCents)
                      setPriceRangeRand([0, Math.ceil((effectiveMaxCents || 0) / 100)])
                      setPage(1)
                      setHasAppliedPriceFilter(false)
                    }}
                  >
                    Reset
                  </Button>
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
                            control={<Checkbox checked={selectedIncludes(m)} onChange={() => toggleManufacturer(m)} size="small" />}
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
            <div className={pageStyles.grid}>
              {loading
                ? Array.from({ length: 12 }, (_, i) => (
                    <div className={pageStyles.skelCard} key={`cpu-skel-${i}`}>
                      <div className={`${pageStyles.skel} ${pageStyles.skelImage}`} />
                      <div className={`${pageStyles.skel} ${pageStyles.skelTitle}`} />
                      <div className={`${pageStyles.skel} ${pageStyles.skelPrice}`} />
                    </div>
                  ))
                : sortedProducts.map(it => (
                    <ProductCard
                      key={it.variant_id}
                      name={(it as any).name}
                      title={it.title}
                      vendor={(it as any).brand}
                      sku={it.sku}
                      stock={(it as any).stock || null}
                      thumbnail={it.thumbnail}
                      price={it.current_price || null}
                      slug={(it as any).slug}
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
  
