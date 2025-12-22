import styles from '../styles/Home.module.css'

export default function Hero() {
  return (
    <section className={styles.heroWrap}>
      <div className={styles.heroMain}>
        <div className={styles.heroText}>
          <h1>BUILD. PLAY. CREATE.</h1>
          <p>We're excited to bring you NZXT's award-winning PC hardware — minimalist design, powerful performance.</p>
          <button className={styles.cta}>Shop Now</button>
        </div>
        <div className={styles.heroSidebar}>
          <img src="https://via.placeholder.com/260x180" alt="featured" />
          <div className={styles.featureTag}>FEATURED DEAL →</div>
        </div>
      </div>
      <div className={styles.bannerStrip}>CUSTOM BUILT PERFORMANCE <button className={styles.buildBtn}>BUILD IT</button></div>
    </section>
  )
}
