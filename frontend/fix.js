const fs = require('fs');
let txt = fs.readFileSync('pages/pc-builder.tsx', 'utf8');
const p1 = 'const handleAddAllToCart = () => {';
const p2 = '    const handleSave = async (';
const start = txt.indexOf(p1);
const end = txt.indexOf(p2);
if(start!==-1 && end!==-1){
   let toRepl = txt.substring(start, end);
   let newStr = 'const handleAddAllToCart = () => {' + '\n' +
   '        let addedCount = 0;' + '\n' +
   '        let outOfStockCount = 0;' + '\n\n' +
   '        const products = Object.values(selectedComponents).filter(Boolean);' + '\n' +
   '        if (products.length === 0) {' + '\n' +
   '            toast(\'Your build is empty. Select components first.\');' + '\n' +
   '            return;' + '\n' +
   '        }' + '\n\n' +
   '        products.forEach((product) => {' + '\n' +
   '            if (!product || (!product.product_id && !product.variant_id)) return;' + '\n\n' +
   '            const isOutOfStock = product.stock?.status === \'out_of_stock\';' + '\n' +
   '            if (isOutOfStock) {' + '\n' +
   '                outOfStockCount++;' + '\n' +
   '                return;' + '\n' +
   '            }' + '\n\n' +
   '            const entry = {' + '\n' +
   '                id: String(product.product_id || product.variant_id),' + '\n' +
   '                title: product.title || product.name || \'Product\',' + '\n' +
   '                thumbnail: product.thumbnail || product.clean_thumbnail || null,' + '\n' +
   '                price: product.current_price ? { amount_cents: product.current_price.amount_cents } : (product.price ? { amount_cents: product.price.amount_cents } : null),' + '\n' +
   '                stock: product.stock || null' + '\n' +
   '            };' + '\n\n' +
   '            cart.addOrUpdate(entry, 1);' + '\n' +
   '            addedCount++;' + '\n' +
   '        });' + '\n\n' +
   '        if (addedCount > 0 && outOfStockCount === 0) {' + '\n' +
   '            toast.success(\'Added \' + addedCount + \' components to your cart!\');' + '\n' +
   '        } else if (addedCount > 0 && outOfStockCount > 0) {' + '\n' +
   '            toast.success(\'Added \' + addedCount + \' components to your cart, but \' + outOfStockCount + \' were out of stock.\');' + '\n' +
   '        } else if (outOfStockCount > 0) {' + '\n' +
   '            toast.error(\'Could not add components: \' + outOfStockCount + \' items are out of stock.\');' + '\n' +
   '        }' + '\n' +
   '    };' + '\n\n';
   fs.writeFileSync('pages/pc-builder.tsx', txt.replace(toRepl, newStr));
}

