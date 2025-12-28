import React, { useEffect, useState } from 'react'
import Header from '../components/header/header'
import ProductCard from '../components/product/ProductCard'
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
  slug?: string
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
              <ProductCard key={it.variant_id} title={it.title} sku={it.sku} thumbnail={it.thumbnail} price={it.current_price || null} slug={it.slug} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
