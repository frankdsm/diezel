#!/usr/bin/env node

import { dev } from './dev'
import { build } from './build'
import { start } from './start'
import { create } from './create'

const args = process.argv.slice(2)
const command = args[0]

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
}

function printHelp() {
  console.log(`
  ${c.yellow}diezel${c.reset} ${c.dim}v0.1.0${c.reset}

  ${c.bold}Commands:${c.reset}
    create   Create a new Diezel project
    dev      Start development server
    build    Build for production
    start    Start production server

  ${c.bold}Options:${c.reset}
    -p, --port <port>  Server port (default: 3000)
    -h, --help         Show help
`)
}

async function main() {
  if (!command || command === '-h' || command === '--help') {
    printHelp()
    process.exit(0)
  }

  const portIndex = args.indexOf('-p') !== -1 ? args.indexOf('-p') : args.indexOf('--port')
  const port = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3000

  switch (command) {
    case 'create':
      await create(args[1])
      break
    case 'dev':
      await dev({ port })
      break
    case 'build':
      await build()
      break
    case 'start':
      await start({ port })
      break
    default:
      console.error(`${c.red}Unknown command: ${command}${c.reset}`)
      printHelp()
      process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
