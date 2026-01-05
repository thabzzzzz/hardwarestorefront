import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './header.module.css'

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

  return (
    <>
      <header className={styles.header}>
        <div ref={topbarRef} className={styles.topbar}>
          <div className={styles.toplinks}>My Account &nbsp;|&nbsp; My Basket</div>
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
              <img src="/icons/search.svg" alt="Search" className={styles.searchIcon} />
              <input placeholder="search" />
            </div>
            <a href="/cart" className={styles.cartButton} aria-label="View cart">
              <img src="/icons/cart.svg" alt="Cart" />
            </a>
          </div>
        </div>
      </header>
      {/* spacer to prevent layout jump because brandRow is fixed */}
      <div style={{ height: brandHeight }} aria-hidden="true" />
    </>
  )
}
