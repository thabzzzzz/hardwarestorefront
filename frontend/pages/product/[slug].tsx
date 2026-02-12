import React, { useEffect, useState, useRef } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { GetServerSideProps } from 'next'
import Header from '../../components/header/header'
import ProductGallery from '../../components/product/ProductGallery'
import ProductSummary from '../../components/product/ProductSummary'
import ProductSpecs from '../../components/product/ProductSpecs'
import ProductActions from '../../components/product/ProductActions'
import MinifiedActionBar from '../../components/product/MinifiedActionBar'
import MobileStickyAction from '../../components/product/MobileStickyAction'
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
export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug
  if (!slug) return { props: { initialProduct: null } }

  const API_BASE = process.env.SERVER_API_BASE_URL || 'http://web'
  try {
    const res = await fetch(`${API_BASE}/api/products/${encodeURIComponent(String(slug))}`)
    if (!res.ok) return { props: { initialProduct: null } }
    const json = await res.json()

    // helper: extract first http(s) image URL from messy strings (handles brackets, nested quotes, escaped slashes)
    const extractFirstImageUrl = (s: string | null | undefined) => {
      if (!s) return null
      let t = String(s).trim()
      // convert escaped \/ to /
      t = t.replace(/\\\//g, '/')
      // strip outer brackets and quotes repeatedly
      while ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('"') && t.endsWith('"'))) {
        t = t.slice(1, -1).trim()
      }
      // attempt to find first https? URL with common image extensions
      const m = t.match(/https?:\/\/[^"'\]\s,]+?\.(?:jpg|jpeg|png|webp|gif)/i)
      if (m) return m[0]
      // fallback: split by comma, look for an http-like piece
      const parts = t.split(',').map(p => p.trim()).filter(Boolean)
      for (const p of parts) {
        const mm = p.match(/https?:\/\/[^\s"']+/i)
        if (mm) return mm[0]
      }
      // final fallback: return cleaned first part
      return parts[0] || null
    }

    const normalize = (u: any) => {
      if (!u) return u
      if (typeof u === 'string') {
        const first = extractFirstImageUrl(u)
        if (!first) return null
        if (first.startsWith('http') || first.startsWith('/')) return first
        return `${API_BASE}${first}`
      }
      if (typeof u === 'object' && u.url) {
        const first = extractFirstImageUrl(String(u.url))
        if (!first) return { ...u, url: null }
        if (first.startsWith('http') || first.startsWith('/')) return { ...u, url: first }
        return { ...u, url: `${API_BASE}${first}` }
      }
      return u
    }

    // normalize thumbnail as in client (use extractFirstImageUrl when thumbnail is messy)
    if (json.thumbnail && typeof json.thumbnail === 'string') {
      const cleanedThumb = extractFirstImageUrl(json.thumbnail)
      if (cleanedThumb) {
        if (cleanedThumb.startsWith('http') || cleanedThumb.startsWith('/')) json.thumbnail = cleanedThumb
        else json.thumbnail = `${API_BASE}${cleanedThumb}`
      }
    }

    if (Array.isArray(json.images)) {
      json.images = json.images.map((x: any) => normalize(x))
    } else if (json.images && typeof json.images === 'string') {
      const first = extractFirstImageUrl(String(json.images))
      json.images = [normalize(first)]
    }
    if (json.spec_fields && Array.isArray(json.spec_fields.images)) {
      json.spec_fields.images = json.spec_fields.images.map((x: any) => normalize(x))
    } else if (json.spec_fields && json.spec_fields.images && typeof json.spec_fields.images === 'string') {
      const first = extractFirstImageUrl(String(json.spec_fields.images))
      json.spec_fields.images = [normalize(first)]
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
  const actionsRef = useRef<HTMLDivElement>(null)
  const [showMinified, setShowMinified] = useState(false)
  const [showMobileSticky, setShowMobileSticky] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const el = actionsRef.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      // Desktop: If element is scrolled past (not intersecting and top < 0)
      if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
        setShowMinified(true)
      } else {
        setShowMinified(false)
      }

      // Mobile: Show if NOT intersecting (meaning either above or below viewport)
      // "disappear once visible"
      setShowMobileSticky(!entry.isIntersecting)

    }, { threshold: 0 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [product, loading])

  const mapCategory = (cat: string | undefined | null) => {
    if (!cat) return null
    const s = String(cat).toLowerCase().trim()
    
    const map: Record<string, { section: string, label: string, href: string }> = {
      // Computer Components
      'gpus': { section: 'Computer Components', label: 'Graphics Cards', href: '/products/gpus' },
      'graphics cards': { section: 'Computer Components', label: 'Graphics Cards', href: '/products/gpus' },
      'cpus': { section: 'Computer Components', label: 'Processors', href: '/products/processors' },
      'processors': { section: 'Computer Components', label: 'Processors', href: '/products/processors' },
      'motherboards': { section: 'Computer Components', label: 'Motherboards', href: '/products/motherboards' },
      'cases': { section: 'Computer Components', label: 'Cases', href: '/products/cases' },
      'ram': { section: 'Computer Components', label: 'Memory', href: '/products/ram' },
      'memory': { section: 'Computer Components', label: 'Memory', href: '/products/ram' },

      // Storage Devices
      'ssds': { section: 'Storage Devices', label: 'Solid State Drives', href: '/products/ssds' },
      'hdds': { section: 'Storage Devices', label: 'Internal Hard Drives', href: '/products/hdds' },
      
      // Peripherals
      'monitors': { section: 'Peripherals', label: 'Monitors', href: '/products/monitors' },
      'mid': { section: 'Peripherals', label: 'Monitors', href: '/products/monitors' }, // typical junk mismatch if any
      'keyboards': { section: 'Peripherals', label: 'Keyboards', href: '/products/keyboards' },
      'mice': { section: 'Peripherals', label: 'Mice', href: '/products/mice' },
      'headsets': { section: 'Peripherals', label: 'Headsets', href: '/products/headsets' },

      // Networking
      'routers': { section: 'Networking', label: 'Routers', href: '/products/routers' },

      // Computer Accessories
      'casefans': { section: 'Computer Accessories', label: 'Fans & Coolers', href: '/products/case-fans' },
      'psus': { section: 'Computer Accessories', label: 'Power Supplies', href: '/products/psus' }
    }

    // Direct lookup
    if (map[s]) return map[s]

    // Fuzzy lookup
    if (s.includes('gpu') || s.includes('graphics')) return map['gpus']
    if (s.includes('cpu') || s.includes('processor')) return map['cpus']
    if (s.includes('motherboard')) return map['motherboards']
    if (s.includes('memory') || s.includes('ram')) return map['ram']
    if (s.includes('ssd')) return map['ssds']
    if (s.includes('hdd') || s.includes('hard drive')) return map['hdds']
    if (s.includes('monitor') || s.includes('screen')) return map['monitors']
    if (s.includes('keyboard')) return map['keyboards']
    if (s.includes('mouse') || s.includes('mice')) return map['mice']
    if (s.includes('headset') || s.includes('audio')) return map['headsets']
    if (s.includes('router') || s.includes('networking')) return map['routers']
    if (s.includes('fan') || s.includes('cooler')) return map['casefans']
    if (s.includes('psu') || s.includes('power supply')) return map['psus']

    // Fallback: Default to just Hardware -> Capitalized Slug
    const label = String(cat).replace(/[-_]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    return { section: 'Hardware', label, href: `/products/${encodeURIComponent(String(cat))}` }
  }

  useEffect(() => {
    function update() {
      if (typeof window === 'undefined') return
      setIsDesktop(window.innerWidth >= 768)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!router.isReady) return
    if (!slug) return
    // ensure we only fetch once on the client to avoid multiple network requests
    const fetchedRef = (load as any).__hasFetched
    if (fetchedRef) return
    // If we already have server-provided product for this slug, skip client fetch
    if (product && product.slug === slug) {
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      ;(load as any).__hasFetched = true
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
          // normalize images and spec_fields.images on client fetch (use same robust extractor)
          const extractFirstImageUrl = (s: string | null | undefined) => {
            if (!s) return null
            let t = String(s).trim()
            t = t.replace(/\\\//g, '/')
            while ((t.startsWith('[') && t.endsWith(']')) || (t.startsWith('"') && t.endsWith('"'))) {
              t = t.slice(1, -1).trim()
            }
            const m = t.match(/https?:\/\/[^"'\]\s,]+?\.(?:jpg|jpeg|png|webp|gif)/i)
            if (m) return m[0]
            const parts = t.split(',').map(p => p.trim()).filter(Boolean)
            for (const p of parts) {
              const mm = p.match(/https?:\/\/[^\s"']+/i)
              if (mm) return mm[0]
            }
            return parts[0] || null
          }

          const normalizeClient = (u: any) => {
            if (!u) return u
            if (typeof u === 'string') {
              const first = extractFirstImageUrl(u)
              if (!first) return null
              if (first.startsWith('http') || first.startsWith('/')) return first
              return `${API_BASE}${first}`
            }
            if (typeof u === 'object' && u.url) {
              const first = extractFirstImageUrl(String(u.url))
              if (!first) return { ...u, url: null }
              if (first.startsWith('http') || first.startsWith('/')) return { ...u, url: first }
              return { ...u, url: `${API_BASE}${first}` }
            }
            return u
          }
          if (Array.isArray(json.images)) {
            json.images = json.images.map((x: any) => normalizeClient(x))
          } else if (json.images && typeof json.images === 'string') {
            json.images = [normalizeClient(String(json.images).split(',')[0].trim())]
          }
          if (json.spec_fields && Array.isArray(json.spec_fields.images)) {
            json.spec_fields.images = json.spec_fields.images.map((x: any) => normalizeClient(x))
          } else if (json.spec_fields && json.spec_fields.images && typeof json.spec_fields.images === 'string') {
            json.spec_fields.images = [normalizeClient(String(json.spec_fields.images).split(',')[0].trim())]
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
        <nav className={pageStyles.breadcrumb}>
          {product ? (() => {
            const prodAny = (product as any)
            const catCandidate = (Array.isArray(prodAny.categories) && prodAny.categories.length > 0)
              ? prodAny.categories[0]
              : (prodAny.product_type || prodAny.type || prodAny.category || null)
            const mapped = mapCategory(catCandidate)
            if (mapped) return `Home / Hardware / ${mapped.section === 'Hardware' ? '' : mapped.section + ' / '}${mapped.label} / ${product.title}`

            // fallback: try to infer from slug (e.g., contains 'cpu') or product_type hints
            const inferred = mapCategory(prodAny.product_type || prodAny.type || prodAny.title || null)
            if (inferred) return `Home / Hardware / ${inferred.section === 'Hardware' ? '' : inferred.section + ' / '}${inferred.label} / ${product.title}`

            return `Home / Hardware / Video Cards / ${product.title}`
          })() : 'Home / Hardware / Product'}
        </nav>

        {loading && <div>Loading…</div>}

        {!loading && product && (
          <>
            <div className={pageStyles.mobileHeader}>
              <div className={pageStyles.mobileBrand}>{product.brand}</div>
              <h1 className={pageStyles.mobileTitle}>{product.title}</h1>
            </div>

            <div className={pageStyles.contentRow}>
              <ProductGallery
                imageUrl={product.thumbnail || null}
                images={(product as any).images || (product.spec_fields && (product.spec_fields as any).images) || null}
                alt={product.title}
              />

              <div className={pageStyles.rightCol}>
                <ProductSummary
                  title={product.title}
                  brand={product.brand}
                  productId={product.product_id}
                  stock={product.stock}
                  specs={product.specs}
                />
                <div ref={actionsRef}>
                  <ProductActions
                    price={product.price || null}
                    id={product.product_id || product.title}
                    title={product.title}
                    thumbnail={product.thumbnail || null}
                    stock={product.stock || null}
                    useNativeQty={!isDesktop}
                  />
                </div>
              </div>
            </div>

            <ProductSpecs specs={product.specs || null} specTables={product.spec_tables || null} specFields={product.spec_fields || null} />
            
            <MinifiedActionBar 
              visible={showMinified}
              product={{
                id: product.product_id || '',
                title: product.title,
                thumbnail: product.thumbnail || null,
                price: product.price,
                stock: product.stock
              }}
            />
            
            <MobileStickyAction
              visible={showMobileSticky}
              product={{
                id: product.product_id || '',
                title: product.title,
                thumbnail: product.thumbnail || null,
                price: product.price,
                stock: product.stock
              }}
            />
          </>
        )}

        {!loading && !product && (
          <div>Product not found.</div>
        )}
      </main>
    </div>
  )
}
