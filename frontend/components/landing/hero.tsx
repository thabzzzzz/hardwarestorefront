import styles from './hero.module.css'

export default function Hero(): JSX.Element {
  return (
    <section className={styles.heroWrap}>
      <div className={styles.heroMain}>
        <div className={styles.heroText}>
          <h1>BUILD. PLAY. CREATE.</h1>
          <p>We're excited to bring you NZXT's award-winning PC hardware — minimalist design, powerful performance.</p>
          <button className={styles.cta}>Shop Now</button>
        </div>
        <div className={styles.heroSidebar}>
          <img src="/products/prod-0001/1ed6bb69-400w.webp" alt="featured" />
          <div className={styles.featureTag}>FEATURED DEAL →</div>
        </div>
      </div>
      <div className={styles.bannerStrip}>CUSTOM BUILT PERFORMANCE <button className={styles.buildBtn}>BUILD IT</button></div>
    </section>
  )
}
