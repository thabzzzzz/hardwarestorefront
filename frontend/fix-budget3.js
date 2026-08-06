const fs = require('fs');

let code = fs.readFileSync('components/pcbuilder/BudgetTracker.tsx', 'utf8');

const regexMap = /const sections = Object\.keys\(selectedComponents\)\.map\(key => \{[\s\S]*?\}\)\.filter\(Boolean\);/;

const newMap = `const sections = Object.keys(selectedComponents).map(key => {
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

    const totalPct = sections.reduce((acc, sec: any) => acc + sec.pct, 0);
    const remainingPct = 100 - totalPct;
    
    const displaySections = [...sections];
    if (remainingPct > 0.1) {
        displaySections.push({
            key: 'free',
            pct: remainingPct,
            label: 'AVAILABLE', // Other options: 'HEADROOM', 'REMAINING', 'UNALLOCATED'
            color: '#e0e0e0',
            isSpecial: true
        });
    }
`;

code = code.replace(regexMap, newMap);

const oldMapIter = `{sections.map((sec: any, i: number) => {`;
const newMapIter = `{displaySections.map((sec: any, i: number) => {`;
code = code.replace(oldMapIter, newMapIter);

const oldMapIterLegend = `{sections.map((sec: any) => (`;
const newMapIterLegend = `{displaySections.map((sec: any) => (`;
code = code.replace(oldMapIterLegend, newMapIterLegend);

const oldStyle = `style={{
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
                                    whiteSpace: "nowrap",
                                    cursor: setActiveCategory ? "pointer" : "default",
                                    boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                                    transformOrigin: "center",
                                    borderTopLeftRadius: i === 0 ? "12px" : "0px",
                                    borderBottomLeftRadius: i === 0 ? "12px" : "0px",
                                    borderTopRightRadius: i === sections.length - 1 ? "12px" : "0px",
                                    borderBottomRightRadius: i === sections.length - 1 ? "12px" : "0px"
                                }}`;

const newStyle = `style={{
                                    background: sec.color,
                                    height: "100%",
                                    position: "relative",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: sec.key === 'free' ? "#666" : "#fff",
                                    borderRight: "1px solid rgba(255,255,255,0.2)",
                                    overflow: "visible",
                                    whiteSpace: "nowrap",
                                    cursor: (setActiveCategory && sec.key !== 'free') ? "pointer" : "default",
                                    boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                                    transformOrigin: "center",
                                    borderTopLeftRadius: i === 0 ? "12px" : "0px",
                                    borderBottomLeftRadius: i === 0 ? "12px" : "0px",
                                    borderTopRightRadius: i === displaySections.length - 1 ? "12px" : "0px",
                                    borderBottomRightRadius: i === displaySections.length - 1 ? "12px" : "0px"
                                }}`;
code = code.replace(oldStyle, newStyle);

const titleRemoveRegex = /title={\`\$\{sec\.label\.toUpperCase\(\)\} \(\$\{sec\.pct\.toFixed\(1\)\}\%\)\`}/;
code = code.replace(titleRemoveRegex, '');

const oldInnerElements = `{sec.pct >= 5 && (
                                    <>
                                        <span style={{ fontSize: "11px", fontWeight: 700 }}>
                                            {sec.label.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: "10px", fontWeight: 600, opacity: 0.9 }}>
                                            {sec.pct.toFixed(0)}%
                                        </span>
                                    </>
                                )}`;

const newInnerElements = `{sec.pct >= 5 && (
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
                                        R {((targetBudget - totalCents) / 100).toLocaleString()} Remaining
                                    </div>
                                )}`;
code = code.replace(oldInnerElements, newInnerElements);

fs.writeFileSync('components/pcbuilder/BudgetTracker.tsx', code);
console.log('Done replacement');
