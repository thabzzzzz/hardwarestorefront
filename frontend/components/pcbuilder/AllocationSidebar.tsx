import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const AllocationSidebar = ({ activeProfile, selectedComponents }: any) => {
    if (!activeProfile) return null;

    const COMPONENT_NAMES: Record<string, string> = {
        gpus: "Graphics Card",
        cpus: "Processor",
        motherboards: "Motherboard",
        cases: "Chassis",
        psus: "Power Supply",
        memory: "Memory",
        storage: "Storage",
        coolers: "Cooling",
        "system-coolers": "System Cooling",
        ssds: "SSD",
        hdds: "HDD",
        os: "Operating System"
    };

    const sections = activeProfile.allocation;
    const targetTotal = activeProfile.targetBudget;

    const currentTotal = Object.values(selectedComponents).reduce((sum: number, part: any): number => {
        if (!part) return sum;
        return sum + (part.current_price?.amount_cents || part.price?.amount_cents || 0);
    }, 0) as number;

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
                width: '320px',
                background: '#ffffff',
                padding: '24px',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                height: 'fit-content',
                position: 'sticky',
                top: '270px'
            }}
        >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#333' }}>
                Budget Allocation
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.5, margin: 0 }}>
                Here is why we prioritized specific components for {activeProfile.name}.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(sections).map(([key, data]: any) => {
                    const targetCost = targetTotal * (data.percent / 100);
                    const currentPart = selectedComponents[key];
                    const currentCost = currentPart ? (currentPart.current_price?.amount_cents || currentPart.price?.amount_cents || 0) : 0;
                    
                    const isOver = currentCost > targetCost * 1.15; // 15% tolerance
                    const isUnder = currentCost < targetCost * 0.85;

                    let statusColor = '#4caf50'; // Green = Good match
                    let statusText = 'On Target';
                    if (isOver) { statusColor = '#f44336'; statusText = 'Over Budget'; }
                    else if (isUnder && currentCost > 0) { statusColor = '#ff9800'; statusText = 'Below Target'; }

                    return (
                        <div key={key} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, textTransform: 'capitalize', color: '#444' }}>{COMPONENT_NAMES[key.toLowerCase()] || key}</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: statusColor, background: `${statusColor}11`, padding: '4px 8px', borderRadius: '4px' }}>
                                    {currentCost > 0 ? statusText : 'Missing'}
                                </span>
                            </div>
                            
                            <p style={{ fontSize: '0.85rem', color: '#777', marginBottom: '12px', lineHeight: 1.4 }}>
                                {data.note}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase' }}>Target ({data.percent}%)</span>
                                    <strong style={{ color: '#555' }}>R {(targetCost/100).toLocaleString()}</strong>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                                    <span style={{ color: '#aaa', fontSize: '0.75rem', textTransform: 'uppercase' }}>Current</span>
                                    <strong style={{ color: currentCost > 0 ? '#333' : '#ccc' }}>R {(currentCost/100).toLocaleString()}</strong>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
};