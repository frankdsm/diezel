import type { Plugin } from "vite";

/**
 * Check if file content starts with 'use client' directive
 */
function hasUseClientDirective(code: string): boolean {
  const firstLine = code.trim().split("\n")[0].trim();
  return (
    firstLine === "'use client'" ||
    firstLine === '"use client"' ||
    firstLine === "'use client';" ||
    firstLine === '"use client";'
  );
}

/**
 * Get module path for the virtual client glob
 * /Users/.../src/components/demo-chat.tsx -> /src/components/demo-chat.tsx
 */
function getModulePath(filePath: string): string {
  const srcIndex = filePath.indexOf("/src/");
  if (srcIndex === -1) return filePath;
  return filePath.slice(srcIndex); // Keep /src prefix
}

/**
 * Vite plugin for transforming 'use client' files during SSR
 *
 * Wraps exported components with hydration markers so the client
 * can find and hydrate them.
 */
export function useClientPlugin(): Plugin {
  return {
    name: "diezel:use-client",
    enforce: "pre",

    transform(code, id, options) {
      // Only process .ts, .tsx, .js, .jsx files
      if (!/\.(ts|tsx|js|jsx)$/.test(id)) {
        return null;
      }

      // Skip node_modules
      if (id.includes("node_modules")) {
        return null;
      }

      // Check for 'use client' directive
      if (!hasUseClientDirective(code)) {
        return null;
      }

      // Only transform during SSR - client keeps original code for hydration
      if (!options?.ssr) {
        return null;
      }

      const modulePath = getModulePath(id);

      // Find all exported function components (PascalCase names)
      const exports: { name: string; isDefault: boolean }[] = [];

      // Match: export function ComponentName
      const funcMatches = code.matchAll(
        /export\s+function\s+([A-Z][a-zA-Z0-9]*)\s*\(/g
      );
      for (const match of funcMatches) {
        exports.push({ name: match[1], isDefault: false });
      }

      // Match: export const ComponentName =
      const constMatches = code.matchAll(
        /export\s+const\s+([A-Z][a-zA-Z0-9]*)\s*=/g
      );
      for (const match of constMatches) {
        exports.push({ name: match[1], isDefault: false });
      }

      // Match: export default function ComponentName or export default function()
      if (/export\s+default\s+function/.test(code)) {
        const defaultMatch = code.match(/export\s+default\s+function\s+(\w+)?/);
        const name = defaultMatch?.[1] || "default";
        exports.push({ name, isDefault: true });
      }

      if (exports.length === 0) {
        return null;
      }

      let transformed = code;

      // Build wrapper code
      let wrapperCode = `\n// Diezel: Client component wrappers for SSR\n`;
      wrapperCode += `import { createElement as __createElement } from 'react';\n\n`;

      for (const exp of exports) {
        const originalName = `__Original_${exp.name}`;

        // Rename original export
        if (exp.isDefault) {
          // For default exports
          transformed = transformed.replace(
            /export\s+default\s+function\s+(\w+)?/,
            `function ${originalName}`
          );
        } else {
          // For named function exports
          transformed = transformed.replace(
            new RegExp(`export\\s+function\\s+(${exp.name})\\s*\\(`),
            `function ${originalName}(`
          );
          // For named const exports
          transformed = transformed.replace(
            new RegExp(`export\\s+const\\s+(${exp.name})\\s*=`),
            `const ${originalName} =`
          );
        }

        // Add wrapper
        const exportKeyword = exp.isDefault ? "default " : "";
        const funcName = exp.isDefault ? "" : exp.name;
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
}\n\n`;
      }

      return {
        code: transformed + wrapperCode,
        map: null,
      };
    },
  };
}

export default useClientPlugin;
