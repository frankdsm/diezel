# Diezel

A simple, powerful React framework with RSC support.

Diezel combines the best ideas from Next.js, Remix, TanStack Start, and Hono into a cohesive framework that prioritizes simplicity and developer experience - like Caddy vs Traefik.

## Quick Start

```bash
# Create a new project
npx diezel create my-app
cd my-app

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Features

- **React Server Components** - Stream UI from server to client
- **Server Actions** - `'use server'` directive for seamless server-side mutations
- **File-based Routing** - Next.js App Router style (`src/app/`)
- **API Routes** - Hono-style code-first API definitions
- **Vite + Nitro** - Vite for dev, Nitro for production
- **Instant HMR** - Fast development with Vite
- **TypeScript** - Full type inference out of the box

## Project Structure

```
src/
├── app/              # File-based page routes (RSC)
│   ├── layout.tsx    # Root layout (wraps all pages)
│   ├── page.tsx      # / (home page)
│   ├── about/
│   │   └── page.tsx  # /about
│   └── blog/
│       ├── page.tsx       # /blog
│       └── [slug]/
│           └── page.tsx   # /blog/:slug (dynamic route)
├── api/              # Code-first API routes
│   ├── index.ts      # Main API router
│   └── posts.ts      # Modular API routes
├── components/       # Shared components
│   └── counter.tsx   # 'use client' for interactivity
└── db/               # Database (optional)
    └── schema.ts
```

## Pages (React Server Components)

Create pages by adding `page.tsx` files to `src/app/`. The folder path becomes the URL.

### Basic Page

```tsx
// src/app/about/page.tsx → /about
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Welcome to our site!</p>
    </div>
  );
}
```

### With Data Loading

Pages are server components by default - fetch data directly:

```tsx
// src/app/posts/[id]/page.tsx → /posts/:id
import { db } from "../../../db";

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await db.posts.find(params.id);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

### Layouts

Create `layout.tsx` in any folder for nested layouts:

```tsx
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>My App</title>
      </head>
      <body>
        <nav>{/* navigation */}</nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
```

### Route Patterns

| File                          | URL                   |
| ----------------------------- | --------------------- |
| `app/page.tsx`                | `/`                   |
| `app/about/page.tsx`          | `/about`              |
| `app/blog/page.tsx`           | `/blog`               |
| `app/blog/[slug]/page.tsx`    | `/blog/:slug`         |
| `app/docs/[...path]/page.tsx` | `/docs/*` (catch-all) |

### Navigation

Use native `<a>` tags for navigation - full page navigations with RSC streaming:

```tsx
function Navigation() {
  return (
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/blog/hello">Blog Post</a>
    </nav>
  );
}
```

## API Routes

Define API routes explicitly in `src/api/` using a Hono-like fluent API.

### Basic API

```ts
// src/api/index.ts
import { api } from "diezel";

export default api()
  .get("/health", () => ({
    status: "ok",
    timestamp: Date.now(),
  }))

  .get("/posts", async () => {
    return await db.posts.findMany();
  })

  .post("/posts", async ({ body }) => {
    const data = await body<{ title: string; content: string }>();
    return await db.posts.create(data);
  });
```

### Modular Routes

```ts
// src/api/users.ts
import { api } from "diezel";

export const users = api()
  .get("/", () => getUsers())
  .get("/:id", ({ params }) => getUser(params.id))
  .post("/", async ({ body }) => {
    const data = await body<CreateUserInput>();
    return createUser(data);
  })
  .delete("/:id", ({ params }) => deleteUser(params.id));

// src/api/index.ts
import { api } from "diezel";
import { users } from "./users";

export default api().use("/users", users); // Mounts at /api/users
```

### API Context

Handlers receive a context object with:

```ts
interface ApiContext {
  req: Request; // Original request
  params: Record<string, string>; // Route params
  query: URLSearchParams; // Query string
  headers: Headers; // Request headers
  body<T>(): Promise<T>; // Parse body as JSON/form
  json<T>(data: T): Response; // JSON response
  text(data: string): Response;
  redirect(url: string): Response;
}
```

## Server Actions

Use the `'use server'` directive for server-side mutations with full type safety.

### Define Server Actions

