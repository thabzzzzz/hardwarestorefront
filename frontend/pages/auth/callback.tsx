import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/header/header';
import styles from '../../styles/home.module.css';

export default function AuthCallback() {
  const router = useRouter();
  const [errorVisible, setErrorVisible] = useState('');

  useEffect(() => {
    // Only run on client-side
    if (!router.isReady) return;

    const { token, error } = router.query;

    if (error) {
      setErrorVisible(String(error));
      setTimeout(() => router.push('/'), 3000);
      return;
    }

    if (token) {
      localStorage.setItem('auth_token', String(token));
      // redirect to home
      router.push('/');
    } else {
      // no token, no error
      router.push('/');
    }
  }, [router.isReady, router.query, router]);

  return (
    <>
      <Head>
        <title>Authenticating... | WiredWorkshop</title>
      </Head>
      <Header />
      <div className={styles.container} style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {errorVisible ? (
          <>
            <h2>Authentication Failed</h2>
            <p style={{ color: 'red' }}>{errorVisible}</p>
            <p>Redirecting to home...</p>
          </>
        ) : (
          <>
            <h2>Authenticating...</h2>
            <p>Please wait while we log you in.</p>
          </>
        )}
      </div>
    </>
  );
}
