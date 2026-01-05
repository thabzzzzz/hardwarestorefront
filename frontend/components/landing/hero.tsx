import styles from './hero.module.css'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import formatPriceFromCents from '../../lib/formatPrice'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

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
                <div style={{ marginTop: 8, fontWeight: 700 }}>{featured.title}</div>
                <div style={{ marginTop: 4, color: '#666' }}>{featured.current_price ? formatPriceFromCents(featured.current_price.amount_cents) : ''}</div>
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
