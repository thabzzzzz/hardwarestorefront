import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Header from '../../components/header/header'
import ProductGallery from '../../components/product/ProductGallery'
import ProductSummary from '../../components/product/ProductSummary'
import ProductSpecs from '../../components/product/ProductSpecs'
import ProductActions from '../../components/product/ProductActions'
import styles from '../../styles/home.module.css'
import pageStyles from './[slug].module.css'

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

type ProductPayload = {
  slug: string
  title: string
  brand?: string
  product_id?: string
  thumbnail?: string | null
  stock?: { qty_available?: number; qty_reserved?: number; status?: string }
  price?: { amount_cents: number; currency: string } | null
    specs?: Record<string, string>
    spec_tables?: any
    spec_fields?: Record<string, any>
}

// Server-side fetch so product pages render specs from the DB on first load.
export async function getServerSideProps(context: any) {
  const slug = context.params?.slug
  if (!slug) return { props: { initialProduct: null } }

  const API_BASE = process.env.SERVER_API_BASE_URL || 'http://web'
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(String(slug))}`)
    if (!res.ok) return { props: { initialProduct: null } }
    const json = await res.json()
    // normalize thumbnail as in client
    if (json.thumbnail && typeof json.thumbnail === 'string') {
      if (!json.thumbnail.startsWith('http') && !json.thumbnail.startsWith('/')) {
        json.thumbnail = `${API_BASE}${json.thumbnail}`
      }
    }
    return { props: { initialProduct: json } }
  } catch (e) {
    return { props: { initialProduct: null } }
  }
}

type PageProps = {
  initialProduct?: ProductPayload | null
}

export default function ProductPage({ initialProduct }: PageProps): JSX.Element {
  const router = useRouter()
  const { slug } = router.query
  const [product, setProduct] = useState<ProductPayload | null>(initialProduct || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!router.isReady) return
    if (!slug) return
    // If we already have server-provided product for this slug, skip client fetch
    if (product && product.slug === slug) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(String(slug))}`)
        if (!res.ok) {
          // try to resolve a canonical slug and redirect if found
          if (res.status === 404) {
            try {
              const r2 = await fetch(`${API_BASE}/api/product/resolve/${encodeURIComponent(String(slug))}`)
              if (r2.ok) {
                const js = await r2.json()
                if (js.canonical && js.canonical !== slug) {
                  router.replace(`/product/${js.canonical}`)
                  return
                }
              }
            } catch (e) {
              // ignore resolver errors
            }
          }

          console.error('product fetch failed', res.status)
          setProduct(null)
        } else {
          const json = await res.json()
          // normalize thumbnail: leave absolute paths (starting with '/') as-is
          // so the browser requests them from the frontend origin. Only prefix
          // with API_BASE when the API returned a relative path that does not
          // start with '/'.
          if (json.thumbnail && typeof json.thumbnail === 'string') {
            if (json.thumbnail.startsWith('http')) {
              // full URL, leave it
            } else if (json.thumbnail.startsWith('/')) {
              // absolute path on frontend origin, leave as-is
            } else {
              json.thumbnail = `${API_BASE}${json.thumbnail}`
            }
          }
          setProduct(json)
        }
      } catch (e) {
        console.error('fetch product failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router.isReady, slug])

  return (
    <div className={styles.page}>
      <Head>
        <title>{product ? product.title : 'Product'}</title>
        <meta name="description" content={product ? `${product.title} product page` : 'Product detail'} />
        {product && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            image: product.thumbnail,
            brand: product.brand,
            sku: product.product_id
          }) }} />
        )}
      </Head>

      <Header />
      <main className={`${styles.main} ${pageStyles.main}`}>
        <nav className={pageStyles.breadcrumb}>Home / Hardware / Video Cards / {slug}</nav>

        {loading && <div>Loading…</div>}

        {!loading && product && (
          <div className={pageStyles.contentRow}>
            <ProductGallery imageUrl={product.thumbnail || null} alt={product.title} />

            <div className={pageStyles.rightCol}>
              <ProductSummary title={product.title} brand={product.brand} productId={product.product_id} stock={product.stock} />
              <ProductActions
                price={product.price || null}
                id={product.product_id || product.title}
                title={product.title}
                thumbnail={product.thumbnail || null}
                stock={product.stock || null}
              />
              <ProductSpecs specs={product.specs || null} specTables={product.spec_tables || null} specFields={product.spec_fields || null} />
            </div>
          </div>
        )}

        {!loading && !product && (
          <div>Product not found.</div>
        )}
      </main>
    </div>
  )
}
