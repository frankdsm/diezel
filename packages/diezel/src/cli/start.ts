import { join } from 'path'
import { existsSync } from 'fs'

interface StartOptions {
  port?: number
}

export async function start(options: StartOptions = {}) {
  const port = options.port ?? 3000
  const outDir = '.diezel/output'

  if (!existsSync(outDir)) {
    console.error('\x1b[31mError: Build output not found. Run `diezel build` first.\x1b[0m')
    process.exit(1)
  }

  process.env.PORT = String(port)
  process.env.NITRO_PORT = String(port)
  process.env.NITRO_NO_BANNER = '1'

  console.log()
  console.log(`  \x1b[33m⚡\x1b[0m \x1b[1mDiezel\x1b[0m \x1b[2mproduction server\x1b[0m`)
  console.log()
  console.log(`  \x1b[2m➜\x1b[0m  http://localhost:${port}`)
  console.log()

  // Import and run the Nitro server
  const serverPath = join(process.cwd(), outDir, 'server', 'index.mjs')
  await import(serverPath)
}
