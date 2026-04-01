import React from 'react';
import { motion } from 'framer-motion';

export const BudgetTracker = ({ selectedComponents, targetBudget, activeProfile }: any) => {
    const totalCents = Object.values(selectedComponents).reduce((sum: number, part: any): number => {
        if (!part) return sum;
        return sum + (part.current_price?.amount_cents || part.price?.amount_cents || 0);
    }, 0) as number;

    const percentTotal = Math.min(((totalCents as number) / targetBudget) * 100, 100);
    const isOver = (totalCents as number) > targetBudget;

    const sections = Object.keys(selectedComponents).map(key => {
        const item = selectedComponents[key];
        if (!item) return null;
        const price = item.current_price?.amount_cents || item.price?.amount_cents || 0;
        const pct = (price / targetBudget) * 100;
        if (pct === 0) return null;
        
        let color = '#4caf50';
        let label = key;
        if (key === 'gpus') { color = '#9c27b0'; label = 'GPU'; }
        if (key === 'cpus') { color = '#2196f3'; label = 'CPU'; }
        if (key === 'motherboards') { color = '#ff9800'; label = 'MOBO'; }
        if (key === 'ram') { color = '#f44336'; label = 'RAM'; }
        if (key === 'cases') { color = '#607d8b'; label = 'CASE'; }
        if (key === 'psus') { color = '#795548'; label = 'PSU'; }
        if (key === 'ssds') { color = '#009688'; label = 'SSD'; }
        if (key === 'coolers') { color = '#00bcd4'; label = 'SYSTEM COOLING'; }

        return { key, pct, label, color };
    }).filter(Boolean);

    return (
        <div style={{ marginBottom: "24px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: 600, color: "#333" }}>{activeProfile?.name} Target: R {(targetBudget / 100).toLocaleString()}</span>
                <span style={{ fontWeight: 700, color: isOver ? "#d32f2f" : "#2e7d32" }}>
                    Total: R {(totalCents / 100).toLocaleString()}
                    {isOver && " (Over Budget)"}
                </span>
            </div>
            
            <div style={{ height: "48px", background: "#f0f0f0", borderRadius: "12px", overflow: "hidden", display: "flex", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)", marginBottom: "16px" }}>
                <motion.div style={{ display: "flex", width: "100%", height: "100%" }}>
                    {sections.map((sec: any) => (
                        <motion.div
                            key={sec.key}
                            initial={{ width: 0 }}
                            animate={{ width: `${sec.pct}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            style={{
                                background: sec.color,
                                height: "100%",
                                position: "relative",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                borderRight: "1px solid rgba(255,255,255,0.2)",
                                overflow: "hidden",
                                whiteSpace: "nowrap"
                            }}
                            title={`${sec.label.toUpperCase()} (${sec.pct.toFixed(1)}%)`}
                            whileHover={{ filter: "brightness(1.1)" }}
                        >
                            {sec.pct >= 5 && (
                                <>
                                    <span style={{ fontSize: "11px", fontWeight: 700 }}>
                                        {sec.label.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.9 }}>
                                        {sec.pct.toFixed(0)}%
                                    </span>
                                </>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", justifyContent: "center" }}>
                {sections.map((sec: any) => (
                    <div key={sec.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: sec.color }}></div>
                        <span style={{ fontWeight: 600, color: "#444" }}>{sec.label.toUpperCase()}</span>
                        <span style={{ color: "#777" }}>{sec.pct.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
