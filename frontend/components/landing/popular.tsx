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
  manufacturer?: string | null
  product_type?: string | null
  cores?: number | string | null
  boost_clock?: string | null
  microarchitecture?: string | null
  socket?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function Popular(): JSX.Element {
  const [items, setItems] = useState<Item[]>([])

  useEffect(()=>{
    async function load(){
      try{
        const res = await fetch(`${API_BASE}/api/products?popular=1&per_page=6`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch popular failed (non-JSON)', res.status, text.slice(0,400))
          setItems([])
          return
        }
        const json = await res.json()
        setItems(json.data || [])
      }catch(e){
        console.error('fetch popular failed', e)
      }
    }
    load()
  }, [])

  return (
    <section className={styles.hotDeals}>
      <h2>Popular</h2>
      <div className={styles.grid}>
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
    </section>
  )
}
