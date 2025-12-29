import { readdir } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

export interface Route {
  pattern: string
  filePath: string
  regex: RegExp
  paramNames: string[]
}

export interface DiscoveredRoutes {
  pages: Route[]
  layouts: Map<string, string> // pattern -> filePath
}

/**
 * Convert file path to route pattern
 * src/app/posts/[id]/page.tsx -> /posts/:id
 */
function fileToPattern(filePath: string, appDir: string): string {
  // Normalize both paths to handle ./ prefix and different separators
  const normalizedFilePath = filePath.replace(/\\/g, '/')
  const normalizedAppDir = appDir.replace(/^\.\//, '').replace(/\\/g, '/')

  // Find where appDir ends in the file path
  const appDirIndex = normalizedFilePath.indexOf(normalizedAppDir)
  if (appDirIndex === -1) return '/'

  const relative = normalizedFilePath
    .slice(appDirIndex + normalizedAppDir.length)
    .replace(/\/page\.(tsx?|jsx?)$/, '')
    .replace(/\/layout\.(tsx?|jsx?)$/, '')

  if (!relative || relative === '') return '/'

  // Ensure it starts with /
  const pattern = relative.startsWith('/') ? relative : '/' + relative

  // Convert [param] to :param and [...slug] to *
  return pattern
    .replace(/\[\.\.\.(\w+)\]/g, '*')
    .replace(/\[(\w+)\]/g, ':$1')
}

/**
 * Convert pattern to regex for matching
 */
function patternToRegex(pattern: string): { regex: RegExp; paramNames: string[] } {
  const paramNames: string[] = []

  const regexStr = pattern
    .replace(/\//g, '\\/')
    .replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name)
      return '([^/]+)'
    })
    .replace(/\*/g, () => {
      paramNames.push('slug')
      return '(.*)'
    })

  return {
    regex: new RegExp(`^${regexStr}$`),
    paramNames
  }
}

/**
 * Recursively scan directory for route files
 */
async function scanDir(dir: string, appDir: string): Promise<{ pages: string[]; layouts: string[] }> {
  const pages: string[] = []
  const layouts: string[] = []

  if (!existsSync(dir)) return { pages, layouts }

  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      const sub = await scanDir(fullPath, appDir)
      pages.push(...sub.pages)
      layouts.push(...sub.layouts)
    } else if (entry.isFile()) {
      const ext = extname(entry.name)
      if (!['.ts', '.tsx', '.js', '.jsx'].includes(ext)) continue

      const name = basename(entry.name, ext)
      if (name === 'page') pages.push(fullPath)
      if (name === 'layout') layouts.push(fullPath)
    }
  }

  return { pages, layouts }
}

/**
 * Discover all routes in the app directory
 */
export async function discoverRoutes(appDir: string): Promise<DiscoveredRoutes> {
  const { pages, layouts } = await scanDir(appDir, appDir)

  const routes: Route[] = pages.map(filePath => {
    const pattern = fileToPattern(filePath, appDir)
    const { regex, paramNames } = patternToRegex(pattern)
    return { pattern, filePath, regex, paramNames }
  })

  // Sort by specificity: static routes first, then dynamic, then catch-all
  routes.sort((a, b) => {
    const aHasParam = a.pattern.includes(':')
    const bHasParam = b.pattern.includes(':')
    const aHasCatchAll = a.pattern.includes('*')
    const bHasCatchAll = b.pattern.includes('*')

    if (!aHasParam && bHasParam) return -1
    if (aHasParam && !bHasParam) return 1
    if (!aHasCatchAll && bHasCatchAll) return -1
    if (aHasCatchAll && !bHasCatchAll) return 1
    return b.pattern.length - a.pattern.length
  })

  const layoutMap = new Map<string, string>()
  for (const filePath of layouts) {
    const pattern = fileToPattern(filePath, appDir)
    layoutMap.set(pattern, filePath)
  }

  return { pages: routes, layouts: layoutMap }
}

/**
 * Match a pathname against a route
 */
export function matchRoute(pathname: string, route: Route): Record<string, string> | null {
  // Normalize: remove trailing slash except for root
  const normalized = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname

  const match = normalized.match(route.regex)
  if (!match) return null

  const params: Record<string, string> = {}
  route.paramNames.forEach((name, i) => {
    params[name] = match[i + 1]
  })

  return params
}

/**
 * Find applicable layouts for a route pattern
 */
export function findLayouts(routePattern: string, layouts: Map<string, string>): string[] {
  const result: string[] = []

  // Always include root layout if exists
  if (layouts.has('/')) {
    result.push(layouts.get('/')!)
  }

  // Find nested layouts
  const segments = routePattern.split('/').filter(Boolean)
  let currentPath = ''

  for (const segment of segments) {
    // Skip dynamic segments for layout matching
    if (segment.startsWith(':') || segment === '*') continue

    currentPath += '/' + segment
    if (layouts.has(currentPath)) {
      result.push(layouts.get(currentPath)!)
    }
  }

  return result
}
