import React from 'react'
import styles from './ProductSpecs.module.css'

type Props = {
  specs?: Record<string, string> | null
}

export default function ProductSpecs({ specs }: Props) {
  const empty = !specs || Object.keys(specs).length === 0

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Specifications</h3>
      {empty ? (
        <div className={styles.empty}>Specs TBD</div>
      ) : (
        <ul className={styles.list}>
          {Object.entries(specs!).map(([k, v]) => (
            <li key={k}><strong>{k}:</strong> {v}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
