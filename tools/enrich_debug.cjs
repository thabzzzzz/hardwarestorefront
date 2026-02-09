const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const failedPath = path.join(__dirname, '..', 'tmp', 'failed_ids.txt');
let mapPath = path.join(__dirname, '..', 'tmp', 'missing_enrich_urls.csv');
const alt = path.join(__dirname, '..', 'tmp', 'missing_enrich_urls.utf8.csv');
if (fs.existsSync(alt)) mapPath = alt;
const outDir = path.join(__dirname, '..', 'tmp', 'debug');
if (!fs.existsSync(failedPath)) {
  console.error('Missing', failedPath);
  process.exit(2);
}
if (!fs.existsSync(mapPath)) {
  console.error('Missing', mapPath);
  process.exit(2);
}
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const failed = fs.readFileSync(failedPath, 'utf8').split(/\r?\n/).filter(Boolean);
const lines = fs.readFileSync(mapPath, 'utf8').split(/\r?\n/).filter(Boolean);
const map = new Map();
for (const l of lines.slice(1)) {
  const idx = l.indexOf(',');
  if (idx === -1) continue;
  const id = l.slice(0, idx).trim();
  const url = l.slice(idx + 1).trim();
  map.set(id, url);
}

(async ()=>{
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const id of failed) {
    const url = map.get(id);
    if (!url) {
      console.log('No URL for', id);
      continue;
    }
    console.log('Debug fetch', id, url);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(2000);
      // try clicking common spec tabs
      const tabLabels = ['Specifications', 'Tech Specs', 'Specs', 'Specification', 'Technical Details'];
      for (const lbl of tabLabels) {
        const el = await page.$(`text="${lbl}"`);
        if (el) {
          try { await el.click(); await page.waitForTimeout(1200); } catch(e){}
        }
      }
      // scroll slowly
      await page.evaluate(async ()=>{ for(let i=0;i<8;i++){ window.scrollBy(0, window.innerHeight/2); await new Promise(r=>setTimeout(r,250)); } });
      await page.waitForTimeout(1000);

      const html = await page.content();
      const screenshotPath = path.join(outDir, `${id}.png`);
      const htmlPath = path.join(outDir, `${id}.html`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      fs.writeFileSync(htmlPath, html);

      // capture various spec containers
      const specData = await page.evaluate(()=>{
        const out = {};
        const tables = Array.from(document.querySelectorAll('table')).map(t=>t.innerText);
        if (tables.length) out.tables = tables;
        const dls = Array.from(document.querySelectorAll('dl')).map(dl=>dl.innerText);
        if (dls.length) out.dls = dls;
        const specNodes = Array.from(document.querySelectorAll('[class*=spec], [id*=spec], [data-spec]')).map(n=>n.innerText);
        if (specNodes.length) out.specNodes = specNodes;
        // try to find inline JS globals
        const scripts = Array.from(document.scripts).map(s=>s.innerText).filter(t=>t.length<20000);
        out.scriptSnippets = scripts.slice(0,3);
        return out;
      });
      fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(specData, null, 2));
      console.log('Saved', id, '->', screenshotPath, htmlPath);
    } catch (err) {
      console.error('Error fetching', id, err.message);
    }
  }

  await browser.close();
  console.log('Done debug fetches. Files in', outDir);
})();
