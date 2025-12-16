
export async function chatGroq(apiKey: string, messages: { role: string; content: string }[], systemPrompt?: string) {
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  
  const msgs = [...messages]
  if (systemPrompt) {
    msgs.unshift({ role: 'system', content: systemPrompt })
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile', // Defaulting to Llama 3 70B
      messages: msgs,
      temperature: 0.7
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.choices[0]?.message?.content || ''
}

export async function streamGroq(
  apiKey: string,
  messages: { role: string; content: string }[],
  systemPrompt: string | undefined,
  onToken: (t: string) => void
) {
  const url = 'https://api.groq.com/openai/v1/chat/completions'
  
  const msgs = [...messages]
  if (systemPrompt) {
    msgs.unshift({ role: 'system', content: systemPrompt })
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: msgs,
      temperature: 0.7,
      stream: true
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error: ${res.status} ${err}`)
  }

  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed === 'data: [DONE]') continue
      if (trimmed.startsWith('data: ')) {
        try {
          const json = JSON.parse(trimmed.slice(6))
          const content = json.choices[0]?.delta?.content
          if (content) onToken(content)
        } catch (e) {
          console.error('Error parsing Groq stream:', e)
        }
      }
    }
  }
}
