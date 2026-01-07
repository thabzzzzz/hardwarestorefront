import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Header from '../components/header/header'
// Product cards removed from landing — listing pages handle category grids
import Hero from '../components/landing/hero'
import HotDeals from '../components/landing/hotDeals'
import Popular from '../components/landing/popular'
import NewArrivals from '../components/landing/newArrivals'
import styles from '../styles/home.module.css'

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

export default function Home(): JSX.Element {
  return (
    <div className={styles.page}>
      <Head>
        <title>Wootware Clone</title>
        <meta name="description" content="Wootware Clone — a personal storefront hobby project showcasing hardware products. For demo and learning purposes only." />
        <meta name="author" content="Personal project" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / social */}
        <meta property="og:title" content="Wootware Clone" />
        <meta property="og:description" content="A personal storefront hobby project showcasing hardware products. Not a production store." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:image" content="/images/og-image.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Wootware Clone" />
        <meta name="twitter:description" content="Personal storefront hobby project — demo site." />
      </Head>
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
