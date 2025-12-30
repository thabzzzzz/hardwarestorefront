#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const child = require('child_process')

function slugify(name) {
  return name.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function main() {
  const workspace = path.resolve(__dirname, '..')
  const unsortedDir = path.join(workspace, 'public', 'images', 'unsortedProducts', 'cpus')
  const incomingDir = path.join(workspace, 'public', '_incoming')

  if (!fs.existsSync(unsortedDir)) {
    console.error('Unsorted CPUs folder not found:', unsortedDir)
    process.exit(2)
  }

  fs.mkdirSync(incomingDir, { recursive: true })

  const files = fs.readdirSync(unsortedDir).filter(f => !f.startsWith('.'))
  if (!files.length) {
    console.log('No files found in', unsortedDir)
    return
  }

  for (const file of files) {
    try {
      const absSrc = path.join(unsortedDir, file)
      const nameOnly = path.parse(file).name
      const slug = slugify(nameOnly)

      const dst = path.join(incomingDir, file)
      fs.copyFileSync(absSrc, dst)
      console.log('\nProcessing', file, '→ product slug:', slug)

      const scriptDir = path.join(workspace, 'scripts')
      // run process-images.js which expects to find the file under public/_incoming
      child.execFileSync(process.execPath, [path.join(scriptDir, 'process-images.js'), slug, file], { cwd: scriptDir, stdio: 'inherit' })

      // optional: remove the incoming copy to avoid re-processing
      try { fs.unlinkSync(dst) } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('Failed processing', file, err && err.message)
    }
  }
}

main().catch(err => { console.error(err); process.exit(1) })
