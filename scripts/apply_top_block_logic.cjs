const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'vendor_mapping.csv');
let txt = fs.readFileSync(p, 'utf8');
const lines = txt.split(/\r?\n/);
// find marker line
const marker = lines.findIndex(l => l.startsWith('# Leave remaining'));
const headerLine = lines[0];
const topBlock = lines.slice(1, marker === -1 ? 1 : marker);
// parse manual mapping from topBlock (skip comments and empty lines)
const manual = {};
for (const l of topBlock) {
  if (!l || l.startsWith('#')) continue;
  const cols = l.split(',');
  const pt = cols[0];
  const cand = cols[1];
  const canonical = cols[2] || '';
  manual[pt + '||' + cand] = canonical;
}

// exceptions for brand stylings
const exceptions = {
  'g.skill': 'G.Skill',
  'g skill': 'G.Skill',
  'sk hynix': 'SK hynix',
  'be quiet': 'be quiet!',
  'nzxt': 'NZXT',
  'msi': 'MSI',
  'asus': 'ASUS',
  'asrock': 'ASRock',
  'gigabyte': 'Gigabyte',
  'xfx': 'XFX',
  'samsung': 'Samsung',
  'san disk': 'SanDisk',
  'sandisk': 'SanDisk',
  'powercolor': 'PowerColor',
  'patriot memory': 'Patriot Memory',
  'team group': 'Team Group',
  'g.skill': 'G.Skill',
  'g skill': 'G.Skill',
  'corsair': 'Corsair',
  'crucial': 'Crucial',
  'king spec': 'KingSpec',
  'kingspec': 'KingSpec',
  'raidmax': 'Raidmax',
  'hyperx': 'HyperX',
  'logitech': 'Logitech',
  'razer': 'Razer',
  'redragon': 'Redragon',
  'epomaker': 'Epomaker',
  'steelseries': 'SteelSeries',
  'nzxt': 'NZXT',
  'tp-link': 'TP-Link',
  'tp link': 'TP-Link',
  'netgear inc.': 'Netgear',
  'sama': 'SAMA',
  'vetroo': 'Vetroo',
  'songryvga': 'SongryVGA'
};

function titleCase(s) {
  return s.split(/\s+/).map(w => {
    if (!w) return w;
    // keep known acronyms uppercase
    if (/^(msi|asus|amd|gpu|ssd|nvme|usb|pcie|rdna|gddr|gb|tb)$/i.test(w)) return w.toUpperCase();
    // dots remain (e.g., g.skill)
    if (w.includes('.')) return w.split('.').map(t => t[0] ? (t[0].toUpperCase() + t.slice(1)) : t).join('.');
    return w[0].toUpperCase() + w.slice(1);
  }).join(' ');
}

const out = [];
out.push(headerLine);
// copy top block
for (let i = 1; i <= marker; i++) {
  out.push(lines[i]);
}
// process remaining lines
for (let i = marker + 1; i < lines.length; i++) {
  const l = lines[i];
  if (!l) { out.push(l); continue; }
  if (l.startsWith('#')) { out.push(l); continue; }
  const cols = l.split(',');
  const pt = cols[0] || '';
  const cand = (cols[1] || '').trim();
  const note = cols[3] || '';
  const key = pt + '||' + cand;
  let canonical = (cols[2] || '').trim();
  if (manual[key]) {
    canonical = manual[key];
  } else if (canonical) {
    // if already present (from AUTO), normalize using exceptions/titleCase
    const low = canonical.toLowerCase();
    if (exceptions[low]) canonical = exceptions[low];
    else canonical = titleCase(canonical);
  } else if (cand) {
    const lowcand = cand.toLowerCase();
    if (exceptions[lowcand]) canonical = exceptions[lowcand];
    else canonical = titleCase(cand);
  } else {
    canonical = '';
  }
  // keep note (AUTO/AUTO_SKIP) - but standardize to AUTO or AUTO_SKIP
  let stdNote = note.trim();
  if (!stdNote) {
    stdNote = 'AUTO';
  }
  out.push([pt, cand, canonical, stdNote].join(','));
}
fs.writeFileSync(p, out.join('\n') + '\n', 'utf8');
console.log('Applied top-block logic to', p);
