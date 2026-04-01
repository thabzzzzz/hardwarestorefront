const fs = require('fs');

let code = fs.readFileSync('pages/pc-builder.tsx', 'utf8');

// 1. Add isModified to State
const stateRegex = /const \[activeCategory, setActiveCategory\] = useState\("cases"\);/;
code = code.replace(stateRegex, `const [activeCategory, setActiveCategory] = useState("cases");
    const [isModified, setIsModified] = useState(false);`);

// 2. Reset isModified on profile select
const selectProfileRegex = /const handleProfileSelect = \(profile: any\) => \{[\s\S]*?setSelectedComponents\(profile\.seed\);[\s\S]*?setBuildName\(profile\.name \+ ' Build'\);[\s\S]*?\};/;
code = code.replace(selectProfileRegex, `const handleProfileSelect = (profile: any) => {
        setActiveProfile(profile);
        setSelectedComponents(profile.seed);
        setBuildName(profile.name === 'Start from Scratch' ? 'My Custom Build' : profile.name + ' Build');
        setIsModified(profile.isCustom ? true : false);
    };`);

// 3. Set isModified on toggle
const selectToggleRegex = /const handleSelectToggle = \(category: string, product: any\) => \{[\s\S]*?setSelectedComponents\(\(prev\) => \{/;
code = code.replace(selectToggleRegex, `const handleSelectToggle = (category: string, product: any) => {
        setIsModified(true);
        setSelectedComponents((prev) => {`);

// 4. Set isModified on remove
const selectRemoveRegex = /const handleRemove = \(e: React\.MouseEvent, category: string\) => \{[\s\S]*?setSelectedComponents\(\(prev\) => \{/;
code = code.replace(selectRemoveRegex, `const handleRemove = (e: React.MouseEvent, category: string) => {
        e.stopPropagation();
        setIsModified(true);
        setSelectedComponents((prev) => {`);


const effRegex = /const \[buildName, setBuildName\] = useState\(""\);/;
code = code.replace(effRegex, `const [buildName, setBuildName] = useState("");

    React.useEffect(() => {
        if (isModified && activeProfile && !activeProfile.isCustom && buildName === activeProfile.name + ' Build') {
            setBuildName('Custom ' + activeProfile.name + ' Build');
        }
    }, [isModified, activeProfile, buildName]);`);

code = code.replace(/<EditIcon[\s\S]*?onClick=\{\(\) => buildNameInputRef\.current\?\.focus\(\)\}[\s\S]*?\/>/, `{isModified && <EditIcon fontSize="small" style={{ color: "#aaa", cursor: "pointer" }} onClick={() => buildNameInputRef.current?.focus()} />}`);

code = code.replace(/<input\s*ref=\{buildNameInputRef\}\s*type="text"\s*value=\{buildName\}/, `<input ref={buildNameInputRef} type="text" value={buildName} disabled={!isModified}`);

code = code.replace(/cursor: "pointer",/, 'cursor: isModified ? "text" : "default",');

code = code.replace(/onFocus=\{\(e\) => \{[\s\S]*?e.target.style.border = "1px solid #1f7a8c";[\s\S]*?\}\}/, `onFocus={(e) => { if(isModified) { e.target.style.backgroundColor = "#fff"; e.target.style.border = "1px solid #1f7a8c"; } }}`);

code = code.replace(/onBlur=\{\(e\) => \{[\s\S]*?e.target.style.border = "1px solid transparent";[\s\S]*?\}\}/, `onBlur={(e) => { if(isModified) { e.target.style.backgroundColor = "transparent"; e.target.style.border = "1px solid transparent"; } }}`);


// buttons
const rightSideButtons = `
                            {shareToken && (
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#f4f4f6",
                                        color: "#1f7a8c",
                                        border: "1px solid #1f7a8c",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        cursor: isSaving ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Save as New
                                </button>
                            )}
                        </div>
                    )}
                       
                    <div style={{ display: "flex", gap: "12px", marginLeft: user ? "16px" : "auto" }}>
                        {(isModified || (activeProfile && activeProfile.isCustom)) && (
                            <button
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
                            </button>
                        )}
                        <button
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
                        </button>
                    </div>`;

const shareBtnRegex = /\{shareToken && \([\s\S]*?Save as New\s*<\/button>\s*\)\}\s*<\/div>\s*\)\}/;
code = code.replace(shareBtnRegex, rightSideButtons);

fs.writeFileSync('pages/pc-builder.tsx', code);
