const fs = require('fs');

let code = fs.readFileSync('pages/pc-builder.tsx', 'utf8');

// Fix input field
code = code.replace(/width: "300px"/g, \`width: "400px",
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap"\`);

// Fix Change Tier
const oldChange = \`<button
                            onClick={() => {
                                if (!isModified || confirm('You will lose your custom changes. Are you sure you want to go back?')) {
                                    setActiveProfile(null);
                                    router.replace('/pc-builder', undefined, { shallow: true });
                                }
                            }}
                            style={{
                                padding: "8px 16px",
                                backgroundColor: "#e2e8f0",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontSize: "14px"
                            }}
                        >
                            Change Tier
                        </button>\`;
const newChange = \`<button
                            onClick={() => {
                                if (!isModified || confirm('You will lose your custom changes. Are you sure you want to go back?')) {
                                    setActiveProfile(null);
                                    router.replace('/pc-builder', undefined, { shallow: true });
                                }
                            }}
                            style={{
                                padding: "0 24px",
                                backgroundColor: "transparent",
                                color: "#1f7a8c",
                                border: "1px solid rgba(31, 122, 140, 0.5)",
                                borderRadius: "10px",
                                fontWeight: 700,
                                cursor: "pointer",
                                fontSize: "14px",
                                height: "44px",
                                textTransform: "none",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.border = "1px solid #1f7a8c";
                                e.currentTarget.style.backgroundColor = "rgba(31, 122, 140, 0.04)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.border = "1px solid rgba(31, 122, 140, 0.5)";
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            Change Tier
                        </button>\`;
code = code.replace(oldChange, newChange);

// Fix Clear Parts
const oldClear = \`<button
                                onClick={() => {
                                    if(confirm('Are you sure you want to clear your current parts?')) {
                                        setSelectedComponents({});
                                        setIsModified(true);
                                    }
                                }}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#fff",
                                    color: "#d32f2f",
                                    border: "1px solid #d32f2f",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "14px"
                                }}
                            >
                                Clear Parts
                            </button>\`;
const newClear = \`<button
                                onClick={() => {
                                    if(confirm('Are you sure you want to clear your current parts?')) {
                                        setSelectedComponents({});
                                        setIsModified(true);
                                    }
                                }}
                                style={{
                                    padding: "0 24px",
                                    backgroundColor: "transparent",
                                    color: "#d32f2f",
                                    border: "1px solid rgba(211, 47, 47, 0.5)",
                                    borderRadius: "10px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    height: "44px",
                                    textTransform: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.border = "1px solid #d32f2f";
                                    e.currentTarget.style.backgroundColor = "rgba(211, 47, 47, 0.04)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.border = "1px solid rgba(211, 47, 47, 0.5)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                }}
                            >
                                Clear Parts
                            </button>\`;
code = code.replace(oldClear, newClear);

fs.writeFileSync('pages/pc-builder.tsx', code);
