import React from 'react'
import Header from '../components/header/header'
import ProductCard from '../components/product/ProductCard'
import styles from '../styles/home.module.css'

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
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main} style={{ padding: 24 }}>
        <nav style={{ fontSize: 13, marginBottom: 12 }}>Home / Search</nav>
        <h1 style={{ marginTop: 0 }}>Search results for "{q}"</h1>
        <div style={{ display: 'flex', gap: 24 }}>
          <aside style={{ width: 280, minHeight: 400, border: '1px solid #eee', padding: 12 }}>
            <h3 style={{ marginTop: 0 }}>Sort & Filter</h3>
            <div style={{ opacity: 0.6 }}>Filters disabled for search</div>
          </aside>
          <section style={{ flex: 1 }}>
            {results.length === 0 ? (
              <div>No products found.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                {results.map(it => (
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
