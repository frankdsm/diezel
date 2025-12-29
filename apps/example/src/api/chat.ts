import 'dotenv/config'
import { Hono } from 'hono'
import { openai } from '@ai-sdk/openai'
import { streamText, type UIMessage, convertToModelMessages } from 'ai'

interface ChatBody {
  messages: UIMessage[]
}

export const chat = new Hono()

chat.post('/', async (c) => {
  const { messages } = await c.req.json<ChatBody>()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: await convertToModelMessages(messages),
    system: 'You are a helpful assistant for Diezel, a full-stack React framework. Keep responses concise and helpful. Use markdown for code examples.',
    onError: (error) => {
      console.error('[Chat API Error]', error)
    }
  })

  return result.toUIMessageStreamResponse()
})
