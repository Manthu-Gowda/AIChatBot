import { Router } from 'express'
import { signJwt } from '../utils/jwt'
import { prisma } from '../prisma/client'
import { requireWidget } from '../middleware/auth'
import { decrypt } from '../services/cryptoService'
import { chatWithProvider, streamWithProvider } from '../services/ai/router'
import { retrieveContext } from '../services/rag/retrieve'

const router = Router()

router.post('/token', async (req, res, next) => {
  try {
    const { tenantId, projectId } = req.body || {}
    if (!tenantId) return res.status(400).json({ error: { message: 'tenantId required' } })
    // Ensure tenant exists
    const user = await prisma.user.findUnique({ where: { id: tenantId } })
    if (!user) return res.status(404).json({ error: { message: 'Tenant not found' } })
    const token = signJwt({ aud: 'widget', userId: tenantId, projectId }, { expiresIn: '10m' })
    res.json({ token, expiresIn: 600 })
  } catch (e) { next(e) }
})

router.get('/config', async (req, res, next) => {
  try {
    const { tenantId } = req.query as any
    if (!tenantId) return res.status(400).json({ error: { message: 'tenantId required' } })
    const settings = await prisma.settings.findUnique({ where: { userId: String(tenantId) } })
    res.json({ provider: settings?.defaultProvider || 'OPENAI' })
  } catch (e) { next(e) }
})

router.post('/chat', requireWidget, async (req: any, res, next) => {
  try {
    const { message, provider: providerOverride, projectId: bodyProjectId } = req.body || {}
    if (!message) return res.status(400).json({ error: { message: 'message required' } })
    const tenantId = req.user!.id
    const projectId = bodyProjectId || req.projectId
    const settings = await prisma.settings.findUnique({ where: { userId: tenantId } })
    
    let provider = (providerOverride || settings?.defaultProvider || 'GEMINI') as any
    let keyEnc: string | null = null

    // Project-based config (Priority)
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId: tenantId } })
      if (project && (project as any).provider) {
        provider = (project as any).provider
        keyEnc = (project as any).apiKeyEnc
      }
    }

    // Fallback to settings (only if project didn't provide a key?) 
    // If project loaded but had no key, keyEnc is null/undefined. 
    // If we want STRICT project config, we stop here.
    // If we want fallback, we check settings. 
    // Given the requirement "User particular Project API only", we should probably NOT fallback if project is defined.
    // However, for safety if key is missing in project, maybe fallback? 
    // Let's assume strict for now to match chat.ts logic.
    
    if (!keyEnc && !projectId) {
        // Only check global settings if NOT using a project-specific config (or if project lookup failed?)
        // But logic above tries project first. 
        // Let's keep the switch as fallback for backward compatibility if projectId is missing.
        switch (provider) {
        case 'OPENAI': keyEnc = settings?.openaiKeyEnc ?? null; break
        case 'DEEPSEEK': keyEnc = settings?.deepseekKeyEnc ?? null; break
        case 'GEMINI': keyEnc = settings?.geminiKeyEnc ?? null; break
        case 'PERPLEXITY': keyEnc = settings?.perplexityKeyEnc ?? null; break
        case 'ANTHROPIC': keyEnc = settings?.anthropicKeyEnc ?? null; break
        case 'MISTRAL': keyEnc = settings?.mistralKeyEnc ?? null; break
        case 'OPENROUTER': keyEnc = settings?.openrouterKeyEnc ?? null; break
        case 'GROQ': keyEnc = settings?.groqKeyEnc ?? null; break
        }
    }
    if (!keyEnc) return res.status(400).json({ error: { message: 'Missing API key', provider } })
    let apiKey: string
    try { apiKey = decrypt(keyEnc).trim() }
    catch { return res.status(400).json({ error: { message: 'Unable to decrypt stored API key. ENCRYPTION_KEY likely changed. Please re-enter the provider API key.' }, provider }) }

    let systemPrompt: string | undefined
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, userId: tenantId } })
      if (project) {
        const ctx = await retrieveContext(project)
        systemPrompt = `You are a helpful embedded assistant.\n${ctx}`
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
      try {
        await streamWithProvider(provider as any, apiKey, [{ role: 'user', content: message }], systemPrompt, (t) => send({ token: t }))
        send('[DONE]')
      } catch (err: any) {
        send(JSON.stringify({ error: err?.message || 'Stream failed' }))
      } finally { res.end() }
      return
    }
    const assistantText = await chatWithProvider(provider as any, apiKey, [{ role: 'user', content: message }], systemPrompt)
    res.json({ reply: assistantText, provider })
  } catch (e) { next(e) }
})

export default router
