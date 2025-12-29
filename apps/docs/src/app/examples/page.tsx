import { CodeBlock } from "@/components/code-block";
import { DemoChat } from "@/components/demo-chat";

const examples = [
  { id: "ai-chat", title: "AI Chat", icon: "💬" },
  { id: "forms", title: "Forms", icon: "📝" },
  { id: "auth", title: "Authentication", icon: "🔐", soon: true },
  { id: "realtime", title: "Realtime", icon: "⚡", soon: true },
];

const aiRouteCode = `import { Hono } from 'hono'
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const chat = new Hono()

chat.post('/', async (c) => {
  const { messages } = await c.req.json()
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages,
  })
  return result.toDataStreamResponse()
})`;

const chatComponentCode = `'use client'
import { useChat } from 'ai/react'

export function Chat() {
  const { messages, input, handleSubmit, handleInputChange } = useChat()

  return (
    <div>
      {messages.map(m => <p key={m.id}>{m.content}</p>)}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  )
}`;

const formActionCode = `'use server'

export async function submitContact(data: {
  name: string
  email: string
  message: string
}) {
  // Validate, save to database, send email, etc.
  console.log('Contact form submitted:', data)
  return { success: true }
}`;

const formComponentCode = `'use client'
import { submitContact } from '@/actions/contact'

export function ContactForm() {
  async function handleSubmit(formData: FormData) {
    await submitContact({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string,
    })
  }

  return (
    <form action={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" required />
      <button type="submit">Send</button>
    </form>
  )
}`;

export default function ExamplesPage() {
  return (
    <div className="py-16 flex gap-12">
      {/* Sidebar */}
      <aside className="hidden lg:block w-48 shrink-0">
        <nav className="sticky top-24 space-y-1">
          {examples.map((example) => (
            <a
              key={example.id}
              href={`#${example.id}`}
              className={`flex items-center gap-2 py-1.5 text-sm transition-colors ${
                example.soon
                  ? "text-muted-foreground/50 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{example.icon}</span>
              <span>{example.title}</span>
              {example.soon && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  Soon
                </span>
              )}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-primary mb-3">Examples</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            AI Chat
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Build AI-powered chat with the Vercel AI SDK. Try the live demo below.
          </p>
        </div>

        {/* AI Chat Demo */}
        <section id="ai-chat" className="mb-16 scroll-mt-24">
          <div className="rounded-2xl border border-border bg-zinc-900/50 overflow-hidden mb-6">
            <div className="flex items-center justify-center px-4 py-3 relative">
              <div className="flex gap-2 absolute left-4">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <span className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live Chat Demo
              </span>
            </div>
            <DemoChat />
          </div>
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Frontend Component
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use the Vercel AI SDK's useChat hook for streaming responses.
                </p>
              </div>
              <CodeBlock
                code={chatComponentCode}
                lang="tsx"
                filename="src/components/chat.tsx"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  API Route
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create a streaming endpoint with Diezel and any AI provider.
                </p>
              </div>
              <CodeBlock
                code={aiRouteCode}
                lang="tsx"
                filename="src/api/chat.ts"
              />
            </div>
          </div>
        </section>

        {/* Forms */}
        <section id="forms" className="mb-16 scroll-mt-24">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Forms</h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Type-safe form handling with Zod validation on the server.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Frontend Component
                </h3>
                <p className="text-sm text-muted-foreground">
                  A simple form that calls a server action directly.
                </p>
              </div>
              <CodeBlock
                code={formComponentCode}
                lang="tsx"
                filename="src/components/contact-form.tsx"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Server Action
                </h3>
                <p className="text-sm text-muted-foreground">
                  Validate form data with Zod in a server action.
                </p>
              </div>
              <CodeBlock
                code={formActionCode}
                lang="tsx"
                filename="src/actions/contact.ts"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
