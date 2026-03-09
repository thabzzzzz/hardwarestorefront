import React from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/header/header'
import styles from '../styles/home.module.css'

export default function Custom404() {
  return (
    <div className={styles.page}>
      <Head>
        <title>Page Not Found</title>
      </Head>

      <Header />
      <main className={styles.main}>
        <div className={styles.notFoundContainer}>
          <h1 className={styles.notFoundTitle}>404</h1>
          <h2 className={styles.notFoundSubtitle}>Page Not Found</h2>
          <p className={styles.notFoundText}>
            Oops! The page you're looking for doesn't exist, has been moved, or the link is broken.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/" legacyBehavior>
              <a className={styles.cta} style={{ textDecoration: 'none', fontWeight: '600', padding: '12px 24px', fontSize: '15px', display: 'inline-block' }}>
                Go back to Home
              </a>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
