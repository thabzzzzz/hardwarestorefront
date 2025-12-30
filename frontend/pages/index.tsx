import React, { useEffect, useState } from 'react'
import Header from '../components/header/header'
// Product cards removed from landing — listing pages handle category grids
import Hero from '../components/landing/hero'
import HotDeals from '../components/landing/hotDeals'
import Popular from '../components/landing/popular'
import NewArrivals from '../components/landing/newArrivals'
import styles from '../styles/home.module.css'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

export default function Home(): JSX.Element {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <Hero />
        <HotDeals />
        <Popular />
        <NewArrivals />
      </main>
    </div>
  )
}
