import { build as viteBuild } from 'vite'
import react from '@vitejs/plugin-react'
import { createNitro, build as nitroBuild, prepare, copyPublicAssets } from 'nitropack'
import { join } from 'path'
import { mkdir, writeFile } from 'fs/promises'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { discoverRoutes } from '../routes'
import replace from '@rollup/plugin-replace'

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
}

async function findClientComponents(dir: string): Promise<string[]> {
  const components: string[] = []
  if (!existsSync(dir)) return components

  const files = readdirSync(dir, { recursive: true })
  for (const file of files) {
    const filePath = join(dir, file.toString())
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      try {
        const content = readFileSync(filePath, 'utf-8')
        if (content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"')) {
          components.push(filePath)
        }
      } catch {}
    }
  }
  return components
}

/**
 * Creates a Rollup plugin that wraps 'use client' components with hydration markers.
 * Uses the `load` hook which runs before esbuild transforms the code.
 */
function createUseClientSSRPlugin(clientComponentPaths: string[]) {
  const clientSet = new Set(clientComponentPaths)

  return {
    name: 'diezel:use-client-ssr',
    // Use load hook - runs before esbuild transform
    load(id: string) {
      if (!clientSet.has(id)) return null

      // Read the original source file
      const code = readFileSync(id, 'utf-8')

      // Get module path for hydration marker
      const srcIndex = id.indexOf('/src/')
      const modulePath = srcIndex === -1 ? id : id.slice(srcIndex)

      // Find all exported function components (PascalCase names)
      const exports: { name: string; isDefault: boolean }[] = []

      // Match: export function ComponentName
      const funcMatches = code.matchAll(/export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g)
      for (const match of funcMatches) {
        exports.push({ name: match[1], isDefault: false })
      }

      // Match: export const ComponentName =
      const constMatches = code.matchAll(/export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=/g)
      for (const match of constMatches) {
        exports.push({ name: match[1], isDefault: false })
      }

      // Match: export default function ComponentName
      if (/export\s+default\s+function/.test(code)) {
        const defaultMatch = code.match(/export\s+default\s+function\s+(\w+)?/)
        const name = defaultMatch?.[1] || 'default'
        exports.push({ name, isDefault: true })
      }

      if (exports.length === 0) return null

      let transformed = code
      let wrapperCode = `\n// Diezel: Client component wrappers for SSR\n`
      wrapperCode += `import { createElement as __createElement } from 'react';\n\n`

      for (const exp of exports) {
        const originalName = `__Original_${exp.name}`

        // Rename original export
        if (exp.isDefault) {
          transformed = transformed.replace(
            /export\s+default\s+function\s+(\w+)?/,
            `function ${originalName}`
          )
        } else {
          transformed = transformed.replace(
            new RegExp(`export\\s+function\\s+(${exp.name})\\s*\\(`),
            `function ${originalName}(`
          )
          transformed = transformed.replace(
            new RegExp(`export\\s+const\\s+(${exp.name})\\s*=`),
            `const ${originalName} =`
          )
        }

        // Add wrapper
        const exportKeyword = exp.isDefault ? 'default ' : ''
        const funcName = exp.isDefault ? '' : exp.name
        wrapperCode += `export ${exportKeyword}function ${funcName}(props) {
  return __createElement(
    'div',
    {
      'data-diezel-island': '${modulePath}',
      'data-diezel-component': '${exp.name}',
      'data-diezel-props': JSON.stringify(props || {})
    },
    __createElement(${originalName}, props)
  );
}\n\n`
      }

      return { code: transformed + wrapperCode, map: null }
    }
  }
}

