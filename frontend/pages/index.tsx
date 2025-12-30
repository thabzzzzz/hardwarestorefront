import React, { useEffect, useState } from 'react'
import Header from '../components/header/header'
import ProductCard from '../components/product/ProductCard'
import Hero from '../components/landing/hero'
import HotDeals from '../components/landing/hotDeals'
import Popular from '../components/landing/popular'
import NewArrivals from '../components/landing/newArrivals'
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
  const [cpus, setCpus] = useState<GpuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCpus, setLoadingCpus] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/gpus?per_page=12`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch gpus failed (non-JSON response)', res.status, text.slice(0,400))
          setItems([])
          return
        }

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

  useEffect(() => {
    async function loadCpus() {
      try {
        const res = await fetch(`${API_BASE}/api/cpus?per_page=6`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch cpus failed (non-JSON response)', res.status, text.slice(0,400))
          setCpus([])
          return
        }

        const json = await res.json()
        setCpus(json.data || [])
      } catch (e) {
        console.error('fetch cpus failed', e)
      } finally {
        setLoadingCpus(false)
      }
    }
    loadCpus()
  }, [])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Hero />
        <HotDeals />
        <Popular />
        <NewArrivals />

        <section style={{ padding: '24px 0' }}>
          <h2 style={{ margin: '0 0 12px 0' }}>GPUs</h2>
          {loading && <p>Loading…</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {items.map((it) => (
              <ProductCard key={it.variant_id} title={it.title} vendor={(it as any).brand} sku={it.sku} thumbnail={it.thumbnail} price={it.current_price || null} slug={it.slug} />
            ))}
          </div>
        </section>

        <section style={{ padding: '24px 0' }}>
          <h2 style={{ margin: '0 0 12px 0' }}>CPUs</h2>
          {loadingCpus && <p>Loading…</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
            {cpus.map((it) => (
              <ProductCard key={it.variant_id} title={it.title} vendor={(it as any).brand} sku={it.sku} thumbnail={it.thumbnail} price={it.current_price || null} slug={it.slug} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
