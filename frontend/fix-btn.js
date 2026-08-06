const fs = require('fs');

let code = fs.readFileSync('pages/pc-builder.tsx', 'utf8');

const regex = /<button[\s\S]*?Change Tier[\s\S]*?<\/button>/;
const matched = code.match(regex);

if (matched) {
    const newBtn = `<button
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
                        </button>`;
    
    code = code.replace(regex, newBtn);
    fs.writeFileSync('pages/pc-builder.tsx', code);
    console.log('Fixed Change Tier style');
} else {
    console.log('Could not find Change Tier button');
}

// ALSO let's do the same for Clear Parts 
// Make it a secondary red button

const clearRegex = /<button[\s\S]*?Clear Parts[\s\S]*?<\/button>/;
const clearMatch = code.match(clearRegex);
if(clearMatch) {
    const newClearBtn = `<button
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
                            </button>`;
    code = code.replace(clearRegex, newClearBtn);
    fs.writeFileSync('pages/pc-builder.tsx', code);
    console.log('Fixed Clear Parts style');
}
