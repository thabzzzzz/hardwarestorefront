const fs = require('fs');
fetch('http://localhost:8080/api/component-catalog')
    .then(r => r.json())
    .then(catalog => {
        const productsMap = {};
        for (const cat in catalog) {
            for (const prod of catalog[cat]) {
                productsMap[prod.id] = prod;
            }
        }

        const BUILD_PROFILES = {
            ultra_low: {
                id: "ultra_low",
                name: "Ultra Low Budget",
                targetBudget: 1000000,
                description: "Basic entry-level 1080p gaming and light work.",
                allocation: { gpus: { percent: 36, note: "Solid 1080p card" }, cpus: { percent: 20, note: "6-core performance" } },
                seedIds: { cases: "272", cpus: "105", motherboards: "82", ram: "155", gpus: "213", psus: "244", ssds: "305", "system_cooling": "339" }
            },
            budget: {
                id: "budget",
                name: "Budget Gaming",
                targetBudget: 1808000,
                description: "The sweet spot for 1080p High / 1440p Medium gaming.",
                allocation: { gpus: { percent: 45, note: "Most of your budget goes to pushing higher frame rates" }, cpus: { percent: 25, note: "An 8-core CPU handles background tasks and gaming perfectly" } },
                seedIds: { cases: "260", cpus: "108", motherboards: "85", ram: "160", gpus: "220", psus: "250", ssds: "310", "system_cooling": "340" }
            },
            performance: {
                id: "performance",
                name: "Performance Gaming",
                targetBudget: 3500000,
                description: "Max settings 1440p and solid 4K gaming ready.",
                allocation: { gpus: { percent: 45, note: "The majority of a high-end gaming budget goes to the GPU." }, cpus: { percent: 20, note: "High core clocks prevent GPU bottlenecks." } },
                seedIds: { cases: "270", cpus: "110", motherboards: "90", ram: "165", gpus: "230", psus: "260", ssds: "315", "system_cooling": "341" }
            },
            workstation: {
                id: "workstation",
                name: "Workstation (Video/3D)",
                targetBudget: 6000000,
                description: "Designed for massive compute payloads, video rendering, and multitasking.",
                allocation: { cpus: { percent: 25, note: "High core-count is paramount for fast rendering." }, ram: { percent: 25, note: "128GB+ memory payload cache." } },
                seedIds: { cases: "280", cpus: "115", motherboards: "95", ram: "170", gpus: "240", psus: "265", ssds: "320", "system_cooling": "342" }
            }
        };

        const finalProfiles = {};
        for (const [key, profile] of Object.entries(BUILD_PROFILES)) {
            finalProfiles[key] = { ...profile, seed: {} };
            for (const [cat, id] of Object.entries(profile.seedIds)) {
                if (productsMap[id]) {
                    finalProfiles[key].seed[cat] = productsMap[id];
                } else {
                    // try to find any first available product for that category
                    const backup = catalog[cat] && catalog[cat][0];
                    if (backup) {
                        finalProfiles[key].seed[cat] = backup;
                    }
                }
            }
            delete finalProfiles[key].seedIds;
        }

        const out = `export const BUILD_PROFILES: Record<string, any> = ${JSON.stringify(finalProfiles, null, 2)};`;
        fs.writeFileSync('frontend/lib/pc-builder-profiles.ts', out);
        console.log("Done updating profiles!");
    });
