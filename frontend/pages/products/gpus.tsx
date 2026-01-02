import React, { useEffect, useState } from 'react'
import Header from '../../components/header/header'
import ProductCard from '../../components/product/ProductCard'
import styles from '../../styles/home.module.css'

type GpuItem = {
  variant_id: string
  title: string
  sku?: string
  current_price?: { amount_cents: number; currency: string } | null
  thumbnail?: string | null
  stock?: { qty_available: number; status: string } | null
  manufacturer?: string | null
  product_type?: string | null
  cores?: number | string | null
  boost_clock?: string | null
  microarchitecture?: string | null
  socket?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function GpuListing(): JSX.Element {
  const [items, setItems] = useState<GpuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/gpus?per_page=${perPage}&page=${page}`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch gpus failed (non-JSON response)', res.status, text.slice(0, 400))
          setItems([])
          setTotalPages(1)
          return
        }

        const json = await res.json()
        // server already filters by category; use returned data as-is
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
  }, [page, perPage])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main} style={{ padding: '24px' }}>
        <nav style={{ fontSize: 13, marginBottom: 12 }}>Home / Hardware / Graphics Cards</nav>
        <h1 style={{ marginTop: 0 }}>Graphics Cards</h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>Sort By
              <select disabled style={{ padding: '6px 8px', fontSize: 13 }}>
                <option>Popularity</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </label>

            <label style={{ fontSize: 13, display: 'flex', gap: 8, alignItems: 'center' }}>Show
              <select disabled value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ padding: '6px 8px', fontSize: 13 }}>
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
            <div style={{ fontSize: 13 }}>Page {page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <aside style={{ width: 280, minHeight: 400, border: '1px solid #eee', padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Sort & Filter</h3>
            <div style={{ opacity: 0.6 }}>Placeholder controls (disabled)</div>
          </aside>
          <section style={{ flex: 1 }}>
            {loading && <div>Loading…</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {items.map(it => (
                <ProductCard
                  key={it.variant_id}
                  name={(it as any).name}
                  title={it.title}
                  vendor={(it as any).brand}
                  sku={it.sku}
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
