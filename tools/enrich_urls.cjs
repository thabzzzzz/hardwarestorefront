const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const INPUT_CSV = path.join(__dirname, '..', 'tmp', 'missing_enrich_urls.csv');
const INPUT_CSV_UTF8 = path.join(__dirname, '..', 'tmp', 'missing_enrich_urls.utf8.csv');
const ENV_INPUT_CSV = process.env.INPUT_CSV_PATH || null;
const OUTPUT_SQL = path.join(__dirname, '..', 'tmp', 'playwright_updates.sql');

function csvLines(p) {
  const s = fs.readFileSync(p, 'utf8');
  return s.split(/\r?\n/).filter(Boolean);
}

function csvParseLine(line) {
  // simple CSV with two columns: variant_id,source_url
  const parts = line.split(',');
  const id = parts[0];
  const url = parts.slice(1).join(',');
  return { id: id.replace(/^"|"$/g, ''), url: url.replace(/^"|"$/g, '') };
}

function escapeSqlLiteral(s) {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function parseIntOrNull(v) {
  if (!v) return 'NULL';
  const m = String(v).match(/(\d+)/);
  return m ? m[1] : 'NULL';
}

function parseClockMhz(v) {
  if (!v) return 'NULL';
  const s = String(v).toLowerCase();
  const m = s.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return 'NULL';
  const num = parseFloat(m[1]);
  if (s.includes('ghz')) return Math.round(num * 1000);
  if (s.includes('mhz')) return Math.round(num);
  // assume GHz if decimal and >100
  if (num < 100) return Math.round(num * 1000);
  return Math.round(num);
}

async function extractProduct(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});

  // Try several times to surface lazy-loaded spec content: click tabs, scroll, wait
  const maxAttempts = 3;
  for (let attempt=0; attempt<maxAttempts; attempt++) {
    try {
      await page.locator('text=Specifications').first().click({timeout:2000}).catch(()=>{});
      await page.waitForTimeout(600 + attempt*400);
      await page.evaluate(()=>window.scrollBy(0, Math.floor(document.body.scrollHeight/3)));
      await page.waitForTimeout(400 + attempt*300);
    } catch(e) {}
  }

  await page.waitForTimeout(700);

  // collect JSON-LD
  const jsonld = await page.$$eval('script[type="application/ld+json"]', nodes => nodes.map(n => n.innerText)).catch(()=>[]);
  let productObj = null;
  for (const js of jsonld) {
    try {
      const p = JSON.parse(js);
      if (Array.isArray(p)) {
        for (const o of p) if (o['@type'] && o['@type'].toLowerCase().includes('product')) productObj = o;
      } else if (p['@type'] && p['@type'].toLowerCase().includes('product')) productObj = p;
    } catch(e) {}
    if (productObj) break;
  }

  // if no jsonld, try inline JS state for initial payloads
  if ((!jsonld || jsonld.length===0)) {
    try {
      const scripts = await page.$$eval('script', nodes => nodes.map(n=>n.innerText).filter(Boolean));
      for (const s of scripts) {
        let m = s.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*\});?/);
        if (m) { try { const parsed = JSON.parse(m[1]); productObj = parsed.product || parsed; break; } catch(e){} }
        m = s.match(/window\.__INITIAL_DATA__\s*=\s*(\{[\s\S]*\});?/);
        if (m) { try { const parsed = JSON.parse(m[1]); productObj = parsed.product || parsed; break; } catch(e){} }
      }
    } catch(e) {}
  }

  // Build spec rows from multiple possible structures (tables, dl, key/value divs)
  const specTables = [];
  try {
    const tableRows = await page.$$eval('table', tables => {
      return tables.map(tbl => {
        const rows = Array.from(tbl.querySelectorAll('tr')).map(tr => {
          const th = tr.querySelector('th');
          const tds = Array.from(tr.querySelectorAll('td')).map(t=>t.innerText.trim());
          const key = th ? th.innerText.trim() : (tds[0]||'');
          const val = th ? (tds[0]||'') : (tds[1]||tds[0]||'');
          return [key,val];
        }).filter(r=>r[0]||r[1]);
        return rows;
      }).flat();
    }).catch(()=>[]);
    specTables.push(...tableRows);
  } catch(e) {}

  try {
    const dlRows = await page.$$eval('dl', dls => {
      return dls.map(dl => {
        const keys = Array.from(dl.querySelectorAll('dt')).map(n=>n.innerText.trim());
        const vals = Array.from(dl.querySelectorAll('dd')).map(n=>n.innerText.trim());
        const out = [];
        for (let i=0;i<Math.max(keys.length, vals.length); i++) out.push([keys[i]||'', vals[i]||'']);
        return out;
      }).flat();
    }).catch(()=>[]);
    specTables.push(...dlRows);
  } catch(e) {}

  try {
    const kvRows = await page.$$eval('.product-spec, .product-specs, .specs, .specs-list, .specsItem, .specsTable, .product-data, .product-details', nodes => {
      return nodes.map(n => {
        const items = Array.from(n.querySelectorAll('li,div')).map(el=>el.innerText.trim()).filter(Boolean);
        const out = [];
        for (const it of items) {
          const m = it.split(':');
          if (m.length>=2) out.push([m.shift(), m.join(':').trim()]);
        }
        return out;
      }).flat();
    }).catch(()=>[]);
    specTables.push(...kvRows);
  } catch(e) {}

  const specMap = {};
  const normalizeKey = k => k.replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
  for (const [k,v] of specTables) if (k) specMap[normalizeKey(k)] = v;

  const kv = (k)=> specMap[normalizeKey(k)];

  const out = {
    source_name: 'newegg.com',
    source_url: url,
    scraped_at: (new Date()).toISOString(),
    name: productObj?.name || await page.title().catch(()=>''),
    sku: productObj?.sku || kv('model') || '',
    brand: (productObj?.brand && (productObj.brand.name||productObj.brand)) || kv('brand') || '',
    mpn: productObj?.mpn || '',
    image_urls: JSON.stringify(productObj?.image || []),
    raw_jsonld: JSON.stringify(productObj || {}),
    raw_spec_tables: JSON.stringify(specTables.length ? specTables.slice(0,50) : []),
    vram_gb: kv('memorysize') || kv('memory') || '',
    bus_width: kv('memoryinterface') || kv('memoryinterfacewidth') || '',
    boost: kv('boostclock') || kv('boostclock(oc)') || kv('turbo') || '',
    tdp: kv('thermaldesignpower') || kv('tdp') || '',
    cores: kv('cores') || kv('corecount') || '',
    threads: kv('threads') || ''
  };

  // final fallback: if still empty, wait and try to capture first table text
  if ((!out.raw_jsonld || out.raw_jsonld==='{}') && specTables.length===0) {
    try {
      await page.waitForTimeout(1200);
      await page.evaluate(()=>window.scrollBy(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      const more = await page.$$eval('table', t=>t.map(x=>x.innerText).filter(Boolean)).catch(()=>[]);
      if (more && more.length>0) out.raw_spec_tables = JSON.stringify([["specs", more.join('\n')]]);
    } catch(e){}
  }

  return out;
}

async function run() {
  let csvPath = INPUT_CSV;
  if (ENV_INPUT_CSV) csvPath = path.resolve(ENV_INPUT_CSV);
  else if (fs.existsSync(INPUT_CSV_UTF8)) csvPath = INPUT_CSV_UTF8;
  if (!fs.existsSync(csvPath)) {
    console.error('Missing input CSV', INPUT_CSV, 'or', INPUT_CSV_UTF8, 'or env INPUT_CSV_PATH'); process.exit(1);
  }
  const lines = csvLines(csvPath);
  const rows = lines.slice(1).map(csvParseLine);

  await fs.promises.writeFile(OUTPUT_SQL, '-- Playwright enrichment updates\r\n', 'utf8');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  for (const {id,url} of rows) {
    try {
      console.log('Fetching', url);
      const p = await extractProduct(page, url);
      const vram_gb_int = parseIntOrNull(p.vram_gb);
      const bus_width_int = parseIntOrNull(p.bus_width);
      const boost_clock_mhz = p.boost ? parseClockMhz(p.boost) : 'NULL';
      const tdp_watts_int = parseIntOrNull(p.tdp);
      const cores_int = parseIntOrNull(p.cores);
      const threads_int = parseIntOrNull(p.threads);

      const sql = [];
      sql.push("UPDATE product_variants SET raw_jsonld = " + escapeSqlLiteral(p.raw_jsonld) + ", raw_spec_tables = " + escapeSqlLiteral(p.raw_spec_tables) + ", image_urls = " + escapeSqlLiteral(p.image_urls));
      if (vram_gb_int !== 'NULL') sql.push(", vram_gb_int = " + vram_gb_int);
      if (bus_width_int !== 'NULL') sql.push(", bus_width_int = " + bus_width_int);
      if (boost_clock_mhz !== 'NULL') sql.push(", boost_clock_mhz = " + boost_clock_mhz);
      if (tdp_watts_int !== 'NULL') sql.push(", tdp_watts_int = " + tdp_watts_int);
      if (cores_int !== 'NULL') sql.push(", cores_int = " + cores_int);
      if (threads_int !== 'NULL') sql.push(", threads_int = " + threads_int);
      const stmt = sql.join('') + " WHERE id = '" + id + "';\r\n";
      fs.appendFileSync(OUTPUT_SQL, stmt, 'utf8');
      console.log('Wrote update for', id);
    } catch (e) {
      console.error('Failed', url, e.message);
    }
    await page.waitForTimeout(800);
  }

  await browser.close();
  console.log('Wrote SQL to', OUTPUT_SQL);
}

run().catch(err=>{ console.error(err); process.exit(1); });
