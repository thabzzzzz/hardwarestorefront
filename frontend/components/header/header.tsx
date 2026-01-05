import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './header.module.css'
import useWishlist from '../../hooks/useWishlist'
import useCart from '../../hooks/useCart'
import getDisplayTitle from '../../lib/getDisplayTitle'
import { useRouter } from 'next/router'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function Header(): JSX.Element {
  const topbarRef = useRef<HTMLDivElement | null>(null)
  const brandRef = useRef<HTMLDivElement | null>(null)
  const [atTop, setAtTop] = useState<boolean>(true)
  const [topbarHeight, setTopbarHeight] = useState<number>(0)
  const [brandHeight, setBrandHeight] = useState<number>(0)

  useEffect(() => {
    function updateHeights() {
      setTopbarHeight(topbarRef.current?.offsetHeight ?? 0)
      setBrandHeight(brandRef.current?.offsetHeight ?? 0)
    }

    updateHeights()

    const onScroll = () => setAtTop(window.scrollY === 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateHeights)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateHeights)
    }
  }, [])

  const wishlist = useWishlist()
  const cart = useCart()
  const router = useRouter()


  // search state
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<any>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<number | null>(null)

  function doSearchNavigate(q: string) {
    if (!q || String(q).trim().length === 0) return
    router.push(`/search?q=${encodeURIComponent(q)}`)
    setShowSuggestions(false)
  }

  async function fetchSuggestions(q: string) {
    if (!q || q.trim().length < 2) {
      setSuggestions([])
      return
    }
    try {
      // fetch a modest page and filter client-side
      const res = await fetch(`${API_BASE}/api/products?per_page=100`)
      if (!res.ok) return
      const js = await res.json()
      const list = js.data || []
      const needle = q.trim().toLowerCase()
      const matches = list.filter((it: any) => {
        const title = String(it.title || '').toLowerCase()
        const name = String((it as any).name || '').toLowerCase()
        const sku = String(it.sku || '').toLowerCase()
        const manufacturer = String((it as any).manufacturer || '').toLowerCase()
        return title.includes(needle) || name.includes(needle) || sku.includes(needle) || manufacturer.includes(needle)
      }).slice(0, 3)
      setSuggestions(matches)
      setShowSuggestions(true)
    } catch (e) {
      console.error('suggestions failed', e)
    }
  }

  function onQueryChange(v: string) {
    setQuery(v)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => fetchSuggestions(v), 250)
  }

  return (
    <>
      <header className={styles.header}>
        <div ref={topbarRef} className={styles.topbar}>
          <div />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link href="/wishlist">Wishlist ({wishlist.count})</Link>
          </div>
        </div>
        <div
          ref={brandRef}
          className={`${styles.brandRow} ${atTop ? styles.brandRowShifted : ''}`}
          style={{ ['--topbar-height' as any]: `${topbarHeight}px` }}
        >
          <div className={styles.logo}>
            <Link href="/">
              <img src="/images/logo/logo.svg" alt="Wootware" className={styles.logoImage} />
            </Link>
          </div>
          <nav className={styles.nav}>
          <div className={`${styles.navItem} ${styles.hasSubmenu}`}>
            <a>HARDWARE
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
              </svg>
            </a>
            <div className={styles.submenu}>
              <div className={styles.submenuGrid}>
                <div className={styles.category}>
                  <h4>Computer Components</h4>
                    <ul>
                    <li><a href="/products/gpus">Graphics Cards</a></li>
                    <li><a href="/products/processors">Processors / CPUs</a></li>
                    <li><a>Memory / RAM</a></li>
                  </ul>
                </div>
                <div className={styles.category}>
                  <h4>Storage Devices</h4>
                  <ul>
                    <li><a>Solid State Drives / SSDs</a></li>
                    <li><a>Internal Hard Drives</a></li>
                    <li><a>External Storage</a></li>
                  </ul>
                </div>
                <div className={styles.category}>
                  <h4>Peripherals</h4>
                  <ul>
                    <li><a>Monitors / Screens</a></li>
                    <li><a>Keyboards</a></li>
                    <li><a>Mice & Controllers</a></li>
                  </ul>
                </div>
                <div className={styles.category}>
                  <h4>Networking</h4>
                  <ul>
                    <li><a>Modems</a></li>
                    <li><a>Routers</a></li>
                    <li><a>Adapters</a></li>
                  </ul>
                </div>
                <div className={styles.category}>
                  <h4>Computer Accessories</h4>
                  <ul>
                    <li><a>Water / Liquid Cooling</a></li>
                    <li><a>Fans & CPU Coolers</a></li>
                    <li><a>UPS / Power Protection</a></li>
                  </ul>
                </div>
                <div className={styles.category}>
                  <h4>Other</h4>
                  <ul>
                    <li><a>Software</a></li>
                    <li><a>Webcams</a></li>
                    <li><a>Cellphones</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <a>PCS & LAPTOPS
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </a>
          <a>PROMOS
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </a>
          <a>PC BUILDER
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </a>
          </nav>
          <div className={styles.brandDivider} aria-hidden="true" />
          <div className={styles.brandActions}>
            <div className={styles.searchBox}>
              <img src="/icons/search.svg" alt="Search" className={styles.searchIcon} onClick={() => doSearchNavigate(query)} />
              <input placeholder="search" value={query} onChange={(e) => onQueryChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { doSearchNavigate(query) } }} onFocus={() => { if (suggestions.length) setShowSuggestions(true) }} onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #ddd', width: '100%', boxSizing: 'border-box', zIndex: 60, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                  {suggestions.map((s: any) => (
                    <div key={s.variant_id || s.id || s.slug} style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'center', cursor: 'pointer' }} onMouseDown={() => { /* mousedown to avoid blur */ router.push(s.slug ? `/product/${s.slug}` : `/product/${encodeURIComponent(s.title)}`) }}>
                      <img src={s.thumbnail || '/images/products/placeholder.png'} style={{ width: 48, height: 36, objectFit: 'cover' }} />
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 600 }}>{getDisplayTitle({ title: s.title, name: (s as any).name, manufacturer: (s as any).manufacturer, productType: (s as any).product_type || (s as any).productType })}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{s.current_price ? (new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format((s.current_price.amount_cents || 0) / 100)) : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/cart" className={styles.cartButton} aria-label="View cart">
              <img src="/icons/cart.svg" alt="Cart" />
              <span style={{ marginLeft: 6 }}>({cart.count})</span>
            </Link>
          </div>
        </div>
      </header>
      {/* spacer to prevent layout jump because brandRow is fixed */}
      <div style={{ height: brandHeight }} aria-hidden="true" />
    </>
  )
}
