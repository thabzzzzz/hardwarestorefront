import Header from '../components/header'
import Hero from '../components/hero'
import HotDeals from '../components/hotDeals'
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
