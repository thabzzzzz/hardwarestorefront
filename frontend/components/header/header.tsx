import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './header.module.css'
import useWishlist from '../../hooks/useWishlist'
import useCart from '../../hooks/useCart'
import getDisplayTitle from '../../lib/getDisplayTitle'
import { useRouter } from 'next/router'
import TextField from '@mui/material/node/TextField/index.js'
import InputAdornment from '@mui/material/node/InputAdornment/index.js'
import IconButton from '@mui/material/node/IconButton/index.js'

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

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

  // export heights as CSS variables (avoid inline JSX styles)
  useEffect(() => {
    try {
      document.documentElement.style.setProperty('--topbar-height', `${topbarHeight}px`)
      document.documentElement.style.setProperty('--brand-height', `${brandHeight}px`)
    } catch (e) {
      // ignore
    }
  }, [topbarHeight, brandHeight])

  const wishlist = useWishlist()
  const cart = useCart()
  const router = useRouter()


  // search state
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<any>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false)
  const [mobileMenuActive, setMobileMenuActive] = useState(false)
  

  useEffect(() => {
    let openTimer: number | undefined
    let closeTimer: number | undefined

    if (mobileMenuOpen) {
      setMobileMenuVisible(true)
      openTimer = window.setTimeout(() => setMobileMenuActive(true), 20)
    } else {
      setMobileMenuActive(false)
      closeTimer = window.setTimeout(() => setMobileMenuVisible(false), 220)
    }

    return () => {
      if (openTimer) window.clearTimeout(openTimer)
      if (closeTimer) window.clearTimeout(closeTimer)
    }
  }, [mobileMenuOpen])

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
        {/* Mobile header: shown only on small screens via CSS */}
        <div className={styles.mobileHeader}>
          <div className={styles.mobileRow1}>
            <div className={styles.mobileLogo}>
              <Link href="/">
                <img src="/images/logo/logo2.svg" alt="WiredWorkshop" className={styles.logoImage} />
              </Link>
            </div>
            <div className={styles.mobileIcons}>
              <button aria-label="Open menu" className={styles.iconButton} onClick={() => setMobileMenuOpen(true)}>
                <img src="/images/icons/burger-menu.svg" alt="Menu" />
              </button>
              <div className={styles.profileWrap}>
                <button aria-haspopup="true" aria-expanded={profileOpen} className={styles.iconButton} onClick={() => setProfileOpen(v => !v)}>
                  <img src="/images/icons/profile.svg" alt="Profile" />
                </button>
                {profileOpen && (
                  <div className={styles.profileMenu} onMouseLeave={() => setProfileOpen(false)}>
                    <a href="#" onClick={(e)=>e.preventDefault()}>Login</a>
                    <a href="#" onClick={(e)=>e.preventDefault()}>Blog</a>
                    <Link href="/wishlist">Wishlist</Link>
                  </div>
                )}
              </div>
              <Link href="/cart" className={styles.iconButton} aria-label="View cart">
                <img src="/icons/cart.svg" alt="Cart" />
              </Link>
            </div>
          </div>
          <div className={styles.mobileRow2}>
            <div className={styles.searchBoxMobile}>
              <TextField
                placeholder="Search..."
                value={query}
                size="small"
                fullWidth
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { doSearchNavigate(query) } }}
                onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" onClick={() => doSearchNavigate(query)}>
                        <img src="/icons/search.svg" alt="Search" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </div>
          </div>
        </div>
        <div ref={topbarRef} className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <a href="#" onClick={(e)=>e.preventDefault()} className={styles.disabledLink}>Login <span className={styles.coming}>(Coming soon)</span></a>
            <a href="#" onClick={(e)=>e.preventDefault()} className={styles.disabledLink}>Blog <span className={styles.coming}>(Coming soon)</span></a>
          </div>
          <div className={styles.topbarRight}>
            <Link href="/wishlist" className={styles.wishlistLink} aria-label="View wishlist">
              <svg className={styles.wishlistIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6.5 3.5 5 5.5 5c1.54 0 3.04.99 3.57 2.36h.87C13.46 5.99 14.96 5 16.5 5 18.5 5 20 6.5 20 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>Wishlist ({wishlist.count})</span>
            </Link>
          </div>
        </div>
        <div ref={brandRef} className={`${styles.brandRow} ${atTop ? styles.brandRowShifted : ''}`}>
          <div className={styles.logo}>
            <Link href="/">
              <img src="/images/logo/logo2.svg" alt="WiredWorkshop" className={styles.logoImage} />
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
                    <li><a href="/products/ram">Memory / RAM</a></li>
                  </ul>
                </div>
                <div className={styles.category}>
                  <h4>Storage Devices</h4>
                  <ul>
                    <li><a href="/products/ssds">Solid State Drives / SSDs</a></li>
                    <li><a href="/products/hdds">Internal Hard Drives</a></li>
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
              <TextField
                placeholder="search"
                value={query}
                size="small"
                fullWidth
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { doSearchNavigate(query) } }}
                onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" size="small" onClick={() => doSearchNavigate(query)}>
                        <img src="/icons/search.svg" alt="Search" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {suggestions.map((s: any) => (
                    <div key={s.variant_id || s.id || s.slug} className={styles.suggestionItem} onMouseDown={() => { /* mousedown to avoid blur */ router.push(s.slug ? `/product/${s.slug}` : `/product/${encodeURIComponent(s.title)}`) }}>
                      <img src={s.thumbnail || '/images/products/placeholder.png'} className={styles.suggestionThumb} />
                      <div className={styles.suggestionMeta}>
                        <div className={styles.suggestionTitle}>{getDisplayTitle({ title: s.title, name: (s as any).name, manufacturer: (s as any).manufacturer, productType: (s as any).product_type || (s as any).productType })}</div>
                        <div className={styles.suggestionPrice}>{s.current_price ? (new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format((s.current_price.amount_cents || 0) / 100)) : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/cart" className={styles.cartButton} aria-label="View cart">
              <img src="/icons/cart.svg" alt="Cart" />
              <span className={styles.cartCount}>({cart.count})</span>
            </Link>
          </div>
        </div>
        {mobileMenuVisible && (
          <div className={styles.mobileMenuOverlay} role="dialog" aria-modal="true" onClick={() => setMobileMenuOpen(false)}>
            <div className={`${styles.mobileMenuInner} ${mobileMenuActive ? styles.mobileMenuInnerOpen : ''}`} onClick={(e) => e.stopPropagation()}>
              <button className={styles.mobileMenuClose} onClick={() => setMobileMenuOpen(false)}>Close</button>
              <nav className={styles.mobileNav}>
                <a>HARDWARE</a>
                <a>PCS & LAPTOPS</a>
                <a>PROMOS</a>
                <a>PC BUILDER</a>
              </nav>
            </div>
          </div>
        )}
      </header>
      {/* spacer to prevent layout jump because brandRow is fixed */}
      <div className={styles.spacer} aria-hidden="true" />
    </>
  )
}

  // HMR test: appended comment
