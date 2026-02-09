const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Edit sampleUrls to include the product pages you want to test.
const sampleUrls = [
  'https://www.wootware.co.za/gigabyte-radeon-rx-9060-xt-16g-gaming-oc-gv-r9060xtgaming-oc-16gd-16gb-gddr6-128-bit-pcie-5-0-desktop-graphics-card.html',
  'https://www.newegg.com/p/N82E16814126419',
  'https://www.scan.co.uk/products/3070-ti',
  'https://www.mindfactory.de/product_info.php/amd-ryzen-9-7900x-12-core-24-thread-4-7-ghz-turbo_1517009.html'
];

(async () => {
  const headless = process.env.HEADLESS !== '0';
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  await fs.promises.mkdir(path.join(__dirname, '..', 'tmp'), { recursive: true });

  for (const url of sampleUrls) {
    try {
      console.log('Visiting', url);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      // extra wait for JS-rendered content
      await page.waitForTimeout(1500);

      const hostname = new URL(url).hostname.replace(/[:./]/g, '_');
      const filename = path.join(__dirname, '..', 'tmp', `${hostname}_${Date.now()}.json`);

      // Extract JSON-LD scripts
      const jsonld = await page.$$eval('script[type="application/ld+json"]', nodes => nodes.map(n => n.innerText));
      const parsedJsonLd = [];
      for (const js of jsonld) {
        try { parsedJsonLd.push(JSON.parse(js)); } catch (e) { /* skip invalid */ }
      }

      // Attempt to find common price metadata
      const metaPrice = await page.$eval('meta[itemprop="price"]', m => m && m.getAttribute('content')).catch(() => null);
      const selectorPrice = await page.$$eval('[class*=price], [id*=price], [data-price]', nodes => nodes.slice(0,5).map(n => n.innerText.trim()));

      // Attempt to get specs tables
      const specTables = await page.$$eval('table', tables => {
        return tables.map(tbl => {
          const rows = Array.from(tbl.querySelectorAll('tr')).map(tr => {
            const cells = Array.from(tr.querySelectorAll('th,td')).map(c => c.innerText.trim());
            return cells;
          });
          return { html: tbl.outerHTML.slice(0,1000), rows: rows.slice(0,20) };
        }).slice(0,10);
      }).catch(() => []);

      // Heuristic: look for key/value spec lists
      const dlSpecs = await page.$$eval('dl, .specs, .product-specs, .techspecs, .product-attributes', nodes => {
        return nodes.slice(0,5).map(n => n.innerText.trim().slice(0,2000));
      }).catch(() => []);

      const out = {
        url,
        timestamp: new Date().toISOString(),
        jsonld: parsedJsonLd,
        metaPrice: metaPrice || null,
        selectorPrice: selectorPrice || [],
        specTables: specTables,
        dlSpecs: dlSpecs
      };

      await fs.promises.writeFile(filename, JSON.stringify(out, null, 2));
      console.log('Wrote', filename);
    } catch (err) {
      console.error('Failed', url, err.message);
    }
  }

  await browser.close();
})();
