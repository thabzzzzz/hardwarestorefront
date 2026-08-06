const fs = require('fs');

let code = fs.readFileSync('pages/pc-builder.tsx', 'utf8');

const regex = /<div style=\{\{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" \}\}>([\s\S]*?)<\/div>\s*<\/div>\s*\{?\/\* BUDGET TRACKER \*\/?\}/;

let match = code.match(regex);
if (!match) {
    console.log("No match");
    process.exit();
}

let buttonsBlock = match[1];

let unifiedStyle = `style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#1f7a8c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}`;

let unifiedStyleSaving = `style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#1f7a8c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    cursor: isSaving ? "not-allowed" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}`;

// Clear Parts
buttonsBlock = buttonsBlock.replace(/style=\{\{\s*padding: "0 24px",\s*backgroundColor: "transparent",[\s\S]*?transition: "all 0.2s"\s*\}\}/g, unifiedStyle);
buttonsBlock = buttonsBlock.replace(/onMouseEnter=\{[\s\S]*?\}\s*\}\}/g, '');
buttonsBlock = buttonsBlock.replace(/onMouseLeave=\{[\s\S]*?\}\s*\}\}/g, '');

// Save as New
buttonsBlock = buttonsBlock.replace(/style=\{\{\s*padding: "8px 16px",\s*backgroundColor: "#f4f4f6",[\s\S]*?cursor: isSaving \? "not-allowed" : "pointer"\s*\}\}/g, unifiedStyleSaving);

// Save Build
buttonsBlock = buttonsBlock.replace(/style=\{\{\s*padding: "8px 16px",\s*backgroundColor: "#1f7a8c",\s*color: "white",\s*border: "none",\s*borderRadius: "8px",\s*fontWeight: 600,\s*cursor: isSaving \? "not-allowed" : "pointer",\s*display: "flex",\s*alignItems: "center",\s*gap: "8px"\s*\}\}/g, unifiedStyleSaving);

// Info Button
buttonsBlock = buttonsBlock.replace(/style=\{\{\s*padding: "0 24px",\s*backgroundColor: "transparent",\s*color: "#333",[\s\S]*?transition: "all 0.2s"\s*\}\}/g, unifiedStyle);

// Change Tier
buttonsBlock = buttonsBlock.replace(/style=\{\{\s*padding: "0 24px",\s*backgroundColor: "transparent",\s*color: "#1f7a8c",[\s\S]*?transition: "all 0.2s"\s*\}\}/g, unifiedStyle);

let newCode = code.replace(match[1], buttonsBlock);
fs.writeFileSync('pages/pc-builder.tsx', newCode);
console.log("Success");