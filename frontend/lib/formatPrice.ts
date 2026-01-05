export default function formatPriceFromCents(amountCents?: number | null): string {
  if (amountCents === undefined || amountCents === null) return ''
  const amount = amountCents / 100
  try {
    // Use South African formatting for thousands and decimals
    const formatted = new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
    return `R${formatted}`
  } catch (e) {
    return `R${amount.toFixed(2)}`
  }
}
