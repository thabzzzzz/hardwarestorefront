import React, { useState } from 'react';
import Head from 'next/head';
import Header from '../components/header/header';
import { useAuth } from '../hooks/useAuth';

// Standard PC component categories matching the image closely
const CATEGORIES = [
   { id: 'cases', name: 'Chassis' },
   { id: 'cpus', name: 'CPU' },
   { id: 'coolers', name: 'CPU Cooler' },
   { id: 'motherboards', name: 'Motherboard' },
   { id: 'ram', name: 'Memory' },
   { id: 'gpus', name: 'Graphics Card' },
   { id: 'psus', name: 'PSU' },
   { id: 'ssds', name: 'Storage (SSD)' },
   { id: 'hdds', name: 'Storage (HDD)' },
];

const MOCK_PRODUCTS: Record<string, any[]> = {
  cases: [
    { id: 'c1', title: 'Montech XR ARGB Tempered Glass Black ATX Mid Tower Desktop Chassis', price: 1099, oldPrice: 1799, specs: ['ATX', 'Chassis Max GPU Length: 420', 'Windowed Side Panel', 'Max CPU Cooler: 175'], image: '/images/placeholder.png' },
    { id: 'c2', title: 'Montech AIR 903 MAX Black RGB Tempered Glass ATX Mid Tower Desktop Chassis', price: 1499, oldPrice: 1949, specs: ['E-ATX', 'Chassis Max GPU Length: 400', 'Windowed Side Panel', 'Max CPU Cooler: 180'], image: '/images/placeholder.png' },
    { id: 'c3', title: 'Montech X5 RGB Tempered Glass Black ATX Mid Tower Desktop Chassis', price: 999, oldPrice: 1199, specs: ['ATX', 'Chassis Max GPU Length: 410', 'Windowed Side Panel', 'Max CPU Cooler: 165'], image: '/images/placeholder.png' },
  ],
  cpus: [
    { id: 'cpu1', title: 'AMD Ryzen 5 7600 5.1GHz 6-Core AM5 Processor', price: 4299, oldPrice: 4999, specs: ['AM5', '6 Cores', '12 Threads', '65W TDP'], image: '/images/placeholder.png' },
    { id: 'cpu2', title: 'Intel Core i5-13400F 4.6GHz 10-Core LGA1700 Processor', price: 4199, oldPrice: 4599, specs: ['LGA1700', '10 Cores', '16 Threads', '65W TDP'], image: '/images/placeholder.png' },
  ],
  motherboards: [
     { id: 'mb1', title: 'MSI MAG B650M MORTAR WIFI DDR5 AM5 Micro-ATX Motherboard', price: 3899, oldPrice: 4499, specs: ['AM5', 'Micro-ATX', 'DDR5', 'WI-FI 6'], image: '/images/placeholder.png' }
  ]
};

