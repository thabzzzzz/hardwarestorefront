#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

async function inspectImage(filePath) {
  try {
    const meta = await sharp(filePath).metadata()
    return { width: meta.width || null, height: meta.height || null, mime: meta.format ? `image/${meta.format}` : 'image/webp' }
  } catch (err) {
    return { width: null, height: null, mime: 'image/webp' }
  }
}

async function buildForDir(baseDir, slug, urlRoot) {
  const entries = fs.readdirSync(baseDir)
  const files = entries.filter(f => fs.statSync(path.join(baseDir, f)).isFile())
  const orig = files.find(f => /-orig\./i.test(f)) || null
  const thumb = files.find(f => /-thumb\.webp$/i.test(f)) || null
  const sizes = files.filter(f => /-\d+w\.webp$/i.test(f))

  const images = []
  if (thumb) {
    const meta = await inspectImage(path.join(baseDir, thumb))
    images.push({ url: `/${urlRoot}/${slug}/${thumb}`, variant: 'thumb', width: meta.width, height: meta.height, mime: meta.mime })
  }
  for (const f of sizes) {
    const meta = await inspectImage(path.join(baseDir, f))
    const variant = f.match(/-(\d+w)\.webp$/i)?.[1] || 'unknown'
    images.push({ url: `/${urlRoot}/${slug}/${f}`, variant, width: meta.width, height: meta.height, mime: meta.mime })
  }

  const fingerprint = (thumb && (thumb.match(/^([0-9a-f]{8})-/i) || [])[1]) || null
  return {
    productId: slug,
    original: orig ? `/${urlRoot}/${slug}/${orig}` : null,
    images,
    generatedAt: new Date().toISOString(),
    fingerprint
  }
}

async function main() {
  const workspace = path.resolve(__dirname, '..')
  const imagesProducts = path.join(workspace, 'public', 'images', 'products')
  const altProducts = path.join(workspace, 'public', 'products')

  const manifest = {}

  // collect slugs from both locations (images/products preferred)
  const slugs = new Set()
  if (fs.existsSync(imagesProducts)) for (const d of fs.readdirSync(imagesProducts)) {
    if (d.startsWith('.')) continue
    try { if (fs.statSync(path.join(imagesProducts, d)).isDirectory()) slugs.add(d) } catch (e) {}
  }
  if (fs.existsSync(altProducts)) for (const d of fs.readdirSync(altProducts)) {
    if (d.startsWith('.')) continue
    try { if (fs.statSync(path.join(altProducts, d)).isDirectory()) slugs.add(d) } catch (e) {}
  }

  const sorted = Array.from(slugs).sort()
  for (const slug of sorted) {
    let base = null
    let urlRoot = 'products'
    if (fs.existsSync(path.join(imagesProducts, slug))) {
      base = path.join(imagesProducts, slug)
      urlRoot = 'images/products'
    } else if (fs.existsSync(path.join(altProducts, slug))) {
      base = path.join(altProducts, slug)
      urlRoot = 'products'
    }
    if (!base) continue
    try {
      const stat = fs.statSync(base)
      if (!stat.isDirectory()) continue
    } catch (e) { continue }

    const mapping = await buildForDir(base, slug, urlRoot)
    manifest[slug] = mapping
    console.log('Added', slug)
  }

  // ensure images/products directory exists for manifest
  const manifestDir = path.join(workspace, 'public', 'images', 'products')
  fs.mkdirSync(manifestDir, { recursive: true })
  const manifestPath = path.join(manifestDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log('Wrote manifest to', manifestPath)
  console.log('Entries:', Object.keys(manifest).length)
}

main().catch(err => { console.error(err); process.exit(1) })
