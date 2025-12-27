import styles from './hotDeals.module.css'
import React, { useEffect, useState } from 'react'
import ProductCard from '../product/ProductCard'

type HotDealItem = {
  variant_id: string
  title: string
  sku?: string
  thumbnail?: string | null
  current_price?: { amount_cents: number; currency: string } | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function HotDeals(): JSX.Element {
  const [items, setItems] = useState<HotDealItem[]>([])

  useEffect(()=>{
    async function load(){
      try{
        const res = await fetch(`${API_BASE}/api/hot-deals`)
        const json = await res.json()
        setItems(json.data || [])
      }catch(e){
        console.error('fetch hot-deals failed', e)
      }
    }
    load()
  }, [])

  return (
    <section className={styles.hotDeals}>
      <h2>Hot Deals</h2>
      <div className={styles.grid}>
        {items.map(it => (
          <div key={it.variant_id} className={styles.card}>
            <ProductCard title={it.title} sku={it.sku} thumbnail={it.thumbnail} price={it.current_price || null} />
          </div>
        ))}
      </div>
    </section>
  )
}
