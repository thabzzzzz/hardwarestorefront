const fs = require('fs');
const filepath = 'frontend/pages/saved-builds.tsx';
let txt = fs.readFileSync(filepath, 'utf8');

const target = `                                            href={\`/build/\${build.share_token}\`}                                            onClick={(e) => e.stopPropagation()}                                            style={{
                                                padding: "8px 16px",
                                                background: "#f4f4f6",
                                                color: "#1f7a8c",
                                                borderRadius: "6px",
                                                textDecoration: "none",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Edit Build
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteBuild(build.id);
                                            }}
                                            style={{
                                                padding: "8px 16px",
                                                background: "#fff",
                                                color: "#d93025",
                                                border: "1px solid #d93025",    
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontWeight: 500,
                                            }}
                                        >`;

const replacement = `                                            href={\`/build/\${build.share_token}\`}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                height: "38px",
                                                padding: "0 18px",
                                                backgroundColor: "#f1f5f9",
                                                color: "#1f7a8c",
                                                borderRadius: "8px",
                                                textDecoration: "none",
                                                fontWeight: 600,
                                                fontFamily: "inherit",
                                                fontSize: "14px",
                                                transition: "all 0.15s ease-in-out",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 4px 8px rgba(31, 122, 140, 0.15)";
                                                e.currentTarget.style.backgroundColor = "#e2e8f0";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.backgroundColor = "#f1f5f9";
                                            }}
                                        >
                                            Edit Build
                                        </Link>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteBuild(build.id);
                                            }}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                height: "38px",
                                                padding: "0 18px",
                                                backgroundColor: "transparent",
                                                color: "#d93025",
                                                border: "1px solid #d93025",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontWeight: 600,
                                                fontFamily: "inherit",
                                                fontSize: "14px",
                                                transition: "all 0.15s ease-in-out",
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                e.currentTarget.style.boxShadow = "0 4px 8px rgba(217, 48, 37, 0.15)";
                                                e.currentTarget.style.backgroundColor = "#fef2f2";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = "translateY(0)";
                                                e.currentTarget.style.boxShadow = "none";
                                                e.currentTarget.style.backgroundColor = "transparent";
                                            }}
                                        >`;

txt = txt.replace(target, replacement);
fs.writeFileSync(filepath, txt);
console.log('Saved Builds buttons updated.');
