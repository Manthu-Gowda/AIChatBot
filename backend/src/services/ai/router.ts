import { Provider } from '@prisma/client'
import { chatOpenAI, streamOpenAI } from './openai'
import { chatDeepSeek } from './deepseek'
import { streamDeepSeek } from './deepseek'

export async function chatWithProvider(p: Provider, apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  switch (p) {
    case 'OPENAI':
      return chatOpenAI(apiKey, messages, systemPrompt)
    case 'DEEPSEEK':
      return chatDeepSeek(apiKey, messages, systemPrompt)
    case 'GEMINI':
    case 'PERPLEXITY':
      // Stubs: mimic AI response
      return `Stubbed ${p} response: ${messages[messages.length - 1]?.content ?? ''}`
    default:
      throw new Error('Unsupported provider')
  }
}

export async function streamWithProvider(
  p: Provider,
  apiKey: string,
  messages: { role: string; content: string }[],
  systemPrompt: string | undefined,
  onToken: (t: string) => void
) {
  switch (p) {
    case 'OPENAI':
      return streamOpenAI(apiKey, messages, systemPrompt, onToken)
    case 'DEEPSEEK':
      return streamDeepSeek(apiKey, messages, systemPrompt, onToken)
    case 'GEMINI':
    case 'PERPLEXITY': {
      // Stream a stubbed response word-by-word
      const text = `Stubbed ${p} response: ${messages[messages.length - 1]?.content ?? ''}`
      const parts = text.split(/(\s+)/)
      for (const part of parts) { onToken(part); await new Promise(r => setTimeout(r, 5)) }
      return
    }
    default:
      throw new Error('Unsupported provider')
  }
}
