import React, { useEffect, useMemo, useState } from 'react'
import styles from './ProductGallery.module.css'

type Props = {
  imageUrl?: string | null
  images?: Array<string | { url: string; alt?: string }> | null
  alt?: string
}

export default function ProductGallery({ imageUrl, images, alt }: Props) {
  const [broken, setBroken] = useState(false)

  const candidates = useMemo(() => {
    // prefer first image from `images` array; support string or {url,alt}
    let srcCandidate: any = null
    if (images && images.length > 0) {
      const first = images[0]
      srcCandidate = (typeof first === 'string') ? first : (first && (first as any).url ? (first as any).url : null)
    } else {
      srcCandidate = imageUrl
    }
    if (!srcCandidate) return []

    // prefer the cleaned original URL only (avoid cycling through size variants)
    return [srcCandidate]
  }, [imageUrl, images])

  useEffect(() => {
    setBroken(false)
  }, [candidates.join('|')])

  const handleError = () => {
    // mark broken and stop attempting alternative URLs to avoid flicker
    setBroken(true)
  }

  const src = candidates.length > 0 && !broken ? candidates[0] : null
  // alt preference: explicit prop, then images[0].alt if available
  let imgAlt = alt || ''
  if ((!imgAlt || imgAlt.length === 0) && images && images.length > 0) {
    const first = images[0]
    if (typeof first !== 'string' && first && (first as any).alt) imgAlt = (first as any).alt
  }

  return (
    <div className={styles.wrapper}>
      {src ? (
        <img src={src} alt={imgAlt || ''} onError={handleError} className={styles.image} />
      ) : (
        <div className={styles.empty}>No image</div>
      )}
    </div>
  )
}
