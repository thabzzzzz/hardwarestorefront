const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'vendor_mapping.csv');
if (!fs.existsSync(p)) { console.error('vendor_mapping.csv missing'); process.exit(1); }
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const header = lines[0];
const rows = lines.slice(1).map(l => l || '').map(l => {
  const parts = l.split(',');
  return {
    raw: l,
    product_type: parts[0]||'',
    candidate: (parts[1]||'').trim(),
    canonical_name: (parts[2]||'').trim(),
    notes: (parts.slice(3).join(',')||'').trim()
  };
});

// stronger metadata patterns and blacklist words
const metaWords = new Set([
  'case','fan','internal','consumer','desktop','kit','bundle','pack','model','capacity','size','mm','inch','inches','width','height','depth','weight','price','rating','years','warranty','rgb','yes','no','black','white','gaming','mid_tower','atx','atx3.1','triple','double','single','low','profile','ready','internal','solid','drive','ssd','nvme'
]);
const metaPatterns = [ /\d{1,4}\s?(gb|tb|mb|kb)\b/i, /\b\d+\s?mm\b/i, /\b\d+(\.\d+)?\s?(w|v)\b/i, /\brpm\b|\bhz\b|\bmhz\b/i, /\b\d{1,4}g\b/i, /\b\d+gb\b/i, /\b\d+tb\b/i ];

function isLikelyMetadata(candidate) {
  if (!candidate) return true;
  const c = candidate.toLowerCase().trim();
  if (c.length <= 2) return true;
  // contains many digits or punctuation
  const digitRatio = (c.match(/\d/g)||[]).length / Math.max(1, c.length);
  if (digitRatio > 0.3) return true;
  // if candidate contains any meta word as a whole word
  for (const w of metaWords) if (new RegExp('\\b'+w.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\b','i').test(c)) return true;
  // pattern matches
  for (const re of metaPatterns) if (re.test(c)) return true;
  // if candidate contains punctuation-heavy strings
  if (/[\|\[\]\{\}]/.test(c)) return true;
  // long phrases (more than 6 words) probably product descriptions
  if (c.split(/\s+/).length > 6) return true;
  return false;
}

let changed = 0;
const review = [];
const out = [header];
for (const r of rows) {
  if (!r.raw) { out.push(''); continue; }
  let {product_type,candidate,canonical_name,notes} = r;
  notes = notes || '';
  if (isLikelyMetadata(candidate)) {
    if (canonical_name || notes !== 'AUTO_SKIP') changed++;
    canonical_name = '';
    notes = 'AUTO_SKIP';
  } else {
    // preserve existing AUTO or REVIEW; if blank canonical but not metadata, mark REVIEW
    if (!canonical_name) {
      notes = notes === 'AUTO_SKIP' ? 'AUTO_SKIP' : 'REVIEW';
      review.push({product_type,candidate,canonical_name,notes});
    }
  }
  out.push([product_type,candidate,canonical_name,notes].join(','));
}
fs.writeFileSync(p, out.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(__dirname,'vendor_mapping_review.csv'), ['product_type,candidate,canonical_name,notes', ...review.map(r=>[r.product_type,r.candidate,r.canonical_name||'',r.notes].join(','))].join('\n') + '\n','utf8');
console.log('Broader pass complete. changed=', changed, 'reviewCount=', review.length);
