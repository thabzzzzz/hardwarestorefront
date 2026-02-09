// Run with: node tools/backfill_specs.cjs

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// --- Config ---
const INPUT_FILE = path.join(__dirname, '../tmp/missing_products.json');
const RESULT_FILE = path.join(__dirname, '../tmp/backfill_data.json');

(async () => {
    // 1. Load targets
    let allTargets = [];
    if (fs.existsSync(INPUT_FILE)) {
        allTargets = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    } else {
        console.error("Missing products file not found:", INPUT_FILE);
        process.exit(1);
    }

    // 2. Load existing results
    let results = {};
    if (fs.existsSync(RESULT_FILE)) {
        try {
            results = JSON.parse(fs.readFileSync(RESULT_FILE, 'utf8'));
        } catch (e) {
            console.error("Could not parse result file, starting fresh.");
        }
    }

    // 3. Filter for pending items
    // We retry items that have 'error' or empty tables
    const pending = allTargets.filter(t => {
        const r = results[t.id];
        if (!r) return true; // Not attempted yet
        if (r.error) return true; // Failed previously
        
        // Also retry if we scraped but found nothing (maybe because we didn't click the tab!)
        let tables = [];
        try { tables = JSON.parse(r.raw_spec_tables || '[]'); } catch(e){}
        if (tables.length === 0) return true; 
        
        return false;
    });

    if (pending.length === 0) {
        console.log("No pending items to scrape!");
        return;
    }

    // 4. Group by "type" to smooth out browsing patterns
    const getType = (item) => {
        if (!item) return 'other';
        // Fallback to category if title is missing
        const t = (item.title || item.category || '').toLowerCase();
        if (t.includes('motherboard')) return 'mobo';
        if (t.includes('monitor')) return 'monitor';
        if (t.includes('power supply') || t.includes('psu')) return 'psu';
        if (t.includes('case')) return 'case';
        if (t.includes('memory') || t.includes('ram')) return 'ram';
        if (t.includes('ssd') || t.includes('drive')) return 'storage';
        return 'other';
    };

    pending.sort((a, b) => {
        const typeA = getType(a);
        const typeB = getType(b);
        return typeA.localeCompare(typeB);
    });

    console.log(`Found ${pending.length} pending items. Starting scrape...`);

    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/'
        }
    });

    const page = await context.newPage();

    // Process loop
    for (let i = 0; i < pending.length; i++) {
        const item = pending[i];
        console.log(`[${i+1}/${pending.length}] [${getType(item.title)}] Processing: ${item.url}`);

        try {
            // Adaptive delay: 5s - 15s to respect rate limits
            const delay = 5000 + Math.floor(Math.random() * 10000);
            console.log(`   Waiting ${Math.round(delay/1000)}s...`);
            await new Promise(r => setTimeout(r, delay));

            await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // CHECK FOR BLOCKING
            const title = await page.title();
            if (title.includes("Are you a human") || title.includes("Access Denied")) {
                console.error("   !!! BLOCKED DETECTED. Pausing 60s...");
                await new Promise(r => setTimeout(r, 60000));
                throw new Error("BLOCKED by Newegg");
            }

            // ATTEMPT TO CLICK 'SPECS' TAB
            try {
                // Selector strategies for the "Specs" tab
                // 1. Precise text match on common tab structures
                const tabSelector = [
                    '#product-details .tab-nav li:has-text("Specs")',
                    '#product-details .tab-nav li:has-text("Specifications")',
                    '[role="tab"]:has-text("Specs")',
                    '[role="tab"]:has-text("Specifications")'
                ].join(',');
                
                if (await page.locator(tabSelector).first().isVisible()) {
                    console.log("   -> Clicking 'Specs' tab...");
                    await page.locator(tabSelector).first().click();
                    await page.waitForTimeout(2000); // Wait for content
                }
            } catch (e) {
                // Tab interaction failed, but maybe content is already there
                console.log("   -> Could not click specs tab (maybe already active or missing).");
            }

            // Scroll down a bit
            await page.evaluate(() => window.scrollBy(0, 800));
            await page.waitForTimeout(1000);

            // Extract JSON-LD
            const jsonLd = await page.$$eval('script[type="application/ld+json"]', scripts => scripts.map(s => s.innerText));

            // Extract Tables
            let tables = await page.$$eval('#product-details .tab-panes table', tables => {
                const clean = txt => txt ? txt.replace(/\s+/g, ' ').trim() : '';
                return tables.map(table => {
                    const rows = Array.from(table.querySelectorAll('tr'));
                    return rows.map(tr => {
                        const cells = Array.from(tr.querySelectorAll('th, td'));
                        return cells.map(c => clean(c.innerText));
                    }).filter(row => row.length > 0);
                });
            });

            // Fallback generic table search if specific container was empty
            if (!tables || tables.length === 0) {
                 tables = await page.$$eval('table', tables => {
                    const clean = txt => txt ? txt.replace(/\s+/g, ' ').trim() : '';
                    return tables.map(table => {
                        return Array.from(table.querySelectorAll('tr')).map(tr => {
                            return Array.from(tr.querySelectorAll('th, td')).map(c => clean(c.innerText));
                        }).filter(row => row.length > 0);
                    });
                });
            }

            // Fallback: Definition Lists (dl/dt/dd)
            if (tables.length === 0) {
                const dlData = await page.$$eval('div#product-details dl, .tab-panes dl', dls => {
                    const clean = txt => txt ? txt.replace(/\s+/g, ' ').trim() : '';
                    return dls.map(dl => {
                        const pairs = [];
                        const dts = Array.from(dl.querySelectorAll('dt'));
                        const dds = Array.from(dl.querySelectorAll('dd'));
                        for(let k=0; k<Math.min(dts.length, dds.length); k++) {
                            pairs.push([clean(dts[k].innerText), clean(dds[k].innerText)]);
                        }
                        return pairs;
                    });
                });
                if (dlData.length > 0) {
                    console.log(`   -> Found specs in <dl> format, converting to table structure.`);
                    tables = dlData;
                }
            }

            console.log(`   -> Found ${tables.length} tables, ${jsonLd.length} JSON-LD blocks`);

            if (tables.length === 0 && jsonLd.length === 0) {
                 throw new Error("No data found (possible layout mismatch)");
            }

            results[item.id] = {
                id: item.id,
                url: item.url,
                raw_jsonld: JSON.stringify(jsonLd),
                raw_spec_tables: JSON.stringify(tables),
                scraped_at: new Date().toISOString()
            };

        } catch (err) {
            console.error(`   -> Error:`, err.message);
            results[item.id] = {
                error: err.message,
                failed_at: new Date().toISOString()
            };
        }

        // Save progress
        fs.writeFileSync(RESULT_FILE, JSON.stringify(results, null, 2));
    }

    await browser.close();
    console.log(`Done. Saved to ${RESULT_FILE}`);
})();