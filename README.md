# Diezel

[![npm version](https://img.shields.io/npm/v/diezel.svg)](https://www.npmjs.com/package/diezel)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A simple, powerful React framework with RSC support powered by Vite and Hono.

## Features

- **React Server Components** - Stream UI from server to client with zero client JS by default
- **Server Actions** - `'use server'` directive for type-safe server mutations
- **File-based Routing** - Intuitive App Router style routing in `src/app/`
- **Hono API Routes** - Fast, type-safe API routes with Hono
- **Vite Powered** - Lightning-fast dev server with instant HMR
- **TypeScript** - Full type inference out of the box

## Quick Start

```bash
npx create-diezel my-app
cd my-app
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/                  # File-based routes (RSC)
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page (/)
│   └── blog/
│       └── [slug]/
│           └── page.tsx  # Dynamic route (/blog/:slug)
├── api/                  # Hono API routes
│   └── index.ts
├── actions/              # Server actions
└── components/           # Shared components
```

## Pages

Create pages by adding `page.tsx` files. The folder path becomes the URL. Pages are server components by default.

```tsx
// src/app/posts/[id]/page.tsx → /posts/:id
import type { PageProps } from 'diezel'

export default async function PostPage({ params, searchParams }: PageProps) {
  const post = await db.posts.find(params.id)

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### Layouts

Layouts wrap pages and persist across navigation:

```tsx
// src/app/layout.tsx
import type { LayoutProps } from 'diezel'

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>My App</title>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Route Patterns

| File                          | URL             |
| ----------------------------- | --------------- |
| `app/page.tsx`                | `/`             |
| `app/about/page.tsx`          | `/about`        |
| `app/blog/[slug]/page.tsx`    | `/blog/:slug`   |
| `app/docs/[...path]/page.tsx` | `/docs/*`       |

## API Routes (Hono)

Diezel uses [Hono](https://hono.dev) for API routes. Create your API in `src/api/index.ts`:

```ts
// src/api/index.ts
import { Hono } from 'diezel'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/posts', async (c) => {
  const posts = await db.posts.findMany()
  return c.json(posts)
})

app.post('/posts', async (c) => {
  const data = await c.req.json()
  const post = await db.posts.create(data)
  return c.json(post, 201)
})

export default app
```

Routes are accessible at `/api/*`. For example, `/api/health` or `/api/posts`.

### Modular Routes

Split your API into modules:

```ts
// src/api/users.ts
import { Hono } from 'diezel'

export const users = new Hono()

users.get('/', (c) => c.json(getUsers()))
users.get('/:id', (c) => c.json(getUser(c.req.param('id'))))
users.post('/', async (c) => {
  const data = await c.req.json()
  return c.json(createUser(data), 201)
})

// src/api/index.ts
import { Hono } from 'diezel'
import { users } from './users'

const app = new Hono()
app.route('/users', users)  // /api/users/*

export default app
```

## Server Actions

Use `'use server'` for type-safe mutations from client components:

```ts
// src/actions/posts.ts
'use server'

export async function createPost(data: { title: string; content: string }) {
  return await db.posts.create(data)
}

export async function deletePost(id: number) {
  await db.posts.delete(id)
  return { success: true }
}
```

```tsx
// src/components/PostForm.tsx
'use client'
import { createPost } from '../actions/posts'

export function PostForm() {
  async function handleSubmit(formData: FormData) {
    const post = await createPost({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    })
    console.log('Created:', post.id)
  }

  return (
    <form action={handleSubmit}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create</button>
    </form>
  )
}
```

## Client Components

Mark components that need interactivity with `'use client'`:

```tsx
// src/components/Counter.tsx
'use client'
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

Client components are automatically hydrated on the client.

## Configuration

Configure Diezel in your `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { diezel } from 'diezel/vite'

export default defineConfig({
  plugins: [diezel(), react()],
})
```

## CLI Commands

```bash
diezel dev             # Start dev server
diezel build           # Build for production
diezel start           # Start production server
```

## Requirements

- Node.js 18+
- pnpm, npm, or yarn

## License

MIT
