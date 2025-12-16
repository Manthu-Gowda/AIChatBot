import { Provider } from '@prisma/client'
import { chatOpenAI, streamOpenAI } from './openai'
import { chatDeepSeek } from './deepseek'
import { streamDeepSeek } from './deepseek'
import { chatGemini, streamGemini } from './gemini'
import { chatGroq, streamGroq } from './groq'

export async function chatWithProvider(p: Provider, apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  switch (p) {
    case 'OPENAI':
      return chatOpenAI(apiKey, messages, systemPrompt)
    case 'DEEPSEEK':
      return chatDeepSeek(apiKey, messages, systemPrompt)
    case 'GEMINI':
      return chatGemini(apiKey, messages, systemPrompt)
    case 'PERPLEXITY':
    case 'ANTHROPIC':
    case 'MISTRAL':
    case 'OPENROUTER':
    case 'GROQ':
      return chatGroq(apiKey, messages, systemPrompt)
    case 'PERPLEXITY':
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
      return streamGemini(apiKey, messages, systemPrompt, onToken)
    case 'PERPLEXITY':
    case 'ANTHROPIC':
    case 'MISTRAL':
    case 'OPENROUTER':
    case 'GROQ':
      return streamGroq(apiKey, messages, systemPrompt, onToken)
    case 'PERPLEXITY':
    default:
      throw new Error('Unsupported provider')
  }
}
