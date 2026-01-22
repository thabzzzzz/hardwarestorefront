/**
 * Pin Turbopack root to frontend folder so Next doesn't try to treat
 * the repo root as workspace root and attempt cross-folder symlinks on Windows.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: '.'
  }
}

module.exports = nextConfig