```ts
// src/actions/posts.ts
"use server";

import { db } from "../db";

export async function createPost(data: { title: string; content: string }) {
  const post = await db.posts.create(data);
  return post;
}

export async function deletePost(id: number) {
  await db.posts.delete(id);
  return { success: true };
}
```

### Use in Client Components

```tsx
// src/components/PostForm.tsx
"use client";
import { createPost } from "../actions/posts";

export function PostForm() {
  async function handleSubmit(formData: FormData) {
    const post = await createPost({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    });
    console.log("Created:", post.id);
  }

  return (
    <form action={handleSubmit}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

### Use in Server Components

Server actions can also be used directly in forms within server components:

```tsx
// src/app/new-post/page.tsx
import { createPost } from "../../actions/posts";
import { redirect } from "diezel/server";

export default function NewPostPage() {
  async function handleCreate(formData: FormData) {
    "use server";
    await createPost({
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    });
    redirect("/posts");
  }

  return (
    <form action={handleCreate}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create</button>
    </form>
  );
}
```

## Search Params

Type-safe URL search parameter handling, inspired by nuqs.

### Server-Side (in Loaders)

```tsx
import { createRoute, parse } from "diezel";

export default createRoute({
  loader: async ({ searchParams }) => {
    // With parse and default
    const page = searchParams.get("page", { parse: parse.number, default: 1 }); // number
    const sort = searchParams.get("sort", {
      parse: parse.enum("asc", "desc"),
      default: "asc",
    }); // 'asc' | 'desc'
    const tags = searchParams.get("tags", {
      parse: parse.array(),
      default: [],
    }); // string[]

    // Convenience methods (shortcuts)
    const active = searchParams.getBoolean("active", false); // boolean
    const name = searchParams.getString("name", "anonymous"); // string
    const count = searchParams.getNumber("count", 10); // number

    return await getPosts({ page, sort, tags, active });
  },
  component: ({ data }) => <PostList posts={data} />,
});
```

### API

```ts
// Main get()
searchParams.get("key"); // string | null
searchParams.get("key", "fallback"); // string (shorthand)
searchParams.get("key", { parse: parse.number, default: 1 }); // number
searchParams.get("key", { parse: parse.enum("a", "b"), default: "a" }); // 'a' | 'b'

// Convenience methods
searchParams.getString("name", "default"); // string (same as get('name', 'default'))
searchParams.getNumber("page", 1); // number
searchParams.getInt("count", 0); // integer
searchParams.getBoolean("active", false); // boolean
searchParams.getArray("tags"); // string[] (comma-separated)
searchParams.getArray("tags", "|"); // string[] (custom separator)
searchParams.getNumbers("ids"); // number[] (comma-separated)
searchParams.has("key"); // boolean
```

### Built-in Parsers

```ts
import { parse } from "diezel";

parse.string; // string (identity)
parse.number; // number
parse.int; // integer
parse.float; // float
parse.boolean; // boolean (true/1/yes → true)
parse.date; // Date
parse.json<T>(); // JSON parse
parse.array(","); // string[] (split by separator)
parse.numbers(","); // number[] (split and parse)
parse.enum("a", "b"); // union type
parse.regex(/.../); // validated string
```

## CLI Commands

```bash
diezel create <name>  # Create new project
diezel dev            # Start dev server with HMR
diezel build          # Build for production
diezel start          # Start production server
diezel generate       # Generate route types
```

## Database Integration

Diezel works with any database. Here's an example with Drizzle ORM:

```ts
// src/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date()
  ),
});

// src/db/index.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("app.db");
export const db = drizzle(sqlite, { schema });
```

## TypeScript

Full type inference out of the box:

- **Route params** are typed based on filename (`[id]` → `params.id: string`)
- **Loader data** flows to component props with full inference
- **Server functions** have end-to-end type safety
- **Search params** parsers provide type inference
- **API routes** have typed context

## Philosophy

Diezel is built on these principles:

1. **Simplicity over complexity** - Like Caddy vs Traefik
2. **Web standards** - Use Request, Response, ReadableStream
3. **Explicit over magic** - Code-first APIs, explicit imports
4. **Type safety** - Full TypeScript inference without annotations
5. **Developer experience** - Fast HMR, clear errors, minimal config

## Requirements

- Node.js 18+
- pnpm, npm, or yarn

## License

MIT
