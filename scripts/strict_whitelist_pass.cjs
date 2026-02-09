const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'vendor_mapping.csv');
if (!fs.existsSync(p)) { console.error('vendor_mapping.csv missing'); process.exit(1); }
const raw = fs.readFileSync(p, 'utf8');
const lines = raw.split(/\r?\n/);
if (lines.length === 0) process.exit(1);
const header = lines[0];
// find top manual block until marker
let marker = lines.findIndex(l => l && l.startsWith('# Leave remaining'));
if (marker === -1) marker = 0;
const topBlock = lines.slice(1, marker).filter(l => l && !l.startsWith('#'));
const whitelist = new Set();
for (const l of topBlock) {
  const parts = l.split(',');
  const candidate = (parts[1]||'').trim().toLowerCase();
  const canonical = (parts[2]||'').trim().toLowerCase();
  if (candidate) whitelist.add(candidate);
  if (canonical) whitelist.add(canonical);
}
// also include canonical names from any top block entries where canonical exists
// process remaining rows strictly
let kept = 0, skipped = 0;
const out = [header];
for (let i = 1; i < lines.length; i++) {
  const l = lines[i];
  if (!l) { out.push(''); continue; }
  if (l.startsWith('#')) { out.push(l); continue; }
  const parts = l.split(',');
  const product_type = parts[0] || '';
  const candidate = (parts[1]||'').trim();
  const canonical = (parts[2]||'').trim();
  const notes = (parts.slice(3).join(',')||'').trim();
  const candKey = candidate.toLowerCase();
  const canonKey = canonical.toLowerCase();
  if (whitelist.has(candKey) || whitelist.has(canonKey)) {
    // keep as-is but standardize notes to AUTO
    out.push([product_type,candidate,canonical,'AUTO'].join(','));
    kept++;
  } else {
    // strict skip
    out.push([product_type,candidate,'','AUTO_SKIP'].join(','));
    skipped++;
  }
}
fs.writeFileSync(p, out.join('\n') + '\n', 'utf8');
console.log('Strict whitelist pass complete. kept=', kept, 'skipped=', skipped, 'whitelistCount=', whitelist.size);
