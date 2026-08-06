const fs = require('fs');

let code = fs.readFileSync('components/pcbuilder/Onboarding.tsx', 'utf8');

const mapRegex = /\{Object\.values\(BUILD_PROFILES\)\.map\(\(profile, i\) => \([\s\S]*?<\//g;

const oldStr = `{Object.values(BUILD_PROFILES).map((profile, i) => (
                    <motion.div`;
const newStr = `{Object.values(BUILD_PROFILES).map((profile, i) => (
                    <motion.div`;

const newCode = code.replace(oldStr, `
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                    whileHover={{ scale: 1.05, boxShadow: "0px 10px 40px rgba(31, 122, 140, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelectProfile({
                        id: 'custom',
                        name: 'Start from Scratch',
                        description: 'Begin with a blank slate and handpick every component yourself.',
                        targetBudget: 5000000, 
                        isCustom: true,
                        seed: {}
                    })}
                    style={{
                        background: '#1f7a8c',
                        borderRadius: '16px',
                        padding: '30px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(0,0,0,0.05)',
                        position: 'relative',
                        color: '#fff',
                        overflow: 'hidden'
                    }}
                >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>Start from Scratch</h3>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.5', margin: '0 0 24px' }}>Begin with a completely blank slate and handpick every component yourself.</p>

                    <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Custom Target Budget</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                            Uncapped ∞
                        </div>
                    </div>
                </motion.div>
                {Object.values(BUILD_PROFILES).map((profile, i) => (
                    <motion.div`);

fs.writeFileSync('components/pcbuilder/Onboarding.tsx', newCode);
console.log('done');
