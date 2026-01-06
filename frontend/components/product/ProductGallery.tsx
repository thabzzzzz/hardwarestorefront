import React, { useEffect, useState } from 'react'
import styles from './ProductGallery.module.css'

type Props = {
  imageUrl?: string | null
  alt?: string
}

export default function ProductGallery({ imageUrl, alt }: Props) {
  const [candidates, setCandidates] = useState<string[]>([])
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
    if (!imageUrl) {
      setCandidates([])
      return
    }

    try {
      // build candidate URLs by replacing the final tag with preferred sizes
      const url = imageUrl
      const parts = url.split('/')
      const filename = parts.pop() || ''
      const dir = parts.join('/')
      const dot = filename.lastIndexOf('.')
      const name = dot > 0 ? filename.substring(0, dot) : filename
      const ext = dot > 0 ? filename.substring(dot + 1) : 'jpg'

      const dash = name.lastIndexOf('-')
      const base = dash > 0 ? name.substring(0, dash) : name

      const tags = ['1200w', '800w', '400w', 'orig', 'thumb']
      const list = tags.map(t => `${dir}/${base}-${t}.${ext}`)

      // ensure we include the original provided url as last resort
      if (!list.includes(imageUrl)) list.push(imageUrl)

      setCandidates(list)
    } catch (e) {
      setCandidates([imageUrl])
    }
  }, [imageUrl])

  useEffect(() => {
    // reset index when candidates change
    setIdx(0)
  }, [candidates.join('|')])

  const handleError = () => {
    setIdx(i => Math.min(i + 1, Math.max(0, candidates.length - 1)))
  }

  const src = candidates.length > 0 ? candidates[Math.min(idx, candidates.length - 1)] : null

  return (
    <div className={styles.wrapper}>
      {src ? (
        <img src={src} alt={alt || ''} onError={handleError} className={styles.image} />
      ) : (
        <div className={styles.empty}>No image</div>
      )}
    </div>
  )
}
