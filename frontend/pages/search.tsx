import React, { useMemo, useState } from 'react'
import Header from '../components/header/header'
import ProductCard from '../components/product/ProductCard'
import styles from '../styles/home.module.css'
import pageStyles from './search.module.css'
import PriceRange from '../components/filters/PriceRange'
import formatPriceFromCents from '../lib/formatPrice'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

function matches(item: any, q: string) {
  const needle = q.trim().toLowerCase()
  if (!needle) return true
  const title = String(item.title || '').toLowerCase()
  const name = String(item.name || '').toLowerCase()
  const sku = String(item.sku || '').toLowerCase()
  const manufacturer = String(item.manufacturer || '').toLowerCase()
  return title.includes(needle) || name.includes(needle) || sku.includes(needle) || manufacturer.includes(needle)
}

export default function SearchPage({ results, q }: { results: any[]; q: string }) {
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

  const filtered = results.filter(it => {
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
            <PriceRange maxCents={maxCents} valueMin={priceMin} valueMax={priceMax} onChange={(min, max) => { setPriceMin(min); setPriceMax(max) }} />
            <div className={pageStyles.maxPrice}>Max price: {formatPriceFromCents(maxCents)}</div>
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
  try {
    const res = await fetch(`${API_BASE}/api/products?per_page=1000`)
    if (!res.ok) return { props: { results: [], q } }
    const js = await res.json()
    const list = js.data || []
    const results = list.filter((it: any) => matches(it, q))
    return { props: { results, q } }
  } catch (e) {
    console.error('search server fetch failed', e)
    return { props: { results: [], q } }
  }
}
