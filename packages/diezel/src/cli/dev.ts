import { createServer } from 'vite'

interface DevOptions {
  port?: number
}

export async function dev(options: DevOptions = {}) {
  const port = options.port ?? 3000

  const server = await createServer({
    root: process.cwd(),
    server: {
      port
    }
  })

  await server.listen()

  const actualPort = server.config.server.port
  console.log()
  console.log(`  \x1b[33m⚡\x1b[0m \x1b[1mDiezel\x1b[0m \x1b[2mdev server\x1b[0m`)
  console.log()
  console.log(`  \x1b[2m➜\x1b[0m  http://localhost:${actualPort}`)
  console.log()
}