export async function build() {
  const startTime = Date.now()
  const outDir = '.diezel'

  console.log()
  console.log(`  ${c.yellow}⚡${c.reset}${c.bold}Diezel${c.reset} ${c.dim}build${c.reset}`)
  console.log()

  // Create output directories
  await mkdir(outDir, { recursive: true })
  await mkdir(join(outDir, 'public'), { recursive: true })

  // Discover routes
  console.log(`  ${c.green}✓${c.reset} Discovering routes...`)
  const routes = await discoverRoutes('./src/app')

  // Find client components
  const clientComponents = [
    ...await findClientComponents('./src/components'),
    ...await findClientComponents('./src/app')
  ]

  // Find and build CSS files from the app directory
  console.log(`  ${c.green}✓${c.reset} Building CSS...`)
  const cssFiles: string[] = []
  if (existsSync('src/app')) {
    const findCssFiles = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          findCssFiles(fullPath)
        } else if (entry.name.endsWith('.css')) {
          cssFiles.push(fullPath)
        }
      }
    }
    findCssFiles('src/app')
  }

  if (cssFiles.length > 0) {
    // Use PostCSS with @tailwindcss/postcss for CSS processing
    const postcss = (await import('postcss')).default
    const postcssConfigPath = existsSync(join(process.cwd(), 'postcss.config.mjs'))
      ? join(process.cwd(), 'postcss.config.mjs')
      : existsSync(join(process.cwd(), 'postcss.config.js'))
        ? join(process.cwd(), 'postcss.config.js')
        : null

    let postcssPlugins: any[] = []
    if (postcssConfigPath) {
      const postcssConfig = await import(postcssConfigPath)
      const config = postcssConfig.default || postcssConfig
      if (config.plugins) {
        // Load plugins from config
        for (const [name, options] of Object.entries(config.plugins)) {
          const plugin = await import(name)
          postcssPlugins.push((plugin.default || plugin)(options || {}))
        }
      }
    }

    // Concatenate all CSS files
    let combinedCss = ''
    for (const cssFile of cssFiles) {
      const content = readFileSync(cssFile, 'utf-8')
      combinedCss += content + '\n'
    }

    // Process with PostCSS
    const result = await postcss(postcssPlugins).process(combinedCss, {
      from: cssFiles[0],
      to: join(outDir, 'public', 'styles.css')
    })

    await writeFile(join(outDir, 'public', 'styles.css'), result.css)
  }

  // Build client entry
  console.log(`  ${c.green}✓${c.reset} Building client...`)

  if (clientComponents.length > 0) {
    const entryFile = join(outDir, '_entry.tsx')

    const imports = clientComponents.map((path, i) => {
      const absPath = join(process.cwd(), path)
      return `import * as Component${i} from '${absPath}'`
    }).join('\n')

    // Register all exports from each component module
    const registrations = clientComponents.map((_, i) => {
      return `  Object.keys(Component${i}).forEach(key => {
    if (typeof Component${i}[key] === 'function') {
      window.__DIEZEL_COMPONENTS__[key] = Component${i}[key]
    }
  })`
    }).join('\n')

    await writeFile(entryFile, `
${imports}
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

declare global {
  interface Window {
    __DIEZEL_COMPONENTS__: Record<string, any>
  }
}

window.__DIEZEL_COMPONENTS__ = window.__DIEZEL_COMPONENTS__ || {}
${registrations}

function hydrateIslands() {
  document.querySelectorAll('[data-diezel-component]').forEach(island => {
    const componentName = island.getAttribute('data-diezel-component')!
    const propsJson = island.getAttribute('data-diezel-props')
    const Component = window.__DIEZEL_COMPONENTS__[componentName]
    if (Component) {
      const props = propsJson ? JSON.parse(propsJson) : {}
      createRoot(island).render(createElement(Component, props))
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateIslands)
} else {
  hydrateIslands()
}
`)

    await viteBuild({
      configFile: false,
      root: process.cwd(),
      plugins: [react()],
      build: {
        outDir: join(outDir, 'public'),
        emptyOutDir: false,
        rollupOptions: {
          input: entryFile,
          output: {
            entryFileNames: 'client.js',
            chunkFileNames: '[name].[hash].js'
          }
        },
        minify: true
      },
      resolve: {
        alias: { '@': join(process.cwd(), 'src') }
      },
      logLevel: 'warn'
    })
  }

  // Build server with Nitro
  console.log(`  ${c.green}✓${c.reset} Building server...`)

  // Create routes directory for Nitro
  const routesDir = join(outDir, 'server', 'routes')
  await mkdir(routesDir, { recursive: true })
  await mkdir(join(routesDir, 'api'), { recursive: true })

  // Create plugins directory and add dotenv plugin
  const pluginsDir = join(outDir, 'server', 'plugins')
  await mkdir(pluginsDir, { recursive: true })

  await writeFile(join(pluginsDir, 'dotenv.ts'), `
import { config } from 'dotenv'
import { join } from 'path'

export default defineNitroPlugin(() => {
  // Load .env from the directory where the server is run
  config({ path: join(process.cwd(), '.env') })
})
`)

  // Check if API routes exist and create API handler
  const apiEntryPath = join(process.cwd(), 'src', 'api', 'index.ts')
  if (existsSync(apiEntryPath)) {
    await writeFile(join(routesDir, 'api', '[...path].ts'), `
import { defineEventHandler, getRequestURL, readBody, getMethod, getHeaders } from 'h3'
import apiApp from '${apiEntryPath}'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const method = getMethod(event)
  const headers = getHeaders(event)

  // Build the API path (strip /api prefix)
  const apiPath = url.pathname.replace(/^\\/api/, '') || '/'
  const apiUrl = \`http://localhost\${apiPath}\${url.search}\`

  // Build request options
  const requestInit: RequestInit = {
    method,
    headers: headers as HeadersInit,
  }

  // Add body for non-GET requests
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      const body = await readBody(event)
      if (body) {
        requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
      }
    } catch {}
  }

  // Call the Hono app
  const fetchReq = new Request(apiUrl, requestInit)
  const response = await apiApp.fetch(fetchReq)

  // Return the response
  return response
})
`)
  }

  // Generate route info for the server
  const routeInfo = routes.pages.map(r => ({
    pattern: r.pattern,
    filePath: r.filePath,
    regex: r.regex.source
  }))

  const layoutInfo = Array.from(routes.layouts.entries()).map(([pattern, path]) => ({
    pattern,
    filePath: path
  }))

  // Generate imports for all pages and layouts
  const pageImports = routes.pages.map((r, i) => {
    const absPath = join(process.cwd(), r.filePath)
    return `import Page${i} from '${absPath}'`
  }).join('\n')

  const layoutImports = Array.from(routes.layouts.entries()).map(([, path], i) => {
    const absPath = join(process.cwd(), path)
    return `import Layout${i} from '${absPath}'`
  }).join('\n')

  const pageMap = routes.pages.map((r, i) =>
    `  '${r.pattern}': Page${i}`
  ).join(',\n')

  const layoutMap = Array.from(routes.layouts.keys()).map((pattern, i) =>
    `  '${pattern}': Layout${i}`
  ).join(',\n')

  // Create the catch-all route handler
  await writeFile(join(routesDir, '[...path].ts'), `
import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'
import { renderToPipeableStream } from 'react-dom/server'
import * as React from 'react'
import { createElement } from 'react'
import { PassThrough } from 'stream'

${pageImports}
${layoutImports}

const pages: Record<string, any> = {
${pageMap}
}

const layoutComponents: Record<string, any> = {
${layoutMap}
}

const routes = ${JSON.stringify(routeInfo, null, 2)}
const layouts = ${JSON.stringify(layoutInfo, null, 2)}

function matchRoute(pathname: string, route: any): Record<string, string> | null {
  const regex = new RegExp(route.regex)
  const match = pathname.match(regex)
  if (!match) return null

  const params: Record<string, string> = {}
  const paramNames = route.pattern.match(/\\[(\\.\\.\\.)?(\\w+)\\]/g) || []
  paramNames.forEach((param: string, i: number) => {
    const name = param.replace(/\\[(\\.\\.\\.)?/, '').replace(']', '')
    params[name] = match[i + 1] || ''
  })
  return params
}

function findLayouts(pattern: string): string[] {
  const result: string[] = []
  for (const layout of layouts) {
    if (pattern.startsWith(layout.pattern) || layout.pattern === '/') {
      result.push(layout.pattern)
    }
  }
  return result.sort((a, b) => a.length - b.length)
}

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname

  // Skip static assets
  if (pathname.startsWith('/.diezel/') || pathname.match(/\\.(js|css|ico|png|jpg|svg)$/)) {
    return
  }

  // Find matching route
  let matchedRoute = null
  let params: Record<string, string> = {}

  for (const route of routes) {
    const match = matchRoute(pathname, route)
    if (match) {
      matchedRoute = route
      params = match
      break
    }
  }

  if (!matchedRoute) {
    return { error: true, statusCode: 404, message: 'Page not found' }
  }

  try {
    // Get page component
    const PageComponent = pages[matchedRoute.pattern]
    if (!PageComponent) {
      return { error: true, statusCode: 404, message: 'Page component not found' }
    }

    // Get layouts
    const layoutPatterns = findLayouts(matchedRoute.pattern)
    const layoutModules = layoutPatterns.map(pattern => layoutComponents[pattern]).filter(Boolean)

    // Render page with params
    const searchParams = new URLSearchParams(url.search)
    let content = createElement(PageComponent, { params, searchParams })

    // Wrap in layouts (innermost first)
    for (let i = layoutModules.length - 1; i >= 0; i--) {
      content = createElement(layoutModules[i], { children: content, params })
    }

    // Use streaming to support async components
    setResponseHeader(event, 'Content-Type', 'text/html')

    return new Promise((resolve, reject) => {
      let html = ''

      const writable = new PassThrough()
      writable.on('data', (chunk) => {
        html += chunk.toString()
      })

      const { pipe } = renderToPipeableStream(content, {
        onAllReady() {
          pipe(writable)
          writable.on('end', () => {
            // Inject CSS link in head and client script before closing body tag
            let finalHtml = html.replace(
              '</head>',
              '<link rel="stylesheet" href="/.diezel/styles.css"></head>'
            )
            finalHtml = finalHtml.replace(
              '</body>',
              '<script type="module" src="/.diezel/client.js"></script></body>'
            )
            resolve(finalHtml)
          })
        },
        onError(error) {
          console.error('Render error:', error)
          reject(error)
        }
      })
    })
  } catch (error) {
    console.error('Render error:', error)
    return { error: true, statusCode: 500, message: 'Internal server error' }
  }
})
`)

  const nitro = await createNitro({
    rootDir: process.cwd(),
    srcDir: join(process.cwd(), outDir, 'server'),
    dev: false,
    preset: 'node-server',
    output: {
      dir: join(process.cwd(), outDir, 'output'),
      serverDir: join(process.cwd(), outDir, 'output', 'server'),
      publicDir: join(process.cwd(), outDir, 'output', 'public')
    },
    publicAssets: [
      { dir: join(process.cwd(), 'public'), baseURL: '/' },
      { dir: join(process.cwd(), outDir, 'public'), baseURL: '/.diezel/' }
    ],
    alias: {
      '@': join(process.cwd(), 'src')
    },
    esbuild: {
      options: {
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment'
      }
    },
    rollupConfig: {
      plugins: [
        replace({
          preventAssignment: true,
          'process.env.NODE_ENV': JSON.stringify('production')
        }),
        {
          name: 'inject-react',
          transform(code: string, id: string) {
            if (id.endsWith('.tsx') || id.endsWith('.jsx')) {
              if (!code.includes('import * as React') && !code.includes("import React from")) {
                return `import * as React from 'react';\n${code}`
              }
            }
            return null
          }
        },
createUseClientSSRPlugin(clientComponents.map(c => join(process.cwd(), c)))
      ]
    }
  })

  await prepare(nitro)
  await copyPublicAssets(nitro)
  await nitroBuild(nitro)
  await nitro.close()

  // Write build info
  await writeFile(
    join(outDir, 'build.json'),
    JSON.stringify({
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      routes: routes.pages.length,
      clientComponents: clientComponents.length
    }, null, 2)
  )

  const duration = Date.now() - startTime
  console.log()
  console.log(`  ${c.dim}Built in ${duration}ms${c.reset}`)
  console.log(`  ${c.dim}Output: ${outDir}/${c.reset}`)
  console.log()
}
