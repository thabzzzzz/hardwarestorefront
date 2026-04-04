import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const AllocationModal = ({ isOpen, onClose, activeProfile, selectedComponents }: any) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!activeProfile || !isOpen) return null;

    const COMPONENT_NAMES: Record<string, string> = {
        gpus: "Graphics Card", cpus: "Processor", motherboards: "Motherboard",
        cases: "Chassis", psus: "Power Supply", memory: "Memory", storage: "Storage",
        coolers: "Cooling", "system-coolers": "System Cooling", ssds: "SSD", hdds: "HDD", os: "Operating System"
    };

    const sections = activeProfile.allocation || {};
    const targetTotal = activeProfile.targetBudget;

    return (
        <AnimatePresence>
            <div 
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: '500px', maxHeight: '85vh',
                        backgroundColor: '#fff', borderRadius: '16px',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}
                >
                    <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#333' }}>Budget Allocation</h3>
                            <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.5, margin: '4px 0 0 0' }}>Here's why we prioritized specific components for {activeProfile.name}.</p>
                        </div>
                        <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#999', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px', lineHeight: 1 }}>&times;</button>
                    </div>

                    <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.keys(sections).length > 0 ? Object.entries(sections).map(([key, data]: any) => {
                            const targetCost = targetTotal * (data.percent / 100);
                            const currentPart = selectedComponents[key];
                            const currentCostCents = currentPart ? (currentPart.current_price?.amount_cents || currentPart.price?.amount_cents || 0) : 0;
                            const currentCost = currentCostCents / 100;
                            const isOver = currentCost > targetCost * 1.15;
                            const isUnder = currentCost < targetCost * 0.85;

                            let statusColor = '#4caf50'; let statusText = 'On Target';
                            if (isOver) { statusColor = '#f44336'; statusText = 'Over Target'; }
                            else if (isUnder && currentCost > 0) { statusColor = '#ff9800'; statusText = 'Below Target'; }

                            return (
                                <div key={key} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, textTransform: 'capitalize', color: '#444' }}>{COMPONENT_NAMES[key.toLowerCase()] || key}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusColor, background: `${statusColor}11`, padding: '4px 8px', borderRadius: '4px' }}>{currentCost > 0 ? statusText : 'Missing'}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '12px', lineHeight: 1.4 }}>{data.note}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase' }}>Target ({data.percent}%)</span><strong style={{ color: '#555' }}>R {targetCost.toLocaleString()}</strong></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}><span style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase' }}>Current</span><strong style={{ color: currentCost > 0 ? '#333' : '#ccc' }}>R {currentCost.toLocaleString()}</strong></div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Custom builds do not have a preset allocation guide.</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
