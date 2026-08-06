const fs = require('fs');

let code = fs.readFileSync('pages/pc-builder.tsx', 'utf8');

// 1. Add isModified to State
const stateRegex = /const \[activeCategory, setActiveCategory\] = useState\("cases"\);/;
code = code.replace(stateRegex, \`const [activeCategory, setActiveCategory] = useState("cases");
    const [isModified, setIsModified] = useState(false);\`);

// 2. Reset isModified on profile select
const selectProfileRegex = /const handleProfileSelect = \(profile: any\) => \{[\s\S]*?setSelectedComponents\(profile\.seed\);[\s\S]*?setBuildName\(profile\.name \+ ' Build'\);[\s\S]*?\};/;
code = code.replace(selectProfileRegex, \`const handleProfileSelect = (profile: any) => {
        setActiveProfile(profile);
        setSelectedComponents(profile.seed);
        setBuildName(profile.name === 'Start from Scratch' ? 'My Custom Build' : profile.name);
        setIsModified(profile.isCustom ? true : false);
    };\`);

// 3. Set isModified on toggle
const selectToggleRegex = /const handleSelectToggle = \(category: string, product: any\) => \{[\s\S]*?setSelectedComponents\(\(prev\) => \{/;
code = code.replace(selectToggleRegex, \`const handleSelectToggle = (category: string, product: any) => {
        setIsModified(true);
        setSelectedComponents((prev) => {\`);

// 4. Set isModified on remove
const selectRemoveRegex = /const handleRemove = \(e: React\.MouseEvent, category: string\) => \{[\s\S]*?setSelectedComponents\(\(prev\) => \{/;
code = code.replace(selectRemoveRegex, \`const handleRemove = (e: React.MouseEvent, category: string) => {
        e.stopPropagation();
        setIsModified(true);
        setSelectedComponents((prev) => {\`);


// 5. Build dynamic title name effect: if they haven't modified it, it just stays. If they modified it and the name is the prebuilt's name, add 'Custom ' prefix.
// Let's add a useEffect for that. Wait, the user said "add the custom prefix if a premade is customized". 
// We can do this right inside setIsModified(true) effect, but adding useEffect is cleaner.
const effRegex = /const \[buildName, setBuildName\] = useState\(""\);/;

code = code.replace(effRegex, \`const [buildName, setBuildName] = useState("");

    useEffect(() => {
        if (isModified && activeProfile && !activeProfile.isCustom && buildName === activeProfile.name) {
            setBuildName('Custom ' + activeProfile.name);
        }
    }, [isModified, activeProfile, buildName]);
\`);

// 6. Update the title area
const titleAreaRegex = /<span>System Builder<\/span>[\s\S]*?<input[\s\S]*?outline: "none",[\s\S]*?width: "300px"[\s\S]*?\}\}*?[\s\S]*?onBlur=\{\(e\) => \{[\s\S]*?\}\}[\s\S]*?\/>/;

const newTitleArea = \`<span>System Builder</span>
                        <span style={{color: "#ccc"}}>|</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {isModified && (
                                <EditIcon
                                    fontSize="small"
                                    style={{ color: "#aaa", cursor: "pointer" }}
                                    onClick={() => buildNameInputRef.current?.focus()}
                                />
                            )}
                            <input
                                ref={buildNameInputRef}
                                type="text"
                                value={buildName}
                                onChange={(e) => setBuildName(e.target.value)}
                                placeholder="My Custom Build"
                                disabled={!isModified}
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 600,
                                    padding: "4px 8px",
                                    border: "1px solid transparent",
                                    borderRadius: "4px",
                                    backgroundColor: "transparent",
                                    outline: "none",
                                    transition: "all 0.2s",
                                    cursor: isModified ? "text" : "default",
                                    width: "350px",
                                    color: !isModified ? "#1f7a8c" : "inherit"
                                }}
                                onFocus={(e) => {
                                    if(isModified) {
                                        e.target.style.backgroundColor = "#fff";
                                        e.target.style.border = "1px solid #1f7a8c";
                                    }
                                }}
                                onBlur={(e) => {
                                    if(isModified) {
                                        e.target.style.backgroundColor = "transparent";
                                        e.target.style.border = "1px solid transparent";
                                    }
                                }}
                            />\`;

code = code.replace(titleAreaRegex, newTitleArea);

// 7. Add toolbar buttons: "Reset Parts" & "Back to Prebuilts" 
// We place this next to the Save button
const shareBtnRegex = /\{shareToken && \([\s\S]*?Save as New\s*<\/button>\s*\)\}\s*<\/div>\s*\)\}/;

const newShareBtnArea = \`{shareToken && (
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
                       
                    {/* Toolbar buttons */}
                    <div style={{ display: "flex", gap: "12px", marginLeft: "16px" }}>
                        {(isModified || (activeProfile && activeProfile.isCustom)) && (
                            <button
                                onClick={() => {
                                    if(confirm('Are you sure you want to clear your current parts?')) {
                                        setSelectedComponents({});
                                        setIsModified(true); // Technically already customized
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
                                    router.push('/pc-builder', undefined, { shallow: true });
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
                    </div>

                </div>
            \`;

// Actually we need to replace the entire div that wraps the Save/Share but wait, let's just replace `<div style={{ display: "flex", gap: "12px" }}>` that contains the Save button?
// The outer block is:
/*
<div style={{ display: "flex", alignItems: "center", gap: "16px" }}> ... </div>
<div style={{ display: "flex", gap: "12px" }}> {save buttons} </div>
*/
// It's already wrapped in a flex container with justifyContent: "space-between". We can just inject the new buttons within that space-between layer.

code = code.replace(shareBtnRegex, newShareBtnArea);

fs.writeFileSync('pages/pc-builder.tsx', code);
console.log('done modifying pc-builder');
