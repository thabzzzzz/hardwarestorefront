const fs = require('fs');
let txt = fs.readFileSync('frontend/components/pcbuilder/BuilderWorkspace.tsx', 'utf8');

const regex = /const items = \[\.\.\.activeProducts\];[\s\S]*?return items;\s*\}, \[[^\]]*\]\);/;
const replacement = `let items = [...activeProducts];

        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            items = items.filter(p => 
                (p.title && p.title.toLowerCase().includes(query)) ||
                (p.brand && p.brand.toLowerCase().includes(query)) ||
                (p.model && p.model.toLowerCase().includes(query))
            );
        }

        if (sortOrder === "price_asc") {
            items.sort((a, b) => (a.current_price?.amount_cents || 0) - (b.current_price?.amount_cents || 0));
        } else if (sortOrder === "price_desc") {
            items.sort((a, b) => (b.current_price?.amount_cents || 0) - (a.current_price?.amount_cents || 0));
        }

        const selectedId = selectedComponents[activeCategory]?.variant_id;      
        if (!selectedId) return items;

        const selectedIndex = items.findIndex(p => p.variant_id === selectedId);
        if (selectedIndex > -1) {
            const [selected] = items.splice(selectedIndex, 1);
            items.unshift(selected);
        }
        return items;
    }, [activeProducts, selectedComponents, activeCategory, searchQuery, sortOrder]);`;

txt = txt.replace(regex, replacement);

fs.writeFileSync('frontend/components/pcbuilder/BuilderWorkspace.tsx', txt);
console.log('Logic updated successfully');
