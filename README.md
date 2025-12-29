# Diezel

[![npm version](https://img.shields.io/npm/v/diezel.svg)](https://www.npmjs.com/package/diezel)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A simple, powerful React framework with RSC support.

Diezel combines the best ideas from Next.js, Remix, and Hono into a cohesive framework that prioritizes simplicity and developer experience.

## Features

- **React Server Components** - Stream UI from server to client with zero client JS by default
- **Server Actions** - `'use server'` directive for type-safe server mutations
- **File-based Routing** - Intuitive App Router style routing
- **API Routes** - Hono-style code-first API definitions
- **Vite + Nitro** - Lightning-fast dev server with instant HMR
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
├── api/                  # API routes
│   └── index.ts
├── actions/              # Server actions
└── components/           # Shared components
```

## Pages

Create pages by adding `page.tsx` files. The folder path becomes the URL.

```tsx
// src/app/posts/[id]/page.tsx → /posts/:id
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

### Route Patterns

| File                          | URL             |
| ----------------------------- | --------------- |
| `app/page.tsx`                | `/`             |
| `app/about/page.tsx`          | `/about`        |
| `app/blog/[slug]/page.tsx`    | `/blog/:slug`   |
| `app/docs/[...path]/page.tsx` | `/docs/*`       |

## API Routes

Define API routes with a Hono-like fluent API:

```ts
// src/api/index.ts
import { api } from "diezel";

export default api()
  .get("/health", () => ({ status: "ok" }))
  .get("/posts", async () => await db.posts.findMany())
  .post("/posts", async ({ body }) => {
    const data = await body<{ title: string }>();
    return await db.posts.create(data);
  });
```

## Server Actions

Use `'use server'` for type-safe mutations:

```ts
// src/actions/posts.ts
"use server";

export async function createPost(data: { title: string; content: string }) {
  return await db.posts.create(data);
}
```

```tsx
// src/components/PostForm.tsx
"use client";
import { createPost } from "../actions/posts";

export function PostForm() {
  return (
    <form action={async (formData) => {
      await createPost({
        title: formData.get("title") as string,
        content: formData.get("content") as string,
      });
    }}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create</button>
    </form>
  );
}
```

## CLI Commands

```bash
diezel create <name>   # Create new project
diezel dev             # Start dev server
diezel build           # Build for production
diezel start           # Start production server
```

## Philosophy

1. **Simplicity** - Minimal config, intuitive APIs
2. **Web Standards** - Built on Request, Response, and streams
3. **Type Safety** - Full TypeScript inference without annotations
4. **Performance** - Vite for dev, Nitro for production

## Requirements

- Node.js 18+
- pnpm, npm, or yarn

## License

MIT
