import '../styles/globals.css'
import Head from 'next/head'
import type { AppProps } from 'next/app'

import Footer from '../components/footer/Footer'
import styles from './_app.module.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={styles.root}>
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="manifest" href="/site.webmanifest?v=2" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg?v=2" color="#1f7a8c" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <main className={styles.main}>
        <Component {...pageProps} />
      </main>
      
      <Footer />
    </div>
  )
}
