#!/usr/bin/env node
const { spawn } = require('child_process')

// Use npx to run the local `next` binary so the CLI parsing is consistent
const args = ['next', 'dev', '--turbo', 'false']
const child = spawn('npx', args, { stdio: 'inherit' })

child.on('exit', (code) => process.exit(code))
child.on('error', (err) => {
  console.error('Failed to start next via npx:', err)
  process.exit(1)
})