export default function PcBuilder() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('cases');
  const [selectedComponents, setSelectedComponents] = useState<Record<string, any>>({});

  // Calculate total
  const totalPrice = Object.values(selectedComponents).reduce((sum, item) => sum + item.price, 0);

  const handleSelect = (category: string, product: any) => {
    setSelectedComponents(prev => ({
      ...prev,
      [category]: product
    }));
    // Optionally auto-advance to next category
    const currentIndex = CATEGORIES.findIndex(c => c.id === category);
    if (currentIndex < CATEGORIES.length - 1) {
      setActiveCategory(CATEGORIES[currentIndex + 1].id);
    }
  };

  const activeProducts = MOCK_PRODUCTS[activeCategory] || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f4f6', display: 'flex', flexDirection: 'column' }}>
      <Head>
        <title>PC Builder | WiredWorkshop</title>
      </Head>

      <Header />

      <main style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', padding: '24px', flex: 1, display: 'flex', gap: '24px', paddingBottom: '120px' }}>
        
        {/* Left Sidebar - Categories */}
        <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header for Actions or Bulk Clear */}
          <div style={{ paddingBottom: '0px', color: '#333', fontWeight: 700, fontSize: '24px' }}>
            System Builder
          </div>

          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            const selectedItem = selectedComponents[cat.id];

            return (
              <div 
                key={cat.id} 
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#fff', border: true ? `1px solid ${isSelected ? '#1f7a8c' : '#e0e0e0'}` : 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: isSelected ? '0 4px 12px rgba(31,122,140,0.1)' : '0 1px 3px rgba(0,0,0,0.02)', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Accent line for active */}
                { isSelected && (
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#1f7a8c' }} />
                )}
                
                <div style={{ width: '44px', height: '44px', backgroundColor: '#f0f4f5', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', color: '#1f7a8c' }}>
                  {/* Just a square or icon placeholder */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#333', fontSize: '16px', marginBottom: '4px' }}>{cat.name}</div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: selectedItem ? '#1f7a8c' : '#888',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: selectedItem ? 700 : 500
                  }}>
                    {selectedItem ? selectedItem.title : 'PLEASE SELECT'}
                  </div>
                </div>

                {selectedItem && (
                  <div style={{ color: '#4caf50', marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Pane - Product Selection */}
        <div style={{ flex: 1, backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#333' }}>
              <div style={{ width: '30px', height: '30px', color: '#666' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                {CATEGORIES.find(c => c.id === activeCategory)?.name}
              </h2>
              <span style={{ backgroundColor: '#e2e8f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#555', fontWeight: 600 }}>
                {activeProducts.length}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Quick Filter" 
                style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '14px', width: '240px', outline: 'none' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '14px', fontWeight: 600 }}>
                Filtering <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
              </div>
              <select style={{ padding: '10px 14px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '14px', backgroundColor: '#fff', outline: 'none' }}>
                <option>Most popular</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {activeProducts.length > 0 ? (
              activeProducts.map(product => (
                <div 
                  key={product.id} 
                  style={{
                    display: 'flex', padding: '24px 32px', borderBottom: '1px solid #eee', gap: '32px', alignItems: 'stretch'
                  }}
                >
                  <div style={{ width: '160px', height: '160px', flexShrink: 0, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={product.image} alt="product" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain', filter: 'grayscale(1) opacity(0.3)' }}/>
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', color: '#222', marginBottom: '16px', lineHeight: 1.5, fontWeight: 600 }}>
                        {product.title}
                      </h3>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                        {product.specs.map((spec: string, idx: number) => (
                          <span key={idx} style={{ padding: '4px 10px', backgroundColor: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '13px' }}>
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          {product.oldPrice && (
                            <span style={{ textDecoration: 'line-through', color: '#8faca6', fontSize: '14px' }}>
                              R {product.oldPrice.toLocaleString() }
                            </span>
                          )}
                          {product.oldPrice && (
                            <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 800 }}>
                              Save R {(product.oldPrice - product.price).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 800 + 'important!', color: '#1f7a8c' }}>
                          R {product.price.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ color: '#16a34a', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          In stock with WiredWorkshop
                        </div>
                        
                        <button 
                          onClick={() => handleSelect(activeCategory, product)}
                          style={{
                            padding: '12px 32px',
                            backgroundColor: selectedComponents[activeCategory]?.id === product.id ? '#111' : '#fff',
                            color: selectedComponents[activeCategory]?.id === product.id ? '#fff' : '#1f7a8c',
                            border: `2px solid ${selectedComponents[activeCategory]?.id === product.id ? '#111' : '#1f7a8c'}`,
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {selectedComponents[activeCategory]?.id === product.id ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#6b9' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <h3 style={{ marginTop: '16px', color: '#333' }}>No Products / Coming Soon</h3>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Bottom Sticky Bar */}
      <div style={{ 
        position: 'fixed', 
        bottom: 0, left: 0, right: 0, 
        backgroundColor: '#fafafa', 
        borderTop: '1px solid #e0e0e0', 
        boxShadow: '0 -4px 10px rgba(0,0,0,0.03)',
        padding: '24px 32px',
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '18px', color: '#333', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#1f7a8c' }}>
              R { totalPrice.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '15px', color: '#333', fontWeight: 600 }}>
              <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: '#1f7a8c' }} />
              Build it for me!
            </label>
            
            <button 
              style={{ 
                padding: '14px 40px', 
                backgroundColor: '#111', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '16px', 
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                opacity: totalPrice > 0 ? 1 : 0.5
              }}
              disabled={totalPrice === 0}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Go to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
