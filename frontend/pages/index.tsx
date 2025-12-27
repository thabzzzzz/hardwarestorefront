import React, { useEffect, useState } from 'react'
import Header from '../components/header/header'
import Hero from '../components/landing/hero'
import HotDeals from '../components/landing/hotDeals'
import styles from '../styles/home.module.css'

type GpuItem = {
  variant_id: string
  name: string
  title: string
  sku: string
  current_price: { amount_cents: number; currency: string } | null
  thumbnail: string | null
  stock: { qty_available: number; status: string } | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function Home(): JSX.Element {
  const [items, setItems] = useState<GpuItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/gpus?per_page=12`)
        const json = await res.json()
        setItems(json.data || [])
      } catch (e) {
        console.error('fetch gpus failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Hero />
        <HotDeals />

        <section style={{ padding: '24px 0' }}>
          <h2 style={{ margin: '0 0 12px 0' }}>GPUs</h2>
          {loading && <p>Loading…</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {items.map((it) => (
              <div key={it.variant_id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
                <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  {it.thumbnail ? (
                    <img src={it.thumbnail} alt={it.title} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                  ) : (
                    <div style={{ color: '#999' }}>No image</div>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{it.title}</div>
                <div style={{ color: '#666', fontSize: 13 }}>{it.sku}</div>
                <div style={{ marginTop: 8 }}>
                  {it.current_price ? (
                    <div style={{ color: '#ff8c00', fontWeight: 700 }}>{(it.current_price.amount_cents / 100).toLocaleString()} {it.current_price.currency}</div>
                  ) : (
                    <div style={{ color: '#999' }}>Price not available</div>
                  )}
                  {it.stock && <div style={{ fontSize: 12, color: it.stock.qty_available > 0 ? '#007a3d' : '#d9534f' }}>{it.stock.status} ({it.stock.qty_available})</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
