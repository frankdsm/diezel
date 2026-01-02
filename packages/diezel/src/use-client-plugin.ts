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
 * During SSR, client components are replaced with placeholder divs
 * that contain hydration data. The client will load and hydrate
 * the actual components.
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

      // Generate stub module that only exports placeholder components
      // We don't include the original code at all - no hooks will execute
      let stubCode = `// Diezel: Client component stubs for SSR\n`;
      stubCode += `// Original component code is not executed during SSR\n`;
      stubCode += `import { createElement as __createElement } from 'react';\n\n`;

      for (const exp of exports) {
        const exportKeyword = exp.isDefault ? "default " : "";
        const funcName = exp.isDefault ? "" : exp.name;

        // Export a stub that renders only a placeholder div with hydration data
        // No hooks, no state, no effects - just a div with data attributes
        stubCode += `export ${exportKeyword}function ${funcName}(props) {
  return __createElement(
    'div',
    {
      'data-diezel-island': '${modulePath}',
      'data-diezel-component': '${exp.name}',
      'data-diezel-props': JSON.stringify(props || {}),
      'style': { display: 'contents' }
    }
  );
}\n\n`;
      }

      return {
        code: stubCode,
        map: null,
      };
    },
  };
}

export default useClientPlugin;
