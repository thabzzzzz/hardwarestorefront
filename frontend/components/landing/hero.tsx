import styles from './hero.module.css'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import formatPriceFromCents from '../../lib/formatPrice'
import getDisplayTitle from '../../lib/getDisplayTitle'

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
        </div>
        <div className={styles.heroSidebar}>
          {featured && featured.slug ? (
            <Link href={`/product/${featured.slug}`} className={styles.featureLink}>
              <div className={styles.featureLinkInner}>
                {featured.thumbnail ? (
                  <img src={featured.thumbnail} alt={featured.title || 'featured'} />
                ) : (
                  <img src="/products/prod-0001/1ed6bb69-400w.webp" alt="featured" />
                )}
                <div className={styles.featureTitle}>{getDisplayTitle({ title: featured.title, name: (featured as any).name, manufacturer: (featured as any).manufacturer, productType: (featured as any).product_type || (featured as any).productType })}</div>
                <div className={styles.featurePrice}>{featured.current_price ? formatPriceFromCents(featured.current_price.amount_cents) : ''}</div>
                <div className={styles.featureTag}>FEATURED DEAL →</div>
              </div>
            </Link>
          ) : (
            <>
              {featured && featured.thumbnail ? (
                <img src={featured.thumbnail} alt={featured.title || 'featured'} />
              ) : (
                <img src="/products/prod-0001/1ed6bb69-400w.webp" alt="featured" />
              )}
              <div className={styles.featureTag}>FEATURED DEAL →</div>
            </>
          )}
        </div>
      </div>
      
    </section>
  )
}
