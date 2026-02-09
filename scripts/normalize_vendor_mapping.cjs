const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'vendor_mapping.csv');
if (!fs.existsSync(p)) {
  console.error('File not found', p);
  process.exit(1);
}
const buf = fs.readFileSync(p);
let out = null;
if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
  // UTF-16 LE BOM
  out = buf.toString('utf16le');
} else if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) {
  // UTF-16 BE BOM: swap bytes then decode as LE
  const swapped = Buffer.alloc(buf.length);
  for (let i = 0; i + 1 < buf.length; i += 2) {
    swapped[i] = buf[i+1];
    swapped[i+1] = buf[i];
  }
  out = swapped.toString('utf16le');
} else {
  // Strip NUL bytes and decode as UTF-8
  const filtered = Buffer.from(buf.filter(b => b !== 0x00));
  out = filtered.toString('utf8');
}
// Trim trailing NUL or weird characters and normalize newlines
out = out.replace(/\u0000/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
fs.writeFileSync(p, out, 'utf8');
console.log('Normalized', p);
