import styles from './hero.module.css'
import React, { useEffect, useState } from 'react'
import ProductCard from '../product/ProductCard'

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

export default function Hero(): JSX.Element {
  const [featured, setFeatured] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/products?featured=1&per_page=1`)
        const contentType = res.headers.get('content-type') || ''
        if (!res.ok || !contentType.includes('application/json')) {
          const text = await res.text()
          console.error('fetch featured failed (non-JSON)', res.status, text.slice(0,400))
          setFeatured(null)
          return
        }
        const json = await res.json()
        setFeatured((json.data && json.data[0]) || null)
      } catch (e) {
        console.error('fetch featured failed', e)
      }
    }
    load()
  }, [])

  return (
    <section className={styles.heroWrap}>
      <div className={styles.heroMain}>
        <div className={styles.heroText}>
          <h1>BUILD. PLAY. CREATE.</h1>
          <p>Quality PC hardware, built for performance and reliability.</p>
          <div className={styles.heroLogoWrap}>
            <img src="/images/logo/logo2.svg" alt="Logo" className={styles.heroLogoLarge} />
          </div>
        </div>
        <div className={styles.heroSidebar}>
          {featured ? (
            <div className={styles.featureCardWrap}>
              <ProductCard
                name={(featured as any).name}
                title={featured.title}
                vendor={(featured as any).brand}
                sku={featured.sku}
                stock={(featured as any).stock || null}
                thumbnail={featured.thumbnail || null}
                price={featured.current_price || null}
                slug={featured.slug}
                manufacturer={(featured as any).manufacturer}
                productType={(featured as any).product_type || (featured as any).productType}
                cores={(featured as any).cores}
                boostClock={(featured as any).boost_clock}
                microarchitecture={(featured as any).microarchitecture}
                socket={(featured as any).socket}
                footerSlot={<div className={styles.featureTag}>FEATURED DEAL</div>}
              />
            </div>
          ) : (
            <div className={styles.featureSkeleton}>
              <div className={styles.skelImg} />
              <div className={styles.skelLine} />
              <div className={styles.skelLineShort} />
              <div className={styles.skelPill}>FEATURED DEAL →</div>
            </div>
          )}
        </div>
      </div>
      
    </section>
  )
}
