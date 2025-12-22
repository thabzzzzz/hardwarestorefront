import Header from '../components/header/header'
import Hero from '../components/landing/hero'
import HotDeals from '../components/landing/hotDeals'
import styles from '../styles/home.module.css'

export default function Home(): JSX.Element {
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
