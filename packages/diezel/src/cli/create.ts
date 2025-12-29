import * as fs from 'node:fs'
import * as path from 'node:path'
import * as readline from 'node:readline'

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
}

const templates = {
  'package.json': (name: string) => `{
  "name": "${name}",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "diezel build",
    "start": "diezel start"
  },
  "dependencies": {
    "diezel": "^0.1.0",
    "hono": "^4.6.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "@tailwindcss/vite": "^4.1.18",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3"
  }
}
`,

  'vite.config.ts': () => `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { diezel } from "diezel/vite";

export default defineConfig({
  plugins: [diezel(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom"],
  },
});
`,

'tsconfig.json': () => `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
`,

  'src/app/layout.tsx': (name: string) => `import type { LayoutProps } from "diezel";
import "./globals.css";

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${name}</title>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
`,

  'src/app/page.tsx': (name: string) => `export default function Home() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">${name}</h1>
        <p className="text-lg text-muted-foreground">
          Welcome to your new Diezel app. Edit{" "}
          <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
            src/app/page.tsx
          </code>{" "}
          to get started.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-2">Documentation</h2>
          <p className="text-muted-foreground text-sm">
            Learn about Diezel's features including Server Components, Server Actions, and API routes.
          </p>
        </div>
        <div className="p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-2">Examples</h2>
          <p className="text-muted-foreground text-sm">
            Explore example apps to see Diezel in action.
          </p>
        </div>
      </div>
    </div>
  );
}
`,

  'src/app/globals.css': () => `@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}

@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.922 0 0);
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);
    --radius: 0.625rem;
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --primary: oklch(0.985 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.396 0.141 25.723);
    --border: oklch(0.269 0 0);
    --input: oklch(0.269 0 0);
    --ring: oklch(0.439 0 0);
  }
}

@layer base {
  * {
    border-color: var(--border);
  }

  html {
    color-scheme: dark;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
  }
}
`,

  'src/api/index.ts': () => `import { Hono } from "hono";

const app = new Hono();

// Health check
app.get("/health", (c) =>
  c.json({
    status: "ok",
    timestamp: Date.now(),
  })
);

export default app;
`,

'src/lib/utils.ts': () => `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`,

  '.gitignore': () => `# Dependencies
node_modules/

# Build output
.diezel/
dist/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
pnpm-debug.log*
`
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export async function create(projectName?: string) {
  console.log(`
  ${c.yellow}diezel${c.reset} ${c.dim}create${c.reset}
`)

  // Get project name
  let name = projectName
  if (!name) {
    name = await prompt(`  ${c.cyan}?${c.reset} Project name: `)
    if (!name) {
      console.error(`  ${c.red}Error: Project name is required${c.reset}`)
      process.exit(1)
    }
  }

  const targetDir = path.resolve(process.cwd(), name)

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    console.error(`  ${c.red}Error: Directory "${name}" already exists${c.reset}`)
    process.exit(1)
  }

  console.log(`
  ${c.dim}Creating project in ${targetDir}${c.reset}
`)

  // Create directory structure
  const dirs = [
    '',
    'src',
    'src/app',
    'src/api',
    'src/components',
    'src/lib'
  ]

  for (const dir of dirs) {
    fs.mkdirSync(path.join(targetDir, dir), { recursive: true })
  }

  // Write template files
  for (const [filePath, templateFn] of Object.entries(templates)) {
    const fullPath = path.join(targetDir, filePath)
    const content = templateFn(name)
    fs.writeFileSync(fullPath, content)
    console.log(`  ${c.green}+${c.reset} ${filePath}`)
  }

  // Done!
  console.log(`
  ${c.green}Done!${c.reset} Created ${c.bold}${name}${c.reset}

  ${c.dim}Next steps:${c.reset}

    cd ${name}
    pnpm install
    pnpm dev

  ${c.dim}Your app will be running at${c.reset} ${c.cyan}http://localhost:3000${c.reset}
`)
}
