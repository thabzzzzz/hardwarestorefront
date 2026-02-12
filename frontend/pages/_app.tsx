import '../styles/globals.css'
import Head from 'next/head'
import type { AppProps } from 'next/app'
import { CacheProvider, EmotionCache } from '@emotion/react'
import createEmotionCache from '../lib/createEmotionCache'
// Use the node-specific entry for MUI styles to avoid directory import issues on the server
import { ThemeProvider } from '@mui/material/node/styles'
// Use node-specific entry to avoid directory import errors on the server
import CssBaseline from '@mui/material/node/CssBaseline'
import theme from '../lib/muiTheme'

import Footer from '../components/footer/Footer'
import styles from './_app.module.css'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'

// Client-side cache shared for the session
const clientSideEmotionCache = createEmotionCache()

type MyAppProps = AppProps & {
  emotionCache?: EmotionCache
}

export default function App({ Component, pageProps, emotionCache = clientSideEmotionCache }: MyAppProps) {
  const [toastPosition, setToastPosition] = useState<'top-left' | undefined>(undefined)

  useEffect(() => {
    const updatePosition = () => {
      if (typeof window === 'undefined') return
      setToastPosition(window.innerWidth <= 600 ? 'top-left' : undefined)
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
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
        <CssBaseline />
        <div className={styles.root}>
          <main className={styles.main}>
            <Component {...pageProps} />
          </main>
          <Toaster {...(toastPosition ? { position: toastPosition } : {})} />
          <Footer />
        </div>
      </ThemeProvider>
    </CacheProvider>
  )
}
