const fs = require('fs');

const CATEGORIES = [
  { id: 'cases', slug: 'cases' },
  { id: 'cpus', slug: 'cpus' },
  { id: 'motherboards', slug: 'motherboards' },
  { id: 'ram', slug: 'ram' },
  { id: 'gpus', slug: 'gpus' },
  { id: 'psus', slug: 'psus' },
  { id: 'ssds', slug: 'ssds' },
  { id: 'coolers', slug: 'case-fans' }
];

async function run() {
  const catData = {};
  for (const c of CATEGORIES) {
    const r = await fetch('http://127.0.0.1:8080/api/' + c.slug + '?per_page=100');
    if (r.ok) {
      const j = await r.json();
      catData[c.id] = (j.data || j)
        .filter(item => item && item.current_price && item.current_price.amount_cents)
        .sort((a,b) => a.current_price.amount_cents - b.current_price.amount_cents);
    }
  }

  const profiles = {
    ultra_low: {
      id: 'ultra_low',
      name: 'Ultra Low Budget',
      targetBudget: 1000000,
      description: 'Basic entry-level 1080p gaming and light work.',
      allocation: { gpus: { percent: 36, note: 'Solid 1080p card' }, cpus: { percent: 20, note: '6-core performance' } },
      seed: {}
    },
    budget: {
      id: 'budget',
      name: 'Budget Gaming',
      targetBudget: 1800000,
      description: 'The sweet spot for 1080p High / 1440p Medium gaming.',
      allocation: { gpus: { percent: 45, note: 'Most of your budget goes to pushing higher frame rates' }, cpus: { percent: 25, note: 'An 8-core CPU handles background tasks and gaming perfectly' } },
      seed: {}
    },
    performance: {
      id: 'performance',
      name: 'Performance Gaming',
      targetBudget: 3500000,
      description: 'Max settings 1440p and solid 4K gaming ready.',
      allocation: { gpus: { percent: 45, note: 'The majority of a high-end gaming budget goes to the GPU.' }, cpus: { percent: 20, note: 'High core clocks prevent GPU bottlenecks.' } },
      seed: {}
    },
    workstation: {
      id: 'workstation',
      name: 'Workstation (Video/3D)',
      targetBudget: 6000000,
      description: 'Designed for massive compute payloads, video rendering, and multitasking.',
      allocation: { cpus: { percent: 25, note: 'High core-count is paramount for fast rendering.' }, ram: { percent: 25, note: '128GB+ memory payload cache.' } },
      seed: {}
    }
  };

  const mults = { ultra_low: 0.1, budget: 0.3, performance: 0.6, workstation: 0.9 };

  for (const key of Object.keys(profiles)) {
    const mult = mults[key];
    for (const c of CATEGORIES) {
      const items = catData[c.id] || [];
      const index = Math.floor(Math.max(0, items.length - 1) * mult);
      let item = items[index];
      if (item) {
        profiles[key].seed[c.id] = item;
      }
    }
  }

  const out = 'export const BUILD_PROFILES: Record<string, any> = ' + JSON.stringify(profiles, null, 2) + ';';
  fs.writeFileSync('frontend/lib/pc-builder-profiles.ts', out);
  console.log("Done!");
}
run();
