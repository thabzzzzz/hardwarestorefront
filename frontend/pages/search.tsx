import React, { useMemo, useState } from 'react'
import Header from '../components/header/header'
import ProductCard from '../components/product/ProductCard'
import styles from '../styles/home.module.css'
import pageStyles from './search.module.css'

import formatPriceFromCents from '../lib/formatPrice'
import { useRouter } from 'next/router'

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

function matches(item: any, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const title = String(item.title || '').toLowerCase()
  const name = String(item.name || '').toLowerCase()
  const sku = String(item.sku || '').toLowerCase()
  const manufacturer = String(item.manufacturer || '').toLowerCase()
  return title.includes(needle) || name.includes(needle) || sku.includes(needle) || manufacturer.includes(needle)
}

export default function SearchPage({ results, q, sort }: { results: any[]; q: string; sort?: string }) {
  const [priceMin, setPriceMin] = useState<number>(0)
  const maxCents = useMemo(() => {
    let m = 0
    for (const it of results) {
      const c = Number(it.current_price?.amount_cents || 0)
      if (c > m) m = c
    }
    return m
  }, [results])
  const [priceMax, setPriceMax] = useState<number>(maxCents)

  // re-sync max when results change
  React.useEffect(() => { setPriceMax(maxCents) }, [maxCents])

  const [filterInStock, setFilterInStock] = useState(false)
  const [filterReserved, setFilterReserved] = useState(false)
  const [filterOutOfStock, setFilterOutOfStock] = useState(false)
  const router = useRouter()
  const [sortBy, setSortBy] = useState<string>(sort || '')

  const manufacturers = useMemo(() => {
    const s = new Set<string>()
    for (const it of results) {
      const m = String(it.manufacturer || '').trim()
      if (m) s.add(m)
    }
    return Array.from(s).sort()
  }, [results])
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([])

  function toggleManufacturer(m: string) {
    setSelectedManufacturers(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  function onSortChange(v: string) {
    setSortBy(v)
    const query: any = { q }
    if (v) query.sort = v
    else delete query.sort
    router.push({ pathname: '/search', query })
  }

  const filtered = results.filter(it => {
    // manufacturer filter
    if (selectedManufacturers.length > 0) {
      const man = String(it.manufacturer || '').trim()
      if (!selectedManufacturers.includes(man)) return false
    }
    const cents = Number(it.current_price?.amount_cents || 0)
    if (cents < priceMin || cents > priceMax) return false

    // stock status normalization
    const raw = String(it.stock?.status || '').toLowerCase()
    const status = raw === 'out_of_stock' ? 'out_of_stock' : (raw === 'reserved' ? 'reserved' : 'in_stock')

    const anyStockFilter = filterInStock || filterReserved || filterOutOfStock
    if (!anyStockFilter) return true

    if (status === 'in_stock' && filterInStock) return true
    if (status === 'reserved' && filterReserved) return true
    if (status === 'out_of_stock' && filterOutOfStock) return true
    return false
  })

  return (
    <div className={styles.page}>
      <Header />
      <main className={`${styles.main} ${pageStyles.main}`}>
        <nav className={pageStyles.breadcrumb}>Home / Search</nav>
        <h1 className={pageStyles.title}>Search results for "{q}"</h1>
        <div className={pageStyles.container}>
          <aside className={pageStyles.sidebar}>
            <h3 className={pageStyles.filterHeading}>Sort & Filter</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, marginRight: 8 }}>Sort By</label>
              <select value={sortBy} onChange={(e) => onSortChange(e.target.value)} className={pageStyles.smallSelectLabel}>
                <option value="">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="date_desc">Date: Newest</option>
                <option value="date_asc">Date: Oldest</option>
              </select>
            </div>
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
            {filtered.length === 0 ? (
              <div>No products found.</div>
            ) : (
              <div className={pageStyles.grid}>
                {filtered.map(it => (
                  <ProductCard
                    key={it.variant_id || it.id || it.slug}
                    name={it.name}
                    title={it.title}
                    vendor={it.brand}
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
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps(context: any) {
  const q = String(context.query.q || '')
  const sortParam = String(context.query.sort || '')
  try {
    let url = `${API_BASE}/api/products?per_page=1000`
    if (sortParam.startsWith('date')) {
      const order = sortParam.endsWith('_asc') ? 'asc' : 'desc'
      url += `&sort=date&order=${order}`
    }
    const res = await fetch(url)
    if (!res.ok) return { props: { results: [], q } }
    const js = await res.json()
    const list = js.data || []
    const results = list.filter((it: any) => matches(it, q))
    return { props: { results, q, sort: sortParam } }
  } catch (e) {
    console.error('search server fetch failed', e)
    return { props: { results: [], q } }
  }
}
