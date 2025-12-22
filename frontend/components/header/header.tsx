import styles from './header.module.css'

export default function Header(): JSX.Element {
  return (
    <header className={styles.header}>
      <div className={styles.topbar}>
        <div className={styles.toplinks}>My Account &nbsp;|&nbsp; My Wishlist &nbsp;|&nbsp; My Basket</div>
        <div className={styles.searchBox}>
          <input placeholder="Search..." />
        </div>
      </div>
      <div className={styles.brandRow}>
        <div className={styles.logo}>
          <img src="/images/logo/logo.svg" alt="Wootware" className={styles.logoImage} />
        </div>
        <nav className={styles.nav}>
          <div className={`${styles.navItem} ${styles.hasSubmenu}`}>
            <a>HARDWARE</a>
            <div className={styles.submenu}>
              <div className={styles.submenuGrid}>
                <div className={styles.category}>
                  <h4>Computer Components</h4>
                  <ul>
                    <li><a>Graphics Cards</a></li>
                    <li><a>Processors / CPUs</a></li>
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
          <a>PCS & LAPTOPS</a>
          <a>PROMOS</a>
          <a>PC BUILDER</a>
        </nav>
      </div>
    </header>
  )
}
