import styles from '../styles/Home.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.topbar}>
        <div className={styles.toplinks}>My Account &nbsp;|&nbsp; My Wishlist &nbsp;|&nbsp; My Basket</div>
        <div className={styles.searchBox}>
          <input placeholder="Search..." />
        </div>
      </div>
      <div className={styles.brandRow}>
        <div className={styles.logo}>Wootware</div>
        <nav className={styles.nav}>
          <a>HARDWARE</a>
          <a>PCS & LAPTOPS</a>
          <a>PROMOS</a>
          <a>PC BUILDER</a>
        </nav>
      </div>
    </header>
  )
}
