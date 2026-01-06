import React, { useEffect, useMemo, useState } from 'react'
import Header from '../../components/header/header'
import React, { useEffect, useState } from 'react'
import Header from '../../components/header/header'
import ProductCard from '../../components/product/ProductCard'
import styles from '../../styles/home.module.css'
import pageStyles from './gpus.module.css'

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
      <main className={`${styles.main} ${pageStyles.main}`}>
        <nav className={pageStyles.breadcrumb}>Home / Hardware / Graphics Cards</nav>
        <h1 className={pageStyles.title}>Graphics Cards</h1>

        <div className={pageStyles.controlsRow}>
          <div className={pageStyles.controlsLeft}>
            <label className={pageStyles.smallSelectLabel}>Sort By
              <select disabled className={pageStyles.smallSelectLabel}>
                <option>Popularity</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
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
            <h3 className={pageStyles.sidebarHeading}>Sort & Filter</h3>
            <div className={pageStyles.sidebarBlock}>
              <div className={pageStyles.headingTitle}>Price</div>
              <div>Price filters coming soon</div>
            </div>
            <div className={pageStyles.sidebarBlock}>
              <div className={pageStyles.headingTitle}>Stock</div>
              <div>Stock filters coming soon</div>
            </div>
          </aside>
          <section className={pageStyles.resultsSection}>
            {loading && <div>Loading…</div>}
            <div className={pageStyles.grid}>
              {items.map(it => (
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
                    if (!any) return true
                    if (status === 'in_stock' && filterInStock) return true
                    if (status === 'reserved' && filterReserved) return true
                    if (status === 'out_of_stock' && filterOutOfStock) return true
                    return false
                  })
                  .map(it => (
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
