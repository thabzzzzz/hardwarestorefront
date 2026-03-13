import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Header from '../components/header/header';
import styles from '../styles/home.module.css';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // Protect the route
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className={styles.appContainer}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container} style={{ marginTop: '2rem' }}>
            <p>Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // The useEffect will redirect
  }

  return (
    <div className={styles.appContainer}>
      <Head>
        <title>Customer Profile | WiredWorkshop</title>
      </Head>

      <Header />

      <main className={styles.main}>
        <div className={styles.container} style={{ marginTop: '2rem', minHeight: '50vh' }}>
          <h1 style={{ marginBottom: '1.5rem', fontSize: '28px', color: '#111' }}>My Account</h1>
          
          <div style={{
            background: '#fff',
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '600px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '24px', margin: '0 0 4px 0', color: '#222' }}>{user.name}</h2>
                <div style={{ color: '#666', fontSize: '15px' }}>{user.email}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />

            <div>
              <h3 style={{ fontSize: '18px', color: '#333', marginBottom: '16px' }}>Account Settings</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: '#1f7a8c', textDecoration: 'none', fontWeight: 500 }} onClick={(e) => e.preventDefault()}>Order History <span style={{color:'#999', fontSize:'12px', fontWeight: 'normal', marginLeft: '6px'}}>(Coming soon)</span></a></li>
                <li><a href="#" style={{ color: '#1f7a8c', textDecoration: 'none', fontWeight: 500 }} onClick={(e) => e.preventDefault()}>Address Book <span style={{color:'#999', fontSize:'12px', fontWeight: 'normal', marginLeft: '6px'}}>(Coming soon)</span></a></li>
                <li><a href="#" style={{ color: '#1f7a8c', textDecoration: 'none', fontWeight: 500 }} onClick={(e) => e.preventDefault()}>Payment Methods <span style={{color:'#999', fontSize:'12px', fontWeight: 'normal', marginLeft: '6px'}}>(Coming soon)</span></a></li>
              </ul>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button 
                onClick={logout}
                style={{
                  background: '#f8f9fa',
                  color: '#d93025',
                  border: '1px solid #ddd',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background-color 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fdf4f4'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
