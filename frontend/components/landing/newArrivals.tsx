import styles from './hotDeals.module.css'
import React, { useEffect, useState } from 'react'
import ProductCard from '../product/ProductCard'

type Item = {
  variant_id: string
  title: string
  sku?: string
  thumbnail?: string | null
  current_price?: { amount_cents: number; currency: string } | null
  slug?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function NewArrivals(): JSX.Element {
  const [items, setItems] = useState<Item[]>([])

  useEffect(()=>{
    async function load(){
      try{
        const res = await fetch(`${API_BASE}/api/products?new=1&per_page=6`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch new-arrivals failed (non-JSON)', res.status, text.slice(0,400))
          setItems([])
          return
        }
        const json = await res.json()
        setItems(json.data || [])
      }catch(e){
        console.error('fetch new-arrivals failed', e)
      }
    }
    load()
  }, [])

  return (
    <section className={styles.hotDeals}>
      <h2>New Arrivals</h2>
      <div className={styles.grid}>
        {items.map(it => (
          <ProductCard key={it.variant_id} title={it.title} vendor={(it as any).brand} sku={it.sku} thumbnail={it.thumbnail} price={it.current_price || null} slug={it.slug} />
        ))}
      </div>
    </section>
  )
}
