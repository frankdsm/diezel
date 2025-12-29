import { CodeBlock } from "@/components/code-block";

const sections = [
  { id: "quick-start", title: "Quick Start" },
  { id: "project-structure", title: "Project Structure" },
  { id: "pages", title: "Pages" },
  { id: "layouts", title: "Layouts" },
  { id: "server-actions", title: "Server Actions" },
  { id: "client-components", title: "Client Components" },
  { id: "api-routes", title: "API Routes" },
  { id: "database", title: "Database" },
];

const pageCode = `export default async function UsersPage() {
  const users = await db.select().from(usersTable)

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}`;

const layoutCode = `export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head><title>My App</title></head>
      <body>
        <nav>...</nav>
        <main>{children}</main>
      </body>
    </html>
  )
}`;

const serverActionCode = `'use server'

export async function createUser(name: string, email: string) {
  return await db.insert(users).values({ name, email }).returning()
}`;

const clientComponentCode = `'use client'
import { createUser } from '@/actions/users'

export function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" />
      <input name="email" />
      <button>Create</button>
    </form>
  )
}`;

const apiRouteCode = `import { Hono } from 'hono'

const app = new Hono()

app.get('/users', async (c) => {
  const users = await db.select().from(usersTable)
  return c.json(users)
})

app.post('/users', async (c) => {
  const body = await c.req.json()
  const user = await db.insert(usersTable).values(body).returning()
  return c.json(user, 201)
})

export default app`;

const dbCode = `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
})`;

export default function DocsPage() {
  return (
    <div className="py-16 flex gap-12">
      {/* Sidebar */}
      <aside className="hidden lg:block w-48 flex-shrink-0">
        <nav className="sticky top-24 space-y-1">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-primary mb-3">Documentation</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Get Started
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Build full-stack React apps with Diezel.
          </p>
        </div>

        {/* Quick Start */}
        <section id="quick-start" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Quick Start</h2>
          <div className="space-y-4">
            <CodeBlock code="pnpm create diezel my-app" lang="bash" />
            <CodeBlock code="cd my-app && pnpm dev" lang="bash" />
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Then open</span>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-mono text-sm hover:bg-primary/20 transition-colors"
              >
                localhost:3000
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Project Structure */}
        <section id="project-structure" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Project Structure
          </h2>
          <CodeBlock
            code={`src/
├── app/           # File-based routes
│   ├── layout.tsx # Root layout
│   ├── page.tsx   # Home (/)
│   └── about/
│       └── page.tsx
├── actions/       # Server actions
├── components/    # React components
├── api/           # API routes
└── db/            # Database`}
            lang="text"
          />
        </section>

        {/* Pages */}
        <section id="pages" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Pages</h2>
          <p className="text-muted-foreground mb-4">
            Server Components by default. Create <code className="text-primary">page.tsx</code> to add routes.
          </p>
          <CodeBlock code={pageCode} lang="tsx" filename="src/app/users/page.tsx" />
        </section>

        {/* Layouts */}
        <section id="layouts" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Layouts</h2>
          <p className="text-muted-foreground mb-4">
            Wrap pages with shared UI using <code className="text-primary">layout.tsx</code>.
          </p>
          <CodeBlock code={layoutCode} lang="tsx" filename="src/app/layout.tsx" />
        </section>

        {/* Server Actions */}
        <section id="server-actions" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Server Actions</h2>
          <p className="text-muted-foreground mb-4">
            Call server functions from client components.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <CodeBlock code={clientComponentCode} lang="tsx" filename="src/components/form.tsx" />
            <CodeBlock code={serverActionCode} lang="tsx" filename="src/actions/users.ts" />
          </div>
        </section>

        {/* Client Components */}
        <section id="client-components" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Client Components</h2>
          <p className="text-muted-foreground mb-4">
            Add <code className="text-primary">'use client'</code> for interactivity.
          </p>
          <CodeBlock
            code={`'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
}`}
            lang="tsx"
            filename="src/components/counter.tsx"
          />
        </section>

        {/* API Routes */}
        <section id="api-routes" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">API Routes</h2>
          <p className="text-muted-foreground mb-4">
            Build REST APIs at <code className="text-primary">/api</code>.
          </p>
          <CodeBlock code={apiRouteCode} lang="tsx" filename="src/api/index.ts" />
        </section>

        {/* Database */}
        <section id="database" className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Database</h2>
          <p className="text-muted-foreground mb-4">
            Use Drizzle ORM with SQLite, Postgres, or MySQL.
          </p>
          <CodeBlock code={dbCode} lang="tsx" filename="src/db/schema.ts" />
        </section>
      </div>
    </div>
  );
}
