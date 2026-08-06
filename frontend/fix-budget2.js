const fs = require('fs');

let code = fs.readFileSync('components/pcbuilder/BudgetTracker.tsx', 'utf8');

const oldLoop = `{sections.map((sec: any) => (
                        <motion.div
                            key={sec.key}
                            initial={{ width: 0 }}
                            animate={{ width: \`\${sec.pct}%\` }}
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
                            title={\`\${sec.label.toUpperCase()} (\${sec.pct.toFixed(1)}%)\`}
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
                    ))}`;

const newLoop = `{sections.map((sec: any, i: number) => {
                        const isHovered = hoveredCategory === sec.key;
                        const isDimmed = hoveredCategory && hoveredCategory !== sec.key;
                        
                        return (
                            <motion.div
                                key={sec.key}
                                initial={{ width: 0 }}
                                animate={{ 
                                    width: \`\${sec.pct}%\`,
                                    scaleY: isHovered ? 1.15 : 1,
                                    opacity: isDimmed ? 0.35 : 1,
                                    zIndex: isHovered ? 10 : 1
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                onMouseEnter={() => setHoveredCategory(sec.key)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                onClick={() => setActiveCategory && setActiveCategory(sec.key)}
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
                                    whiteSpace: "nowrap",
                                    cursor: setActiveCategory ? "pointer" : "default",
                                    boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                                    transformOrigin: "center",
                                    borderTopLeftRadius: i === 0 ? "12px" : "0px",
                                    borderBottomLeftRadius: i === 0 ? "12px" : "0px",
                                    borderTopRightRadius: i === sections.length - 1 ? "12px" : "0px",
                                    borderBottomRightRadius: i === sections.length - 1 ? "12px" : "0px"
                                }}
                                title={\`\${sec.label.toUpperCase()} (\${sec.pct.toFixed(1)}%)\`}
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
                        );
                    })}`;

let result = code.replace(oldLoop.replace(/\r\n/g, '\\n').replace(/\n/g, '\\s*?\\n\\s*'), newLoop);
// If regex fails due to whitespace, we'll try something simpler
if (result === code) {
    // manual slice replace
    const startIdx = code.indexOf('{sections.map((sec: any) => (');
    const endIdx = code.indexOf('</motion.div>', startIdx) + '</motion.div>'.length;
    const finalEnd = code.indexOf('))}', endIdx) + '))}'.length;
    
    if (startIdx !== -1 && finalEnd !== -1) {
        result = code.substring(0, startIdx) + newLoop + code.substring(finalEnd);
    }
}

fs.writeFileSync('components/pcbuilder/BudgetTracker.tsx', result);
console.log('Fixed BudgetTracker loop', result !== code);
