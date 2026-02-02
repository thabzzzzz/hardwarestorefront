import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Header from '../../components/header/header'
import ProductCard from '../../components/product/ProductCard'
import styles from '../../styles/home.module.css'
import pageStyles from './gpus.module.css'

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
import PaginationItem from '@mui/material/node/PaginationItem'
import Slider from '@mui/material/node/Slider'
import TextField from '@mui/material/node/TextField'

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
  const [globalMinCents, setGlobalMinCents] = useState<number | null>(null)
  const [globalMaxCents, setGlobalMaxCents] = useState<number | null>(null)
  const [hasAppliedPriceFilter, setHasAppliedPriceFilter] = useState(false)
  const [allFilteredItems, setAllFilteredItems] = useState<GpuItem[] | null>(null)
  const [rawAllItems, setRawAllItems] = useState<GpuItem[] | null>(null)

  // Ensure we cache the full catalog (safe since catalog ~500 items)
  useEffect(() => {
    if (rawAllItems !== null) return
    let cancelled = false
    async function fetchAll() {
      try {
        const url = `${API_BASE}/api/gpus?per_page=1000&page=1`
        const res = await fetch(url)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) return
        const json = await res.json()
        const all = json.data || []
        if (!cancelled) setRawAllItems(all)
      } catch (e) {
        console.error('fetchAll failed', e)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [rawAllItems])
  const userTouchedPrice = useRef(false)
  const effectiveMaxCents = globalMaxCents ?? Math.max(maxCents, priceMax || 0)
  const sliderMaxRand = Math.max(Math.ceil((effectiveMaxCents || 0) / 100), 1)
  const sliderStep = 1

  // resync max when items change — but do NOT shrink the slider max
  // once the user has interacted with it, and prefer server-provided
  // global bounds when available.
  useEffect(() => {
    const nextMaxCents = Math.max(0, Math.ceil(maxCents || 0))
    if (globalMaxCents !== null) return
    if (userTouchedPrice.current) return

    // never reduce the visible max; keep at least the previous value
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

  const manufacturers = useMemo(() => {
    const source = rawAllItems ?? (allFilteredItems && Array.isArray(allFilteredItems) ? allFilteredItems : items)
    const s = new Set<string>()
    for (const it of source) {
      const m = String(it.manufacturer || '').trim()
      if (m) s.add(m)
    }
    return Array.from(s).sort()
  }, [rawAllItems, allFilteredItems, items])
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([])

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
  // guard to avoid replace->read cycles and to handle environments
  // where history operations may be restricted (SecurityError)
  useEffect(() => {
    if (!router.isReady) return

    async function load() {
      console.debug('[DBG] load() page=', page, 'perPage=', perPage, 'sortBy=', sortBy, 'hasAppliedPriceFilter=', hasAppliedPriceFilter)
      setLoading(true)
      try {
        // If price filter is applied, prefer to fetch a large slice and
        // perform client-side filtering to guarantee pages are compacted
        // to only matching items (so totalPages will shrink accordingly).
        if (hasAppliedPriceFilter) {
          // reuse cached matched items if available
          if (allFilteredItems && Array.isArray(allFilteredItems)) {
            const matched = allFilteredItems
            const total = Math.max(1, Math.ceil((matched.length || 0) / perPage))
            setTotalPages(total)
            setItems(matched.slice((page - 1) * perPage, page * perPage))
            return
          }

          // fetch a large page to collect items to filter client-side
          let url = `${API_BASE}/api/gpus?per_page=10000&page=1`
          if (priceMin !== null) url += `&price_min=${priceMin}`
          if (priceMax !== null) url += `&price_max=${priceMax}`
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
          const all = json.data || []
          setRawAllItems(prev => prev ?? all)
          // client-side price filter as final safeguard
          const matched = all.filter(it => {
            const cents = Number(it.current_price?.amount_cents || 0)
            return cents >= (priceMin || 0) && cents <= (priceMax || Number.MAX_SAFE_INTEGER)
          })
          setAllFilteredItems(matched)
          const total = Math.max(1, Math.ceil((matched.length || 0) / perPage))
          setTotalPages(total)
          setItems(matched.slice((page - 1) * perPage, page * perPage))

          // seed slider bounds from server meta if provided
          if (json.meta && (json.meta.price_min !== undefined || json.meta.price_max !== undefined)) {
            if (globalMaxCents === null) {
              setGlobalMinCents(json.meta.price_min ?? 0)
              setGlobalMaxCents(json.meta.price_max ?? 0)
              const nextMax = json.meta.price_max ?? maxCents
              setPriceMax(Math.max(0, Math.ceil(nextMax || 0)))
              setPriceRangeRand([Math.max(0, Math.round(priceMin / 100)), Math.max(0, Math.ceil((nextMax || maxCents) / 100))])
            }
          }
          return
        }

        // default (no price filter): server-side pagination
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
        setAllFilteredItems(null)
        // store raw full page list when available (do not overwrite once cached)
        const all = json.data || []
        setRawAllItems(prev => prev ?? all)
        setItems(json.data || [])
        const total = json.last_page || Math.ceil((json.total || 0) / perPage)
        setTotalPages(total)

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
        console.error('fetch gpus failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, perPage, sortBy, router.isReady, hasAppliedPriceFilter, priceMin, priceMax, allFilteredItems])

  function handlePriceInput(kind: 'min' | 'max') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number(e.target.value)
      const safe = Number.isFinite(raw) ? Math.round(raw) : 0
      console.log('[DBG] handlePriceInput', { kind, raw, safe })
      userTouchedPrice.current = true
      setLastAction(`input:${kind}:${raw}`)
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
    console.log('[DBG] applyPriceFilter', { priceRangeRand, min, max })
    setLastAction(`apply:${min}-${max}`)
    setPriceMin(min * 100)
    setPriceMax(max * 100)
    setPage(1)
    setHasAppliedPriceFilter(true)
  }

  // Sort helper - keeps client-side sorting logic in one place
  function sortItems(arr: GpuItem[], sortKey: string) {
    const out = arr.slice()
    if (sortKey === 'price_asc') {
      out.sort((a, b) => (Number(a.current_price?.amount_cents || 0) - Number(b.current_price?.amount_cents || 0)))
    } else if (sortKey === 'price_desc') {
      out.sort((a, b) => (Number(b.current_price?.amount_cents || 0) - Number(a.current_price?.amount_cents || 0)))
    } else if (sortKey === 'date_asc' || sortKey === 'date_desc') {
      // if server returns date strings in `created_at` or similar, attempt to sort by that field
      const dir = sortKey === 'date_asc' ? 1 : -1
      out.sort((a, b) => {
        const da = new Date((a as any).created_at || 0).getTime()
        const db = new Date((b as any).created_at || 0).getTime()
        return (da - db) * dir
      })
    }
    return out
  }

  function handlePriceSliderChange(_e: Event, value: number | number[]) {
    userTouchedPrice.current = true
    const next: [number, number] = Array.isArray(value) ? [Number(value[0]), Number(value[1])] : [0, Number(value)]
    setPriceRangeRand(next)
    setLastAction(`slider:change:${next[0]}-${next[1]}`)
  }

  function handlePriceSliderCommit(_e: Event, value: number | number[]) {
    userTouchedPrice.current = true
    const next: [number, number] = Array.isArray(value) ? [Number(value[0]), Number(value[1])] : [0, Number(value)]
    setPriceRangeRand(next)
    setPriceMin(next[0] * 100)
    setPriceMax(next[1] * 100)
    setPage(1)
    setHasAppliedPriceFilter(true)
    setLastAction(`slider:commit:${next[0]}-${next[1]}`)
  }

  function toggleManufacturer(name: string) {
    setSelectedManufacturers(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name])
    setPage(1)
    setLastAction(`manufacturer:${name}`)
  }

  // Recompute the full filtered set (client-side) when any client-only filters change.
  // This ensures pagination and manufacturer lists reflect the full filtered dataset.
  useEffect(() => {
    // if there are no client-side filters active, clear the cached full set
    const hasMan = selectedManufacturers && selectedManufacturers.length > 0
    const hasStock = filterInStock || filterReserved || filterOutOfStock
    const needClientFilter = hasMan || hasStock || hasAppliedPriceFilter
    if (!needClientFilter) {
      setAllFilteredItems(null)
      return
    }

    let cancelled = false
    async function fetchAndFilter() {
      setLoading(true)
      try {
        let url = `${API_BASE}/api/gpus?per_page=10000&page=1`
        if (hasAppliedPriceFilter) {
          if (priceMin !== null) url += `&price_min=${priceMin}`
          if (priceMax !== null) url += `&price_max=${priceMax}`
        }
        if (sortBy.startsWith('date')) {
          const order = sortBy.endsWith('_asc') ? 'asc' : 'desc'
          url += `&sort=date&order=${order}`
        }

        const res = await fetch(url)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch gpus failed (non-JSON response)', res.status, text.slice(0, 400))
          if (!cancelled) {
            setAllFilteredItems([])
            setItems([])
            setTotalPages(1)
          }
          return
        }

        const json = await res.json()
        const all = json.data || []
        setRawAllItems(prev => prev ?? all)

        const matched = all.filter(it => {
          // price
          const cents = Number(it.current_price?.amount_cents || 0)
          if (hasAppliedPriceFilter) {
            if (cents < (priceMin || 0) || cents > (priceMax || Number.MAX_SAFE_INTEGER)) return false
          }
          // manufacturer
          if (hasMan) {
            const man = String(it.manufacturer || '').trim()
            if (!selectedManufacturers.includes(man)) return false
          }
          // stock
          if (hasStock) {
            const raw = String(it.stock?.status || '').toLowerCase()
            const status = raw === 'out_of_stock' ? 'out_of_stock' : (raw === 'reserved' ? 'reserved' : 'in_stock')
            if (status === 'in_stock' && !filterInStock) return false
            if (status === 'reserved' && !filterReserved) return false
            if (status === 'out_of_stock' && !filterOutOfStock) return false
          }
          return true
        })

        const sorted = sortItems(matched, sortBy)
        if (!cancelled) {
          setAllFilteredItems(sorted)
          const total = Math.max(1, Math.ceil((sorted.length || 0) / perPage))
          setTotalPages(total)
          setItems(sorted.slice((page - 1) * perPage, page * perPage))
        }
      } catch (e) {
        console.error('fetch/filter failed', e)
        if (!cancelled) {
          setAllFilteredItems([])
          setItems([])
          setTotalPages(1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchAndFilter()
    return () => { cancelled = true }
  }, [selectedManufacturers, filterInStock, filterReserved, filterOutOfStock, hasAppliedPriceFilter, priceMin, priceMax, sortBy, perPage, page])

  const filtered = useMemo(() => {
    return items.filter(it => {
      // manufacturer filter
      if (selectedManufacturers.length > 0) {
        const man = String(it.manufacturer || '').trim()
        if (!selectedManufacturers.includes(man)) return false
      }
      // price filtering: if the user has applied the price filter we rely
      // on the server to return the correctly filtered result set so we
      // should not re-filter the current page (which would shrink pages).
      if (!hasAppliedPriceFilter) {
        const cents = Number(it.current_price?.amount_cents || 0)
        if (cents < priceMin || cents > priceMax) return false
      }

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
    if (!router.isReady) return

    async function load() {
      console.debug('[DBG] load() page=', page, 'perPage=', perPage, 'sortBy=', sortBy)
      setLoading(true)
      try {
        let url = `${API_BASE}/api/gpus?per_page=${perPage}&page=${page}`
        // include price filters only after the user explicitly applies them
        if (hasAppliedPriceFilter) {
          if (priceMin !== null) url += `&price_min=${priceMin}`
          if (priceMax !== null) url += `&price_max=${priceMax}`
        }
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
        console.error('fetch gpus failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, perPage, sortBy, router.isReady, hasAppliedPriceFilter, priceMin, priceMax])

  // Reset to first page when sort changes
  useEffect(() => {
    setPage(1)
  }, [sortBy])

  // Note: page resets for explicit user price interactions are handled
  // inside the slider commit / input handlers to avoid programmatic resets

  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.main} ${pageStyles.main}`}>
        <nav className={pageStyles.breadcrumb}>Home / Hardware / Graphics Cards</nav>
        <h1 className={pageStyles.title}>Graphics Cards</h1>

        {mounted && (
          <div style={{ padding: '6px 12px', background: '#fff4', borderRadius: 4, marginBottom: 8 }}>
            <strong>DEBUG:</strong>&nbsp;page={page} | url_page={String(router.query.page || '')} | lastAction={lastAction}
          </div>
        )}

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
              onChange={(e, value) => { if (e && typeof (e as any).preventDefault === 'function') (e as any).preventDefault(); console.debug('[DBG] Pagination click ->', value); setLastAction(`pagination:${value}`); setPage(value) }}
              size="small"
              showFirstButton={false}
              showLastButton={false}
              renderItem={(item) => <PaginationItem {...item} component="button" />}
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

                <div style={{ marginTop: 8 }}>
                  <Button size="small" onClick={applyPriceFilter} style={{ marginRight: 8 }}>Apply</Button>
                  <Button size="small" onClick={() => { userTouchedPrice.current = false; setPriceMin(0); setPriceMax(effectiveMaxCents); setPriceRangeRand([0, Math.ceil((effectiveMaxCents || 0) / 100)]); setPage(1); setHasAppliedPriceFilter(false); }}>Reset</Button>
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
            <div className={pageStyles.grid}>
              {loading
                ? Array.from({ length: 12 }, (_, i) => (
                    <div className={pageStyles.skelCard} key={`gpu-skel-${i}`}>
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
