import styles from './hotDeals.module.css'
import productsData from '../../data/products.json'
import type { Product } from '../../types/product'

const products: Product[] = productsData as unknown as Product[]

export default function HotDeals(): JSX.Element {
  const items = products.slice(0, 6)

  return (
    <section className={styles.hotDeals}>
      <h2>Hot Deals</h2>
      <div className={styles.grid}>
        {items.map((product) => {
          const primary = (product.images && (product.images as any[]).find(i => i.is_primary)) || product.images?.[0]
          const imgUrl = primary?.url || '/images/products/placeholder.png'
          const alt = primary?.alt || product.title
          const price = (product.price_cents / 100).toLocaleString()

          return (
            <article key={product.id} className={styles.card}>
              <img src={imgUrl} alt={alt} />
              <div className={styles.cardBody}>
                <div className={styles.cardTitle}>{product.title}</div>
                <div className={styles.cardPrice}>{product.currency} {price}</div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
