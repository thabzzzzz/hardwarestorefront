const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
const top50Path = path.join(root, 'vendor_candidates_top50.csv');
const mappingPath = path.join(root, 'vendor_mapping.csv');

function titleCase(s) {
  return s.split(/\s+/).map(w => {
    if (!w) return w;
    return w.replace(/(^|[-_\\/()])[a-z]/g, c => c.toUpperCase());
  }).join(' ');
}

function looksLikeBrand(candidate) {
  const c = candidate.trim().toLowerCase();
  if (!c || c === '-' ) return false;
  const junkPatterns = [
    /\d/, /mm/, /gb/, /tb/, /rpm/, /mhz/, /hz/, /\bmb\b/, /w$/, /\$/, /%/, /\bnewegg\b/, /series/, /kit/, /rgb/, /black/, /white/, /yes|no/, /\bpcs?\b/, /x\d+/, /\d+gb/, /\bcm\b/, /\binches?\b/, /\bitem\b/, /\bpack\b/, /\bcapacity\b/, /\bcompatibility\b/, /\bmodel\b/, /\bprice\b/, /\bweight\b/, /\bsize\b/, /\bcolor\b/, /\btype\b/, /\bform factor\b/, /\binterface\b/, /\bprotocol\b/, /\bdrive\b/, /\bthreadripper\b/, /\bcore\b/, /\bchipset\b/, /\bcontroller\b/, /\bmemory\b/, /\bddr\b/, /\bpcie\b/, /\bhdmi\b/, /\blow profile\b/, /\bprofile\b/, /\bno\b/ 
  ];
  for (const re of junkPatterns) if (re.test(c)) return false;
  if (c.length <= 2) return false;
  return true;
}

function normalizeCandidate(candidate) {
  return candidate.trim().replace(/\s+/g, ' ');
}

function readCSVLines(p) {
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8');
  return raw.split(/\r?\n/).map(l => l.replace(/\r/g, '')).filter(Boolean);
}

const topLines = readCSVLines(top50Path);
if (topLines.length === 0) {
  console.error('Top50 CSV not found or empty:', top50Path);
  process.exit(1);
}

const topRows = topLines.slice(1).map(line => {
  const parts = line.split(',');
  const product_type = parts[0];
  const candidate = parts[1];
  return {product_type, candidate: candidate};
});

const mappingLines = readCSVLines(mappingPath);
const existing = new Set();
const existingRows = [];
if (mappingLines.length > 0) {
  mappingLines.slice(1).forEach(l => {
    const cols = l.split(',');
    const pt = cols[0];
    const cand = cols[1];
    if (pt && cand) existing.add(pt + '||' + cand);
    existingRows.push(l);
  });
}

const newRows = [];
for (const r of topRows) {
  const pt = r.product_type;
  const candRaw = r.candidate || '';
  const cand = normalizeCandidate(candRaw);
  const key = pt + '||' + cand;
  if (existing.has(key)) continue;
  if (!looksLikeBrand(cand)) {
    newRows.push(`${pt},${cand},,AUTO_SKIP`);
  } else {
    const canonical = titleCase(cand);
    newRows.push(`${pt},${cand},${canonical},AUTO`);
  }
}

const out = [];
out.push('product_type,candidate,canonical_name,notes');
for (const l of existingRows) out.push(l);
for (const l of newRows) out.push(l);

fs.writeFileSync(mappingPath, out.join('\n') + '\n', 'utf8');
console.log('Wrote', mappingPath, 'with', newRows.length, 'new entries');
