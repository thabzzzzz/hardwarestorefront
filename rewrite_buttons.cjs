const fs = require('fs');

const path = 'c:/Users/Thabiso/projects/HWStore/hardwarestore/frontend/components/pcbuilder/BuilderWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

function doEdits() {
    // 1. Add state variable
    if (!content.includes('isFabOpen')) {
        content = content.replace(
            'const [activeTab, setActiveTab] = useState<"edit" | "overview">("edit");',
            'const [activeTab, setActiveTab] = useState<"edit" | "overview">("edit");\n    const [isFabOpen, setIsFabOpen] = useState(false);'
        );
    }

    // 2. We need to extract the buttons. Let's find the start and end of the div.   
    const startDiv = '<div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>';
    
    const startIndex = content.indexOf(startDiv);
    if (startIndex === -1) {
        console.error("Start div not found");
        return;
    }
    
    // We need to find the matching closing div for startIndex
    let idx = startIndex;
    let divCount = 0;
    let endIndex = -1;
    
    while (idx < content.length) {
        if (content.substring(idx, idx + 4) === '<div') {
            divCount++;
        } else if (content.substring(idx, idx + 5) === '</div') {
            divCount--;
            if (divCount === 0) {
                endIndex = idx + 6; // exclude the new line 
                break;
            }
        }
        idx++;
    }
    
    if (endIndex === -1) {
        console.error("End div not found");
        return;
    }
    
    const innerContent = content.substring(startIndex, endIndex);
    
    // Now we replace this with the new structure.
    const replacement = `
                        <div className="desktop-action-btns" style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
                            {renderActionButtons(false)}
                        </div>`;
    
    content = content.replace(innerContent, replacement);
    
    // Define the function just before return
    const renderActionFunction = `
        const renderActionButtons = (isFab: boolean) => {
            const btnStyle: React.CSSProperties = isFab 
                ? {
                    padding: "10px 16px", minHeight: "44px", boxSizing: "border-box", 
                    backgroundColor: "#1f7a8c", color: "white", border: "none", borderRadius: "22px",
                    fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center",
                    gap: "6px", transition: "all 0.15s ease-in-out", fontFamily: "inherit", fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)", whiteSpace: "nowrap" as const
                }
                : {
                    padding: "17px 16px", height: "54px", boxSizing: "border-box",
                    backgroundColor: "#1f7a8c", color: "white", border: "none", borderRadius: "8px",
                    fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center",
                    gap: "6px", transition: "all 0.15s ease-in-out", fontFamily: "inherit", fontSize: "14px",
                };
    
            // We can capture the mouse events:
            const hoverEffects = isFab ? {
                // Mobile buttons don't really need hover translateY, but they get active state
                onMouseEnter: (e: any) => {},
                onMouseLeave: (e: any) => {}
            } : {
                onMouseEnter: (e: any) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 12px rgba(31, 122, 140, 0.4)";
                },
                onMouseLeave: (e: any) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                }
            };
    
            return (
                <React.Fragment>
                    {(isModified || (activeProfile && activeProfile.isCustom)) && (
                        <button
                            onClick={() => {
                                if (activeProfile && activeProfile.id && activeProfile.id !== 'custom') {
                                    const baseProfile = BUILD_PROFILES[activeProfile.id.replace('custom_', '')];
                                    if (baseProfile) {
                                        setActiveProfile(JSON.parse(JSON.stringify(baseProfile)));
                                        setSelectedComponents(baseProfile.seed || {});
                                        setBuildName(baseProfile.name);
                                        setIsModified(false);
                                        toast.success("Reverted back to base configuration");
                                        return;
                                    }
                                }
                                setSelectedComponents({});
                                markAsCustomModified();
                                toast.success("Build parts cleared");
                                if (isFab) setIsFabOpen(false);
                            }}
                            style={btnStyle}
                            {...hoverEffects}
                        >
                            {activeProfile && activeProfile.id && activeProfile.id !== 'custom' ? (
                                <><RefreshIcon fontSize="small" /> Reset to Defaults</>
                            ) : (
                                <><DeleteOutlineIcon fontSize="small" /> Clear Parts</>
                            )}
                        </button>
                    )}
    
                    {user && (
                        <React.Fragment>
                            {shareToken && (
                                <button
                                    onClick={() => { handleSave(true); if(isFab) setIsFabOpen(false); }}
                                    disabled={isSaving}
                                    style={{ ...btnStyle, cursor: isSaving ? "not-allowed" : "pointer" }}
                                    {...hoverEffects}
                                >
                                    <SaveIcon fontSize="small" /> Save as New
                                </button>
                            )}
                            <button
                                onClick={() => { handleSave(false); if(isFab) setIsFabOpen(false); }}
                                disabled={isSaving}
                                style={{ ...btnStyle, cursor: isSaving ? "not-allowed" : "pointer" }}
                                {...hoverEffects}
                            >
                                <SaveIcon fontSize="small" /> {isSaving ? "Saving..." : "Save Build"}
                            </button>
                        </React.Fragment>
                    )}
    
                    {(!shareToken && activeProfile && !activeProfile.isCustom) && (
                        <button
                            onClick={() => { setIsModalOpen(true); if(isFab) setIsFabOpen(false); }}
                            style={btnStyle}
                            {...hoverEffects}
                        >
                            <InfoIcon style={{ marginRight: "6px", fontSize: "18px" }} /> Info
                        </button>
                    )}
                </React.Fragment>
            );
        };
    `;
    
    if (!content.includes('const renderActionButtons = (isFab: boolean) => {')) {
        content = content.replace(
            /(return \(\s*<div\b)/,
            renderActionFunction + '\n    $1'
        );
    }
    
    // Ensure icons are imported
    if (!content.includes('import CloseIcon ')) {
        content = content.replace('import InfoIcon ', 'import CloseIcon from "@mui/icons-material/Close";\nimport InfoIcon ');
    }
    if (!content.includes('import MoreVertIcon ')) {
        content = content.replace('import CloseIcon ', 'import MoreVertIcon from "@mui/icons-material/MoreVert";\nimport CloseIcon ');
    }
    
    // 3. Inject CSS
    const newCssRules = `
                        /* Floating Action Button (FAB) styles */
                        .fab-wrapper { display: none !important; }
    
                        @media (max-width: 900px) {
                            .desktop-action-btns { display: none !important; }
                            .fab-wrapper { display: block !important; }
                            
                            .fab-overlay {
                                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                                background: rgba(0,0,0,0.5); z-index: 9998;
                                opacity: 0; pointer-events: none; transition: opacity 0.2s;
                            }
                            .fab-overlay.open { opacity: 1; pointer-events: auto; }
                            
                            .fab-container {
                                position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                                display: flex; flex-direction: column; align-items: flex-end; gap: 16px;
                            }
                            
                            .fab-menu {
                                display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
                                transform: translateY(20px) scale(0.9); opacity: 0; pointer-events: none;
                                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s;
                                transform-origin: bottom right;
                            }
                            .fab-menu.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }
                            
                            .fab-trigger {
                                width: 56px; height: 56px; border-radius: 28px;
                                background-color: #1f7a8c; color: white; border: none;
                                box-shadow: 0 4px 12px rgba(31,122,140,0.4);
                                display: flex; align-items: center; justify-content: center;
                                cursor: pointer; transition: transform 0.2s, background-color 0.2s;
                            }
                            .fab-trigger:active { transform: scale(0.95); }
                        }
    `;
    
    if (!content.includes('Floating Action Button (FAB) styles')) {
        // Just inject into the style tag
        content = content.replace(
            /(<style>\{`)/,
            `$1${newCssRules}`
        );
    }
    
    // 4. Inject FAB DOM just before the closing </div> of the main page.
    const fabDom = `
                {/* Mobile Floating Action Button */}
                <div className="fab-wrapper">
                    <div 
                        className={\`fab-overlay \${isFabOpen ? 'open' : ''}\`} 
                        onClick={() => setIsFabOpen(false)}
                    />
                    <div className="fab-container">
                        <div className={\`fab-menu \${isFabOpen ? 'open' : ''}\`}>
                            {renderActionButtons(true)}
                        </div>
                        <button 
                            className="fab-trigger"
                            onClick={() => setIsFabOpen(!isFabOpen)}
                            aria-label="Toggle Actions"
                        >
                            {isFabOpen ? <CloseIcon style={{ fontSize: "24px" }} /> : <MoreVertIcon style={{ fontSize: "24px" }} />}
                        </button>
                    </div>
                </div>
    `;
    
    if (!content.includes('Mobile Floating Action Button')) {
        // Assume last closing </div> is for the page
        const lastDivIndex = content.lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            content = content.substring(0, lastDivIndex) + fabDom + content.substring(lastDivIndex);
        }
    }
    
    fs.writeFileSync(path, content, 'utf8');
    console.log('Script completed successfully!');
}

try {
    doEdits();
} catch(e) {
    console.error(e);
}
