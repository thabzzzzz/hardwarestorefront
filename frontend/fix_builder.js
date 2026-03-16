const fs = require('fs');
let text = fs.readFileSync('pages/pc-builder.tsx', 'utf8');
const startIndex = text.indexOf('const handleAddAllToCart');
const endIndex = text.indexOf('const handleSave =');
const badPart = text.substring(startIndex, endIndex);

const goodPart = const handleAddAllToCart = () => {
    let addedCount = 0;
    let outOfStockCount = 0;

    const products = Object.values(selectedComponents).filter(Boolean);
    if (products.length === 0) {
        toast('Your build is empty. Select components first.');
        return;
    }

    products.forEach((product) => {
        if (!product || (!product.product_id && !product.variant_id)) return;

        const isOutOfStock = product.stock?.status === 'out_of_stock';
        if (isOutOfStock) {
            outOfStockCount++;
            return;
        }

        const entry = {
            id: String(product.product_id || product.variant_id),
            title: product.title || product.name || 'Product',
            thumbnail: product.thumbnail || product.clean_thumbnail || null,
            price: product.current_price ? { amount_cents: product.current_price.amount_cents } : (product.price ? { amount_cents: product.price.amount_cents } : null),
            stock: product.stock || null
        };

        cart.addOrUpdate(entry, 1);
        addedCount++;
    });

    if (addedCount > 0 && outOfStockCount === 0) {
        toast.success(\Added \ components to your cart!\);
    } else if (addedCount > 0 && outOfStockCount > 0) {
        toast.success(\Added \ components to your cart, but \ were out of stock.\);
    } else if (outOfStockCount > 0) {
        toast.error(\Could not add components: \ item(s) are out of stock.\);
    }
};

    ;

text = text.replace(badPart, goodPart);
fs.writeFileSync('pages/pc-builder.tsx', text);
