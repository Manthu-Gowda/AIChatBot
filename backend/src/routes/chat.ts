import { Router } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest, requireAuth } from '../middleware/auth'
import { chatSchema } from '../utils/validator'
import { decrypt } from '../services/cryptoService'
import { chatWithProvider, streamWithProvider } from '../services/ai/router'
import { retrieveContext } from '../services/rag/retrieve'

const router = Router()

async function resolveProvider(userId: string, override?: string) {
  const settings = await prisma.settings.findUnique({ where: { userId } })
  const provider = (override || settings?.defaultProvider || 'OPENAI') as any
  let keyEnc: string | null = null
  switch (provider) {
    case 'OPENAI': keyEnc = settings?.openaiKeyEnc ?? null; break
    case 'DEEPSEEK': keyEnc = settings?.deepseekKeyEnc ?? null; break
    case 'GEMINI': keyEnc = settings?.geminiKeyEnc ?? null; break
    case 'PERPLEXITY': keyEnc = settings?.perplexityKeyEnc ?? null; break
  }
  return { provider, keyEnc }
}

router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { message, provider: providerOverride, projectId, conversationId } = chatSchema.parse(req.body)
    const { provider, keyEnc } = await resolveProvider(req.user!.id, providerOverride)
    if (!keyEnc) {
      return res.status(400).json({ error: { message: 'Missing API key for selected provider', provider } })
    }
    let apiKey = ''
    try {
      apiKey = keyEnc ? decrypt(keyEnc) : ''
    } catch (err) {
      return res.status(400).json({ error: { message: 'Unable to decrypt stored API key. ENCRYPTION_KEY likely changed. Please re-enter your provider API key in Settings.' }, provider })
    }

    // Load/prepare conversation
    let conv = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: req.user!.id } })
      : null
    if (!conv) {
      conv = await prisma.conversation.create({ data: { userId: req.user!.id, provider, projectId: projectId || null, title: null } })
    }
    await prisma.message.create({ data: { conversationId: conv.id, role: 'user', content: message } })

    let systemPrompt: string | undefined
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId: req.user!.id } })
      if (project) {
        const ctx = await retrieveContext(project)
        systemPrompt = `You are an assistant. Use this project context to assist the user.\n${ctx}`
      }
    }

    const wantsStream = (req.headers.accept || '').includes('text/event-stream') || String((req.query as any).stream) === '1'
    if (wantsStream) {
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      ;(res as any).flushHeaders?.()
      const send = (data: any) => res.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`)
      let full = ''
      try {
        await streamWithProvider(provider as any, apiKey, [{ role: 'user', content: message }], systemPrompt, (t) => { full += t; send({ token: t }) })
        await prisma.message.create({ data: { conversationId: conv.id, role: 'assistant', content: full } })
        send('[DONE]')
      } catch (err: any) {
        send(JSON.stringify({ error: err?.message || 'Stream failed' }))
      } finally {
        res.end()
      }
      return
    }
    const assistantText = await chatWithProvider(provider as any, apiKey, [{ role: 'user', content: message }], systemPrompt)
    await prisma.message.create({ data: { conversationId: conv.id, role: 'assistant', content: assistantText } })
    res.json({ conversationId: conv.id, reply: assistantText, provider })
  } catch (e) { next(e) }
})

router.get('/conversations', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const list = await prisma.conversation.findMany({ where: { userId: req.user!.id }, orderBy: { updatedAt: 'desc' } })
    res.json(list)
  } catch (e) { next(e) }
})

router.get('/conversations/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const conv = await prisma.conversation.findFirst({ where: { id: req.params.id, userId: req.user!.id }, include: { messages: true } })
    if (!conv) return res.status(404).json({ error: { message: 'Not found' } })
    res.json(conv)
  } catch (e) { next(e) }
})

router.delete('/conversations/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    await prisma.message.deleteMany({ where: { conversationId: req.params.id } })
    await prisma.conversation.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
