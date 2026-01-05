type ProductLike = {
  title?: string | null
  name?: string | null
  manufacturer?: string | null
  productType?: string | null
}

export default function getDisplayTitle(p: ProductLike): string {
  const title = p.title ?? ''
  const name = p.name ?? ''
  let displayTitle = (name && String(name).trim().length) ? String(name) : String(title)

  const productType = p.productType
  const isCpu = (productType && String(productType).toLowerCase().includes('cpu')) || /\b(ryzen|core|athlon|epyc|xeon)\b/i.test(displayTitle)
  if (isCpu) {
    const manufacturer = p.manufacturer
    if (manufacturer && !new RegExp('^\\s*' + manufacturer.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i').test(displayTitle)) {
      displayTitle = `${manufacturer} ${displayTitle}`
    }
  }

  return displayTitle
}
