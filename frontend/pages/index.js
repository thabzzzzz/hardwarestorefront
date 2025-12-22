import Header from '../components/Header'
import Hero from '../components/Hero'
import HotDeals from '../components/HotDeals'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Hero />
        <HotDeals />
      </main>
    </div>
  )
}
