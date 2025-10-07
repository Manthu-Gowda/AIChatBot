import OpenAI from 'openai'

export async function chatOpenAI(apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  const client = new OpenAI({ apiKey })
  const msgs = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt } as const] : []),
    ...messages,
  ]
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: msgs as any,
    temperature: 0.2,
  })
  const text = resp.choices?.[0]?.message?.content ?? ''
  return text
}

export async function streamOpenAI(
  apiKey: string,
  messages: { role: string; content: string }[],
  systemPrompt: string | undefined,
  onToken: (t: string) => void
) {
  const client = new OpenAI({ apiKey })
  const msgs = [
    ...(systemPrompt ? [{ role: 'system', content: systemPrompt } as const] : []),
    ...messages,
  ]
  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: msgs as any,
    temperature: 0.2,
    stream: true,
  })
  for await (const chunk of stream as any) {
    const delta = chunk?.choices?.[0]?.delta?.content
    if (delta) onToken(delta)
  }
}
