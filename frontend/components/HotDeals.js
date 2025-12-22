import styles from '../styles/Home.module.css'

const items = new Array(6).fill(0).map((_,i)=>({
  id:i,
  title:`Sample Product ${i+1}`,
  price:`R ${(1000+(i*250)).toLocaleString()}`,
  img:'https://via.placeholder.com/220x140'
}))

export default function HotDeals(){
  return (
    <section className={styles.hotDeals}>
      <h2>Hot Deals</h2>
      <div className={styles.grid}>
        {items.map(item=> (
          <article key={item.id} className={styles.card}>
            <img src={item.img} alt="product" />
            <div className={styles.cardBody}>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardPrice}>{item.price}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
