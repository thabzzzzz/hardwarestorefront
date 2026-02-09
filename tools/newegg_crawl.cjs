const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Recommended target counts per category (from earlier)
const targets = {
  GPUs: 40,
  CPUs: 40,
  RAM: 30,
  Monitors: 25,
  Motherboards: 30,
  Cases: 25,
  PSUs: 25,
  Mice: 25,
  Keyboards: 25,
  Headsets: 20,
  CaseFans: 20,
  HDDs: 20,
  SSDs: 30,
  Routers: 20
};

const categoryQueries = {
  GPUs: 'graphics+card',
  CPUs: 'cpu',
  RAM: 'memory+ram',
  Monitors: 'monitor',
  Motherboards: 'motherboard',
  Cases: 'pc+case',
  PSUs: 'power+supply',
  Mice: 'mouse',
  Keyboards: 'keyboard',
  Headsets: 'headset',
  CaseFans: 'case+fan',
  HDDs: 'hard+drive',
  SSDs: 'ssd',
  Routers: 'router'
};

const OUTPUT_CSV = path.join(__dirname, '..', 'tmp', 'newegg_products.csv');
const OUTPUT_DIR = path.join(__dirname, '..', 'tmp');

function csvEscape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/\r?\n/g, ' ');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function normalizeKey(k) {
  return k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

async function extractProduct(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
  await page.waitForTimeout(1200);
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

  const specTables = await page.$$eval('table', tables => {
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

  const specMap = {};
  for (const [k,v] of specTables) {
    if (!k) continue;
    specMap[normalizeKey(k)] = v;
  }

  // basic fields
  const out = {
    source_name: 'newegg.com',
    source_url: url,
    scraped_at: (new Date()).toISOString(),
    name: productObj?.name || await page.title().catch(()=>''),
    sku: productObj?.sku || specMap['model'] || specMap['modelnumber'] || '',
    brand: (productObj?.brand && (productObj.brand.name||productObj.brand)) || specMap['brand'] || '',
    mpn: productObj?.mpn || '',
    image_urls: JSON.stringify(productObj?.image || []),
    raw_jsonld: JSON.stringify(productObj || {}),
    raw_spec_tables: JSON.stringify(specTables.slice(0,50))
  };

  // map some known spec keys heuristically
  const kv = (k)=> specMap[normalizeKey(k)];
  out.vram_gb = kv('memorysize') || kv('memory') || kv('memorysize');
  out.vram_type = kv('memorytype');
  out.bus_width_bit = kv('memoryinterface') || kv('memoryinterfacewidth') || kv('memoryinterface');
  out.boost_clock_ghz = kv('boostclock') || kv('boostclock(oc)') || '';
  out.tdp_watts = kv('thermaldesignpower') || kv('tdp') || '';
  out.cores = kv('cores') || kv('corecount') || '';
  out.threads = kv('threads') || '';

  // price attempt
  out.price_raw = await page.$eval('.price-current, .product-price, .product-buying .price-current', el => el && el.innerText).catch(()=>null);

  return out;
}

async function crawl() {
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
  const header = ['category','source_name','source_url','scraped_at','sku','name','brand','mpn','price_raw','vram_gb','vram_type','bus_width_bit','boost_clock_ghz','tdp_watts','cores','threads','image_urls','raw_jsonld','raw_spec_tables'];
  fs.writeFileSync(OUTPUT_CSV, header.map(csvEscape).join(',')+"\n");

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
  const page = await context.newPage();

  for (const [cat, query] of Object.entries(categoryQueries)) {
    const target = targets[cat] || 10;
    console.log('Category', cat, 'target', target);
    let collected = 0;
    let pageNum = 1;
    const seen = new Set();
    while (collected < target && pageNum < 60) {
      const searchUrl = `https://www.newegg.com/p/pl?d=${query}&page=${pageNum}`;
      console.log('Loading search', searchUrl);
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 }).catch(()=>{});
      await page.waitForTimeout(1200);
      const links = await page.$$eval('a.item-title, a.product-title', nodes => nodes.map(n=>n.href)).catch(()=>[]);
      for (const l of links) {
        if (collected >= target) break;
        if (!l || seen.has(l)) continue;
        seen.add(l);
        try {
          const p = await extractProduct(page, l);
          const row = [cat,p.source_name,p.source_url,p.scraped_at,p.sku,p.name,p.brand,p.mpn,p.price_raw,p.vram_gb,p.vram_type,p.bus_width_bit,p.boost_clock_ghz,p.tdp_watts,p.cores,p.threads,p.image_urls,p.raw_jsonld,p.raw_spec_tables];
          fs.appendFileSync(OUTPUT_CSV, row.map(csvEscape).join(',')+"\n");
          collected++;
          console.log('Collected', collected, 'for', cat);
        } catch (e) {
          console.error('Product failed', l, e.message);
        }
        await page.waitForTimeout(1000);
      }
      pageNum++;
    }
  }
  await browser.close();
  console.log('Done. CSV at', OUTPUT_CSV);
}

crawl().catch(err=>{ console.error(err); process.exit(1); });
