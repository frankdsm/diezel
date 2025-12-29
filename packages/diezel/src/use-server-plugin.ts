import type { Plugin } from 'vite'
import { readFileSync } from 'fs'

/**
 * Check if file content starts with 'use server' directive
 */
function hasUseServerDirective(code: string): boolean {
  const firstLine = code.trim().split('\n')[0].trim()
  return firstLine === "'use server'" || firstLine === '"use server"'
}

/**
 * Extract exported function names from TypeScript/JavaScript content
 */
function extractExportedFunctions(code: string): string[] {
  const functions: string[] = []

  // Match: export async function name(
  // Match: export function name(
  const functionRegex = /export\s+(?:async\s+)?function\s+(\w+)\s*\(/g
  let match
  while ((match = functionRegex.exec(code)) !== null) {
    functions.push(match[1])
  }

  // Match: export const name = async (
  // Match: export const name = (
  // Match: export const name = async function
  const constRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?(?:function\s*)?\(/g
  while ((match = constRegex.exec(code)) !== null) {
    functions.push(match[1])
  }

  return functions
}

/**
 * Generate client stub code that calls the server action via fetch
 */
function generateClientStub(filePath: string, functionNames: string[]): string {
  const imports = `import { createActionReference } from 'diezel/server-actions';\n\n`

  const stubs = functionNames.map(name => {
    const actionId = `${filePath}:${name}`
    return `export const ${name} = createActionReference('${actionId}');`
  }).join('\n')

  return imports + stubs
}

/**
 * Generate server registration code
 */
function generateServerRegistration(filePath: string, originalCode: string, functionNames: string[]): string {
  const registrations = functionNames.map(name => {
    const actionId = `${filePath}:${name}`
    return `registerAction('${actionId}', ${name});`
  }).join('\n')

  return `import { registerAction } from 'diezel/server-actions';\n\n${originalCode}\n\n${registrations}`
}

/**
 * Vite plugin for transforming 'use server' files
 */
export function useServerPlugin(): Plugin {
  return {
    name: 'diezel:use-server',
    enforce: 'pre',

    transform(code, id, options) {
      // Only process .ts, .tsx, .js, .jsx files
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
        return null
      }

      // Skip node_modules
      if (id.includes('node_modules')) {
        return null
      }

      // Check for 'use server' directive
      if (!hasUseServerDirective(code)) {
        return null
      }

      const functions = extractExportedFunctions(code)
      if (functions.length === 0) {
        return null
      }

      // For SSR (server-side), register the actions
      if (options?.ssr) {
        return {
          code: generateServerRegistration(id, code, functions),
          map: null
        }
      }

      // For client-side, generate stubs
      return {
        code: generateClientStub(id, functions),
        map: null
      }
    }
  }
}

export default useServerPlugin
