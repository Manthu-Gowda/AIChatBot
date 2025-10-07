import OpenAI from 'openai'

// DeepSeek offers an OpenAI-compatible API at https://api.deepseek.com
// Use models like 'deepseek-chat' or 'deepseek-reasoner'.
export async function chatDeepSeek(apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
  const msgs = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt } as const] : []),
    ...messages,
  ]
  const resp = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: msgs as any,
    temperature: 0.2,
  })
  const text = resp.choices?.[0]?.message?.content ?? ''
  return text
}

export async function streamDeepSeek(
  apiKey: string,
  messages: { role: string; content: string }[],
  systemPrompt: string | undefined,
  onToken: (t: string) => void
) {
  const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })
  const msgs = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt } as const] : []),
    ...messages,
  ]
  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: msgs as any,
    temperature: 0.2,
    stream: true,
  })
  for await (const chunk of stream as any) {
    const delta = chunk?.choices?.[0]?.delta?.content
    if (delta) onToken(delta)
  }
}
