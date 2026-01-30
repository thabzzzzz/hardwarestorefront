const fs = require('fs');
const path = require('path');
const sqlPath = path.join(__dirname, '..', 'tmp', 'playwright_updates.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('Missing', sqlPath);
  process.exit(2);
}
const s = fs.readFileSync(sqlPath, 'utf8');
const parts = s.split(/;\s*/);
const out = [];
for (const p of parts) {
  if (p.indexOf("raw_jsonld = '{}'") !== -1) {
    const m = p.match(/WHERE id = '([^']*)'/);
    out.push(m ? m[1] : '');
  }
}
const outPath = path.join(__dirname, '..', 'tmp', 'failed_ids.txt');
fs.writeFileSync(outPath, out.join('\n'));
console.log('Wrote', out.length, 'entries to', outPath);