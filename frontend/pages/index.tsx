import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Container, Grid, Typography, Box, Button } from '@mui/material'
import Header from '../components/header/header'
import Hero from '../components/landing/hero'
import ProductCard from '../components/product/ProductCard'
import styles from '../styles/home.module.css'

const API_BASE = typeof window === 'undefined'
  ? (process.env.SERVER_API_BASE_URL || 'http://web')
  : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

export default function Home(): JSX.Element {
  const [hotDeals, setHotDeals] = useState<any[]>([])
  const [popular, setPopular] = useState<any[]>([])
  const [newArrivals, setNewArrivals] = useState<any[]>([])

  useEffect(() => {
    async function fetchProducts(queries: string[], setter: (data: any[]) => void) {
      const results = await Promise.all(queries.map(async (q) => {
        try {
          // Use a broad search to find specific items we know exist in the DB (2026 data)
          const res = await fetch(`${API_BASE}/api/products?per_page=1&q=${encodeURIComponent(q)}`)
          const json = await res.json()
          return json.data && json.data[0] ? json.data[0] : null
        } catch (e) {
          console.error(`Failed to fetch ${q}`, e)
          return null
        }
      }))
      setter(results.filter(Boolean))
    }

    // Hot Deals: High-end & Mid-range performance picks
    fetchProducts(
      [
        'RTX 5070',          // Replaces RTX 4070 Ti (Next gen available in DB)
        'RX 9060 XT',        // Replaces RX 7600 (Next gen mid-range)
        'Ryzen 7 7800X3D',   // Keeps requested CPU (Exists)
        'Taichi Radeon RX 9070' // Replaces RX 6900 (High end AMD)
      ],
      setHotDeals
    )

    // Popular: High visibility items
    fetchProducts(
      [
        'MSI MAG 271QP',     // Monitor
        'Trident Z5',        // RAM
        'RM1200x',           // PSU (Replaces Case which wasn't found)
        'Ryzen 9 9950X3D'    // High-end CPU (Replaces Liquid Cooler)
      ],
      setPopular
    )

    // New Arrivals: Latest tech
    fetchProducts(
      [
        'Ryzen 7 9700X',     // New CPU
        'Thermaltake SMART', // PSU
        'V-COLOR DDR5',      // New RAM
        'Monster Hunter Wilds' // Special Edition GPU
      ],
      setNewArrivals
    )
  }, [])

  const renderSection = (title: string, products: any[]) => (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
      </Box>
      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item key={product.id || product.variant_id} xs={12} sm={6} md={3}>
            <ProductCard
              name={product.name}
              title={product.title}
              vendor={product.brand}
              sku={product.sku}
              stock={product.stock || null}
              thumbnail={product.thumbnail || null}
              price={product.current_price || null}
              slug={product.slug}
              manufacturer={product.manufacturer}
              productType={product.product_type}
              cores={product.cores}
              boostClock={product.boost_clock}
              microarchitecture={product.microarchitecture}
              socket={product.socket}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  )

  return (
    <div className={styles.page}>
      <Head>
        <title>WiredWorkshop</title>
        <meta name="description" content="WiredWorkshop — a personal storefront hobby project showcasing hardware products. For demo and learning purposes only." />
        <meta name="author" content="Personal project" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="WiredWorkshop" />
        <meta property="og:description" content="A personal storefront hobby project showcasing hardware products. Not a production store." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/" />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WiredWorkshop" />
        <meta name="twitter:description" content="Personal storefront hobby project — demo site." />
      </Head>
      <Header />
      <main className={styles.main}>
        <Hero />
        {renderSection('Hot Deals', hotDeals)}
        {renderSection('Popular Products', popular)}
        {renderSection('New Arrivals', newArrivals)}
      </main>
    </div>
  )
}
