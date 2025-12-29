import { CodeBlock } from "@/components/code-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ServerStack01Icon,
  CommandLineIcon,
  Database01Icon,
  Folder01Icon,
  FlashIcon,
  Shield01Icon,
  Copy01Icon,
  GithubIcon,
} from "@hugeicons/core-free-icons";

const serverComponentCode = `// src/app/users/page.tsx
export default async function Users() {
  // Direct database access on server
  const users = await db.select()
    .from(usersTable)
    .limit(10)

  return <UserList users={users} />
}`;

const serverActionCode = `// src/actions/users.ts
'use server'

export async function createUser(data: UserInput) {
  const user = await db.insert(usersTable)
    .values(data)
    .returning()

  return user
}`;

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="py-32 md:py-40 text-center">
        <Badge variant="secondary" className="mb-4">Public Beta</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          The full-stack React framework
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Build production-ready apps with React Server Components, type-safe
          server actions, and file-based routing.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <a href="/docs">
              Get Started
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="https://github.com/diezel">
              <HugeiconsIcon icon={GithubIcon} size={16} />
              GitHub
            </a>
          </Button>
        </div>
      </section>

      {/* Full-Stack Demo */}
      <section className="py-16">
        <div className="grid md:grid-cols-2 gap-6">
          <CodeBlock
            code={serverComponentCode}
            lang="tsx"
            filename="Server Component"
          />
          <CodeBlock
            code={serverActionCode}
            lang="tsx"
            filename="Server Action"
          />
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            Everything you need
          </h2>
          <p className="text-muted-foreground">
            Full-stack features out of the box
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: ServerStack01Icon,
              title: "Server Components",
              desc: "Render on the server, stream to the client. Zero JS by default.",
            },
            {
              icon: CommandLineIcon,
              title: "Server Actions",
              desc: "Call server functions directly from client components.",
            },
            {
              icon: Database01Icon,
              title: "Database Ready",
              desc: "First-class Drizzle ORM integration with SQLite, Postgres, or MySQL.",
            },
            {
              icon: Folder01Icon,
              title: "File-Based Routing",
              desc: "Intuitive routing with layouts and dynamic segments.",
            },
            {
              icon: FlashIcon,
              title: "Vite + Nitro",
              desc: "Lightning-fast dev with HMR. Production-ready builds.",
            },
            {
              icon: Shield01Icon,
              title: "Type-Safe",
              desc: "Full TypeScript inference from database to UI.",
            },
          ].map((feature, i) => (
            <div key={i} className="p-5 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-3">
                <HugeiconsIcon
                  icon={feature.icon}
                  size={20}
                  className="text-muted-foreground"
                />
                <h3 className="font-medium">{feature.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="text-2xl font-semibold tracking-tight mb-3">
          Get started
        </h2>
        <p className="text-muted-foreground mb-6">
          Create a full-stack React app in seconds
        </p>
        <div className="inline-flex items-center gap-3 px-4 py-3 rounded-lg bg-muted font-mono text-sm">
          <span className="text-muted-foreground">$</span>
          <span>npx create-diezel my-app</span>
          <button className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
            <HugeiconsIcon icon={Copy01Icon} size={14} />
          </button>
        </div>
      </section>
    </>
  );
}
