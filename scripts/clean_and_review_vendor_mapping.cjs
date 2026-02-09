const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'vendor_mapping.csv');
if (!fs.existsSync(p)) { console.error('vendor_mapping.csv missing'); process.exit(1); }
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const header = lines[0];
const rows = lines.slice(1).filter(Boolean).map(l => {
  // naive split into 4 columns only
  const parts = l.split(',');
  const [product_type, candidate, canonical_name, notes] = [parts[0]||'', parts[1]||'', parts[2]||'', parts.slice(3).join(',')||''];
  return {product_type, candidate, canonical_name, notes, raw: l};
});

// heuristics for metadata/specs
const metaPatterns = [
  /^\d+(\.\d+)?\s*(gb|tb|mb|kb|g|tbps)?$/i,
  /\bmm\b|\bcm\b|\binch(es)?\b|\bbc\b|\bmm\b/i,
  /\brpm\b|\bhz\b|\bghz\b|\bmhz\b/i,
  /\b\d+\s?w\b|\b\d+\s?v\b/i,
  /\b(black|white|red|blue|green|silver|gold|matte|pink|rose)\b/i,
  /\b(series|kit|bundle|pack|model|capacity|size|mm|inch|inches|width|height|depth|weight|price|rating|years?|warranty)\b/i,
  /\bnewegg\b|\bamazon\b|\bbest buy\b|\betsy\b/i,
  /\b\d{4}\b/, // years (dates)
  /\$|£|€|\bcm\b|\bkg\b|\bmm\b/,
  /^\d+\s?x\s?\d+$/i,
  /^\d+(\.\d+)?%$/,
  /^\d+\.?\d*\s*(in|inch|inches|mm|cm)$/i
];

function isMetadata(candidate) {
  if (!candidate) return true;
  const c = candidate.trim();
  if (!c) return true;
  if (/^[0-9\-\s\.]+$/.test(c)) return true; // numbers only
  if (c.length <= 2) return true; // very short tokens
  for (const re of metaPatterns) if (re.test(c)) return true;
  // tokens with many digits and letters mixed are likely specs
  if (/\d/.test(c) && /[a-zA-Z]/.test(c)) {
    // but allow some like 'sk hynix'
    if (/^[a-zA-Z\s\.\-]+$/.test(c)) { /* letters ok */ } else return true;
  }
  // common words that are not brands
  const nonBrands = ['case','fan','fan counts','internal','consumer','desktop','internal ssd','internal solid state drive ssd','rgb','yes','no','black','white','gaming','mid_tower'];
  if (nonBrands.includes(c.toLowerCase())) return true;
  return false;
}

const updated = [];
const review = [];
for (const r of rows) {
  const cand = (r.candidate||'').trim();
  const note = (r.notes||'').trim() || '';
  let canonical = (r.canonical_name||'').trim();
  let newNote = note || 'AUTO';
  if (isMetadata(cand)) {
    canonical = '';
    newNote = 'AUTO_SKIP';
  } else if (!canonical) {
    // ambiguous, queue for review
    newNote = 'REVIEW';
    review.push(r);
  }
  updated.push([r.product_type, cand, canonical, newNote].join(','));
}

fs.writeFileSync(p, header + '\n' + updated.join('\n') + '\n', 'utf8');
// write review CSV (unique candidates)
const reviewOut = ['product_type,candidate,canonical_name,notes'];
for (const r of review) reviewOut.push([r.product_type, r.candidate, r.canonical_name || '', r.notes || 'REVIEW'].join(','));
fs.writeFileSync(path.join(__dirname, 'vendor_mapping_review.csv'), reviewOut.join('\n') + '\n', 'utf8');
console.log('Clean pass complete. review count=', review.length);
