import React from 'react';
import { motion } from 'framer-motion';

import EditIcon from '@mui/icons-material/Edit.js';

export const BudgetTracker = ({ selectedComponents, targetBudget, activeProfile, setActiveCategory, onUpdateBudget }: any) => {
    const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null);
    const [isEditingBudget, setIsEditingBudget] = React.useState(false);        
    const [budgetInput, setBudgetInput] = React.useState((targetBudget / 100).toString());

    React.useEffect(() => {
        setBudgetInput((targetBudget / 100).toString());
    }, [targetBudget]);

    const handleBudgetSubmit = (e: React.KeyboardEvent | React.FocusEvent) => { 
        if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
        setIsEditingBudget(false);
        const parsed = parseFloat(budgetInput.replace(/,/g, ''));
        if (!isNaN(parsed) && parsed >= 0) {
            onUpdateBudget?.(parsed * 100);
        } else {
            setBudgetInput((targetBudget / 100).toString());
        }
    };
    const totalCents = Object.values(selectedComponents).reduce((sum: number, part: any): number => {
        if (!part) return sum;
        return sum + (part.current_price?.amount_cents || part.price?.amount_cents || 0);
    }, 0) as number;

    const effectiveTotalCents = targetBudget > 0 ? targetBudget : Math.max(totalCents as number, 1);
    const percentTotal = targetBudget > 0 ? Math.min(((totalCents as number) / targetBudget) * 100, 100) : (totalCents > 0 ? 100 : 0);
    const isOver = targetBudget === 0 ? false : (totalCents as number) > targetBudget;

    const sections = Object.keys(selectedComponents).map(key => {
        const item = selectedComponents[key];
        if (!item) return null;
        const price = item.current_price?.amount_cents || item.price?.amount_cents || 0;
        const pct = (price / effectiveTotalCents) * 100;
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
        if (key === 'hdds') { color = '#3f51b5'; label = 'HDD'; }
        if (key === 'coolers') { color = '#00bcd4'; label = 'SYSTEM COOLING'; } 

        return { key, pct, label, color, price };
    }).filter(Boolean) as any[];

    const totalPct = sections.reduce((acc, sec: any) => acc + sec.pct, 0);
    const remainingPct = Math.max(0, 100 - totalPct);

    const displaySections = [...sections];
    if (targetBudget > 0 && remainingPct > 0.1) {
        displaySections.push({
            key: 'free',
            pct: remainingPct,
            label: 'AVAILABLE', // Other options: 'HEADROOM', 'REMAINING', 'UNALLOCATED'
            color: '#e0e0e0',
            isSpecial: true,
            price: targetBudget - (totalCents as number)
        });
    }

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    let currentOffset = 0;


    return (
        <div className="budget-tracker-container" style={{ marginBottom: "0px", background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <style>{`
                .budget-tracker-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 15px; flex-wrap: wrap; gap: 8px; }
                .budget-desktop-view { display: block; padding-top: 12px; }
                .budget-tracker-bar { height: 48px; background: #f0f0f0; border-radius: 12px; display: flex; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 16px; overflow: hidden; }
                
                .budget-mobile-view { display: none; padding-top: 16px; }
                .mobile-donut-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: stretch; }
                .donut-chart-wrapper { position: relative; width: 100%; max-width: 220px; margin: 0 auto; aspect-ratio: 1; }
                .donut-text-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }

                @media (max-width: 900px) {
                    .budget-tracker-header { flex-direction: column; align-items: flex-start; gap: 16px; }
                    .budget-metric-container { flex-direction: column !important; align-items: flex-start !important; gap: 2px !important; }
                    .budget-tracker-container { padding: 16px; }
                    .budget-desktop-view { display: none; }
                    .budget-mobile-view { display: block; padding-bottom: 8px; }
                }
                @media (max-width: 550px) {
                    .mobile-donut-container { grid-template-columns: 1fr; gap: 32px; }
                }
            `}</style>
            <div className="budget-tracker-header">
                <span className="budget-metric-container" style={{ fontWeight: 600, color: "#333", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>{activeProfile?.name} Target:</span>
                    {isEditingBudget ? (
                        <div style={{ display: "flex", alignItems: "center" }}> 
                            <span style={{ fontWeight: 800, fontSize: "16px", marginRight: "4px" }}>R</span>
                            <input
                                autoFocus
                                type="text"
                                value={budgetInput}
                                onChange={(e) => setBudgetInput(e.target.value.replace(/[^0-9.]/g, ''))}
                                onBlur={handleBudgetSubmit}
                                onKeyDown={handleBudgetSubmit}
                                style={{
                                    fontWeight: 800,
                                    fontSize: "16px",
                                    width: "100px",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    border: "1px solid #1f7a8c",
                                    outline: "none"
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "4px" }}
                            onClick={() => setIsEditingBudget(true)}
                        >
                            <span style={{ fontWeight: 800, fontSize: "16px" }}>                                {targetBudget === 0 ? "Unlimited" : `R ${(targetBudget / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                            <EditIcon fontSize="small" style={{ color: "#aaa", fontSize: "14px" }} />
                        </div>
                    )}
                </span>
                <span className="budget-metric-container" style={{ fontWeight: 700, color: isOver && targetBudget > 0 ? "#d32f2f" : "#2e7d32", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span>Total:</span>
                    <span style={{ fontWeight: 800, fontSize: "16px", display: "flex", alignItems: "center" }}>
                        R {(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        {isOver && targetBudget > 0 && <span style={{ fontSize: "14px", fontWeight: 600, marginLeft: "6px" }}>(Over Budget)</span>}
                    </span>
                </span>
            </div>

            {/* Desktop Horizontal Bar */}
            <div className="budget-desktop-view">
                <div className="budget-tracker-bar" style={{ display: "flex", width: "100%" }}>
                    <motion.div style={{ display: "flex", width: "100%", height: "100%" }}>
                        {displaySections.map((sec: any, i: number) => {
                            const isHovered = hoveredCategory === sec.key;
                            const isDimmed = hoveredCategory && hoveredCategory !== sec.key;

                            return (
                                <motion.div
                                    key={sec.key}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${sec.pct}%`,
                                        scaleY: isHovered ? 1.15 : 1,
                                        opacity: isDimmed ? 0.35 : 1,
                                        zIndex: isHovered ? 10 : 1
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    onMouseEnter={() => setHoveredCategory(sec.key)}                                
                                    onMouseLeave={() => setHoveredCategory(null)}   
                                    onClick={() => {
                                        if (setActiveCategory && sec.key !== 'free') {
                                            setActiveCategory(sec.key);
                                            const picker = document.getElementById('part-picker');
                                            if (picker) {
                                                picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }
                                    }}
                                    style={{
                                        background: sec.color,
                                        height: "100%",
                                        position: "relative",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: sec.key === 'free' ? "#666" : "#fff",                                    borderRight: "1px solid rgba(255,255,255,0.2)",
                                        overflow: "visible",
                                        whiteSpace: "nowrap",
                                        cursor: (setActiveCategory && sec.key !== 'free') ? "pointer" : "default",
                                        boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                                        transformOrigin: "center",
                                        borderTopLeftRadius: i === 0 ? "12px" : "0px",
                                        borderBottomLeftRadius: i === 0 ? "12px" : "0px",
                                        borderTopRightRadius: i === displaySections.length - 1 ? "12px" : "0px",
                                        borderBottomRightRadius: i === displaySections.length - 1 ? "12px" : "0px"
                                    }}

                                >
                                    {sec.pct >= 5 && (
                                        <>
                                            <span style={{ fontSize: "11px", fontWeight: 700, pointerEvents: "none" }}>
                                                {sec.label.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.9, pointerEvents: "none" }}>
                                                {sec.pct.toFixed(0)}%
                                            </span>
                                        </>
                                    )}
                                    {isHovered && sec.pct < 5 && sec.key !== 'free' && (
                                        <div style={{
                                            position: "absolute",
                                            bottom: "110%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            background: "#333",
                                            color: "#fff",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            zIndex: 100,
                                            pointerEvents: "none"
                                        }}>
                                            {sec.label.toUpperCase()} ({sec.pct.toFixed(1)}%)
                                        </div>
                                    )}
                                    {isHovered && sec.key === 'free' && (
                                        <div style={{
                                            position: "absolute",
                                            bottom: "110%",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            background: "#333",
                                            color: "#fff",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            zIndex: 100,
                                            pointerEvents: "none"
                                        }}>
                                            R {((targetBudget - totalCents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Remaining
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", justifyContent: "center" }}>
                    {displaySections.map((sec: any) => (
                        <div key={sec.key} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: sec.color }}></div>
                            <span style={{ fontWeight: 600, color: "#444" }}>{sec.label.toUpperCase()}</span>
                            <span style={{ color: "#777" }}>{sec.pct.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Donut Chart */}
            <div className="budget-mobile-view">
                <div className="mobile-donut-container">
                    <div className="donut-chart-wrapper">
                        <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)", overflow: "visible" }}>
                            <circle cx="60" cy="60" r="50" fill="transparent" stroke="#f4f4f6" strokeWidth="20" />
                            {displaySections.map((sec: any) => {
                                if (sec.pct === 0) return null;
                                const strokeDasharray = `${(sec.pct / 100) * circumference} ${circumference}`;
                                const strokeDashoffset = -currentOffset;
                                currentOffset += (sec.pct / 100) * circumference;
                                
                                const isHovered = hoveredCategory === sec.key;
                                const isDimmed = hoveredCategory && hoveredCategory !== sec.key;

                                return (
                                    <circle
                                        key={`donut-${sec.key}`}
                                        cx="60" cy="60" r="50"
                                        fill="transparent"
                                        stroke={sec.color}
                                        strokeWidth={isHovered ? "22" : "20"}
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        style={{ transition: "all 0.3s ease", opacity: isDimmed ? 0.35 : 1, cursor: sec.isSpecial ? "default" : "pointer" }}
                                        onMouseEnter={() => setHoveredCategory(sec.key)}
                                        onMouseLeave={() => setHoveredCategory(null)}
                                        onClick={() => {
                                            if (setActiveCategory && sec.key !== 'free') {
                                                setActiveCategory(sec.key);
                                                const picker = document.getElementById('part-picker');
                                                if (picker) {
                                                    picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }
                                            }
                                        }}
                                    />
                                );
                            })}
                        </svg>
                        <div className="donut-text-center">
                            <span style={{ fontSize: "14px", color: "#666", fontWeight: 600 }}>Total</span>
                            <span style={{ fontSize: "16px", fontWeight: 800, color: "#333", marginTop: "2px" }}>
                                R {(totalCents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>
                
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {displaySections.map((sec) => {
                            if (sec.pct === 0) return null;
                            const isHovered = hoveredCategory === sec.key;
                            return (
                                <div 
                                    key={`legend-${sec.key}`} 
                                    style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        backgroundColor: isHovered ? "#f4f4f6" : "#fff",
                                        border: "1px solid",
                                        borderColor: isHovered ? sec.color : "#eaeaea",
                                        borderRadius: "6px",
                                        transition: "all 0.2s",
                                        cursor: sec.isSpecial ? "default" : "pointer"
                                    }}
                                    onMouseEnter={() => setHoveredCategory(sec.key)}
                                    onMouseLeave={() => setHoveredCategory(null)}
                                    onClick={() => {
                                        if (setActiveCategory && sec.key !== 'free') {
                                            setActiveCategory(sec.key);
                                            const picker = document.getElementById('part-picker');
                                            if (picker) {
                                                picker.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "14px", height: "14px", borderRadius: "4px", backgroundColor: sec.color }} />
                                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#333" }}>{sec.label}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, fontSize: "14px", color: "#111" }}>
                                        {sec.isSpecial 
                                            ? `R ${(((targetBudget - totalCents) || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                            : `R ${(sec.price / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                        }
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};