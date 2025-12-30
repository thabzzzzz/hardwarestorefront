#!/usr/bin/env node
// Usage: node process-images.js <productId> <sourceFilename>
// Example: node process-images.js prod-0001 nzxt-h1-original.jpg

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const sharp = require('sharp')

async function main() {
  const [,, productId, sourceName] = process.argv
  if (!productId || !sourceName) {
    console.error('Usage: node process-images.js <productId> <sourceFilename>')
    process.exit(2)
  }

  const workspace = path.resolve(__dirname, '..')
  const incomingDir = path.join(workspace, 'public', '_incoming')
  const srcPath = path.join(incomingDir, sourceName)
  if (!fs.existsSync(srcPath)) {
    console.error('Source file not found at', srcPath)
    process.exit(2)
  }

  const outDir = path.join(workspace, 'public', 'products', productId)
  fs.mkdirSync(outDir, { recursive: true })

  const buffer = fs.readFileSync(srcPath)
  const hash = crypto.createHash('md5').update(buffer).digest('hex').slice(0,8)

  // save original (fingerprinted)
  const origExt = path.extname(sourceName).toLowerCase() || '.jpg'
  const origName = `${hash}-orig${origExt}`
  const origPath = path.join(outDir, origName)
  fs.writeFileSync(origPath, buffer)

  // sizes to generate (widths)
  const sizes = [400, 800, 1200]
  const results = []

  for (const w of sizes) {
    const outName = `${hash}-${w}w.webp`
    const outPath = path.join(outDir, outName)
    try {
      const img = sharp(buffer).rotate().resize({ width: w }).webp({ quality: 80 })
      await img.toFile(outPath)
      const meta = await sharp(outPath).metadata()
      results.push({ url: `/products/${productId}/${outName}`, variant: `${w}w`, width: meta.width, height: meta.height, mime: 'image/webp' })
    } catch (err) {
      console.error('Error processing size', w, err)
    }
  }

  // small thumbnail (use contain to avoid cropping important content)
  const thumbName = `${hash}-thumb.webp`
  const thumbPath = path.join(outDir, thumbName)
  await sharp(buffer)
    .rotate()
    .resize({ width: 220, height: 140, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 70 })
    .toFile(thumbPath)
  const tmeta = await sharp(thumbPath).metadata()
  results.unshift({ url: `/products/${productId}/${thumbName}`, variant: 'thumb', width: tmeta.width, height: tmeta.height, mime: 'image/webp' })

  // primary image record
  const mapping = {
    productId,
    original: `/products/${productId}/${origName}`,
    images: results,
    generatedAt: new Date().toISOString(),
    fingerprint: hash
  }

  // merge this mapping into a manifest file under public/images/products/manifest.json
  try {
    const manifestDir = path.join(workspace, 'public', 'images', 'products')
    fs.mkdirSync(manifestDir, { recursive: true })
    const manifestPath = path.join(manifestDir, 'manifest.json')
    let manifest = {}
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      } catch (err) {
        console.error('Warning: failed to parse existing manifest, overwriting', err)
        manifest = {}
      }
    }
    manifest[productId] = mapping
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
    console.log('Wrote manifest entry to', manifestPath)
  } catch (err) {
    console.error('Error writing manifest', err)
  }

  // print JSON mapping to paste into your products.json `images` field
  console.log(JSON.stringify(mapping, null, 2))
  console.log('\nSaved files to', outDir)
  console.log('Remove the original source from _incoming after you confirm the outputs.')
}

main().catch(err => { console.error(err); process.exit(1) })
