const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, '..', 'tmp', 'playwright_updates.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('Missing', sqlPath);
  process.exit(2);
}

let buf = fs.readFileSync(sqlPath);
let s = buf.toString('utf8');
if (s.indexOf("raw_jsonld = '{}'") === -1 && buf.length > 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
  // likely UTF-16LE BOM; re-decode
  s = buf.toString('utf16le');
}
// strip nulls
s = s.replace(/\u0000/g, '');

const parts = s.split(/;\s*/).map(p=>p.trim()).filter(Boolean);
const cleaned = [];
const empty = [];
const failedIds = [];

for (const p of parts) {
  // ensure it's an UPDATE we recognize
  if (!p.toUpperCase().startsWith('UPDATE PRODUCT_VARIANTS')) continue;
  // detect empty payload
  const isEmpty = p.indexOf("raw_jsonld = '{}'") !== -1 && p.indexOf("raw_spec_tables = '[]'") !== -1 && p.indexOf("image_urls = '[]'") !== -1;
  const m = p.match(/WHERE id = '([^']+)'/i);
  const id = m ? m[1] : '';
  if (!id) {
    // skip or log
    continue;
  }
  if (isEmpty) {
    empty.push(p + ';');
    failedIds.push(id);
  } else {
    cleaned.push(p + ';');
  }
}

const outDir = path.join(__dirname, '..', 'tmp');
fs.writeFileSync(path.join(outDir, 'playwright_updates.cleaned.sql'), cleaned.join('\n') + (cleaned.length? '\n' : ''));
fs.writeFileSync(path.join(outDir, 'playwright_updates.empty.sql'), empty.join('\n') + (empty.length? '\n' : ''));
fs.writeFileSync(path.join(outDir, 'failed_ids.txt'), failedIds.join('\n'));
console.log('cleaned:', cleaned.length, 'empty:', empty.length, 'failed ids:', failedIds.length);
