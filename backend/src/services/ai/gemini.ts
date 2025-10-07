import { request as httpsRequest } from 'https'

type Msg = { role: string; content: string }

async function postJson(urlStr: string, body: any, headers: Record<string, string> = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr)
    const req = httpsRequest(
      {
        method: 'POST',
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: { 'Content-Type': 'application/json', ...headers },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          const status = res.statusCode || 0
          if (status >= 200 && status < 300) {
            try {
              const json = data ? JSON.parse(data) : {}
              resolve(json)
            } catch (e) {
              reject(new Error('Invalid JSON from Gemini API'))
            }
          } else {
            reject(Object.assign(new Error(`Gemini API error ${status}: ${data}`), { status, raw: data }))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(JSON.stringify(body))
    req.end()
  })
}

function toGeminiContents(messages: Msg[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))
}

function extractText(resp: any): string {
  const cand = resp?.candidates?.[0]
  const parts = cand?.content?.parts || []
  let text = ''
  for (const p of parts) {
    if (typeof p?.text === 'string') text += p.text
  }
  if (!text) {
    // Fallback to top-level promptFeedback if no candidates
    text = resp?.promptFeedback?.blockReason || ''
  }
  return text || ''
}

export async function chatGemini(apiKey: string, messages: Msg[], systemPrompt?: string) {
  const attempts: { ver: 'v1beta'; model: string }[] = [
    { ver: 'v1beta', model: 'gemini-2.5-pro' },
    { ver: 'v1beta', model: 'gemini-2.5-flash' },
  ]
  let lastErr: any = null
  for (const { ver, model } of attempts) {
    const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
    const body: any = {
      contents: toGeminiContents(messages),
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }
    if (systemPrompt) {
      // Gemini expects snake_case system_instruction
      body.system_instruction = { role: 'system', parts: [{ text: systemPrompt }] }
    }
    try {
      const resp = await postJson(url, body)
      return extractText(resp)
    } catch (e: any) {
      lastErr = e
      const status = Number(e?.status)
      // On 404 (model not found/unsupported) continue to next attempt
      if (status === 404) continue
      // On other errors, break and surface the error
      break
    }
  }
  throw lastErr || new Error('Gemini API failed for all attempts')
}

export async function streamGemini(
  apiKey: string,
  messages: Msg[],
  systemPrompt: string | undefined,
  onToken: (t: string) => void
) {
  // For now, use non-stream API and chunk the result to tokens
  const full = await chatGemini(apiKey, messages, systemPrompt)
  const parts = full.split(/(\s+)/)
  for (const p of parts) {
    if (p) onToken(p)
    await new Promise((r) => setTimeout(r, 5))
  }
}
