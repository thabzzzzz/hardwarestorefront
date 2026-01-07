import React, { useEffect, useMemo, useState } from 'react'
import Header from '../../components/header/header'
import ProductCard from '../../components/product/ProductCard'
import styles from '../../styles/home.module.css'
import pageStyles from './processors.module.css'

import formatPriceFromCents from '../../lib/formatPrice'

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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

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

  // resync max when items change
  useEffect(() => { setPriceMax(maxCents) }, [maxCents])

  const [filterInStock, setFilterInStock] = useState(false)
  const [filterReserved, setFilterReserved] = useState(false)
  const [filterOutOfStock, setFilterOutOfStock] = useState(false)
  const [sortBy, setSortBy] = useState<string>('')

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
        let url = `${API_BASE}/api/cpus?per_page=${perPage}&page=${page}`
        // only send price filters when we have a meaningful max (> 0)
        if (priceMin !== undefined && priceMax !== undefined && priceMax > 0) {
          url += `&price_min=${priceMin}&price_max=${priceMax}`
        }
        if (sortBy.startsWith('date')) {
          const order = sortBy.endsWith('_asc') ? 'asc' : 'desc'
          url += `&sort=date&order=${order}`
        }
        const res = await fetch(url)

        // guard against non-JSON responses (404 HTML, etc.) which cause JSON.parse errors
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch cpus failed (non-JSON response)', res.status, text.slice(0, 400))
          // do not fall back to local JSON; that produces invented products.
          // Show empty list and surface the error in console for debugging.
          setItems([])
          setTotalPages(1)
          return
        }

        const json = await res.json()
        setItems(json.data || [])
        const total = json.last_page || Math.ceil((json.total || 0) / perPage)
        setTotalPages(total)
      } catch (e) {
        console.error('fetch cpus failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page, perPage, sortBy, priceMin, priceMax])

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
        <nav className={pageStyles.breadcrumb}>Home / Hardware / CPUs</nav>
        <h1 className={pageStyles.title}>CPUs</h1>

        <div className={pageStyles.controlsRow}>
          <div className={pageStyles.controlsLeft}>
            <label className={pageStyles.smallSelectLabel}>Sort By
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={pageStyles.smallSelectLabel}>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="date_desc">Date: Newest</option>
                <option value="date_asc">Date: Oldest</option>
              </select>
            </label>

            <label className={pageStyles.smallSelectLabel}>Show
              <select disabled value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className={pageStyles.smallSelectLabel}>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>

          <div className={pageStyles.pageNav}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
            <div className={pageStyles.pageCount}>Page {page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </div>

        <div className={pageStyles.container}>
          <aside className={pageStyles.sidebar}>
            <h3 className={pageStyles.filterHeading}>Sort & Filter</h3>
            <div className={pageStyles.maxPrice}>Price sliders temporarily disabled</div>
            <div className={pageStyles.maxPrice}>Max price: {formatPriceFromCents(maxCents)}</div>
            <div className={pageStyles.stockBlock}>
              <div className={pageStyles.stockLabel}>Manufacturer</div>
              {manufacturers.length === 0 ? (
                <div className={pageStyles.checkboxLabel}>No manufacturers</div>
              ) : (
                <>
                  {manufacturers.map(m => (
                    <label key={m} className={pageStyles.checkboxLabel}>
                      <input type="checkbox" checked={selectedManufacturers.includes(m)} onChange={() => toggleManufacturer(m)} /> {m}
                    </label>
                  ))}
                  <button type="button" onClick={() => setSelectedManufacturers([])} className={pageStyles.clearButton}>Clear</button>
                </>
              )}
            </div>
            <div className={pageStyles.stockBlock}>
              <div className={pageStyles.stockLabel}>Stock</div>
              <label className={pageStyles.checkboxLabel}>
                <input type="checkbox" checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} /> In stock
              </label>
              <label className={pageStyles.checkboxLabel}>
                <input type="checkbox" checked={filterReserved} onChange={(e) => setFilterReserved(e.target.checked)} /> Reserved
              </label>
              <label className={pageStyles.checkboxLabel}>
                <input type="checkbox" checked={filterOutOfStock} onChange={(e) => setFilterOutOfStock(e.target.checked)} /> Out of stock
              </label>
            </div>
          </aside>
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
  
