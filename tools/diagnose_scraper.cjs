const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  {
    "id": "e6165dcf-5669-467d-a277-205879db90fd",
    "url": "https://www.newegg.com/super-flower-leadex-vii-xg-atx-3-1-compatible-850w-80-plus-gold-certified-power-supplies-white/p/1HU-024C-00061",
    "title": "Super Flower Leadex VII XG 850W"
  },
  {
    "id": "5ba00c39-cf37-40f5-8c5c-724c697fdcea",
    "url": "https://www.newegg.com/corsair-rm1200x-shift-atx-atx-3-0-compatible-1200-w-80-plus-gold-certified-power-supply-cp-9020254-na/p/N82E16817139304",
    "title": "CORSAIR RMx Shift Series RM1200x"
  },
  {
    "id": "9f5995b4-08c5-40a3-8952-ee18e6588238",
    "url": "https://www.newegg.com/thermaltake-smart-series-intel-atx-12v-v2-3-600-w-80-plus-certified-power-supply-ps-spd-0600npcwus-w/p/N82E16817153232",
    "title": "Thermaltake SMART Series"
  }
];

(async () => {
    const browser = await chromium.launch({ headless: true });
    
    // More realistic headers
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        }
    });

    const page = await context.newPage();

    for (const item of TARGETS) {
        console.log(`\n--- Diagnosing ${item.id} (${item.title}) ---`);
        console.log(`URL: ${item.url}`);

        try {
            const response = await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            console.log(`Response Status: ${response.status()}`);
            
            // Wait a bit longer
            await page.waitForTimeout(5000);

            // Screenshot
            const screenshotPath = `tmp/debug_${item.id}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: false });
            console.log(`Saved screenshot to ${screenshotPath}`);

            // Save HTML
            const html = await page.content();
            fs.writeFileSync(`tmp/debug_${item.id}.html`, html);
            console.log(`Saved HTML to tmp/debug_${item.id}.html`);

            // Try to find tables
            const tables = await page.$$eval('table', tables => tables.length);
            console.log(`Found ${tables} standard <table> elements.`);

            // Search for Definition Lists (dl/dt/dd)
            const dls = await page.$$eval('#product-details dl, .tab-panes dl', nodes => nodes.length);
            console.log(`Found ${dls} <dl> elements in commonly used containers.`);

            // Search for specific text "Specifications"
            const hasSpecsText = await page.evaluate(() => document.body.innerText.includes("Specifications"));
            console.log(`Page contains "Specifications" text: ${hasSpecsText}`);
            
            // Check if there's a "Specs" tab that needs clicking
            const tabButtons = await page.$$eval('[role="tab"], .tab-nav', nodes => nodes.map(n => n.innerText));
            console.log(`Found tabs: ${tabButtons.join(', ')}`);

        } catch (err) {
            console.error(`ERROR: ${err.message}`);
        }
    }

    await browser.close();
})();
