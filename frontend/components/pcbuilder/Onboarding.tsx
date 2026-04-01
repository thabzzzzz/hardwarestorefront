import React from 'react';
import { motion } from 'framer-motion';
import { BUILD_PROFILES } from '../../lib/pc-builder-profiles';

export const Onboarding = ({ onSelectProfile }: any) => {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', paddingTop: '40px' }}>
            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', color: '#1f7a8c' }}
            >
                What kind of PC are you building?
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: '1.25rem', color: '#666', marginBottom: '60px' }}
            >
                Select a profile below. We'll set a target budget and auto-fill compatible, top-rated components for your goal.
            </motion.p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', padding: '20px' }}>
                {Object.values(BUILD_PROFILES).map((profile, i) => (
                    <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i, type: "spring", stiffness: 100 }}
                        whileHover={{ scale: 1.05, boxShadow: "0px 10px 40px rgba(31, 122, 140, 0.2)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelectProfile(profile)}
                        style={{
                            background: '#fff',
                            borderRadius: '16px',
                            padding: '30px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 12px', color: '#333' }}>
                            {profile.name}
                        </h3>
                        <p style={{ color: '#777', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 24px' }}>
                            {profile.description}
                        </p>
                        
                        <div style={{ marginTop: 'auto', background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', fontWeight: 600 }}>Target Budget</span>
                            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1f7a8c', marginTop: '4px' }}>
                                R {(profile.targetBudget / 100).toLocaleString()}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}