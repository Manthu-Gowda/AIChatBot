import { Router } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest, requireAuth } from '../middleware/auth'
import { encrypt, decrypt, maskKey } from '../services/cryptoService'
import { settingsSchema } from '../utils/validator'

const router = Router()

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const s = await prisma.settings.findUnique({ where: { userId: req.user!.id } })
    if (!s) return res.json(null)
    let openai: string | undefined
    let deepseek: string | undefined
    let gemini: string | undefined
    let perplexity: string | undefined
    try { if (s.openaiKeyEnc) openai = maskKey('' + decrypt(s.openaiKeyEnc)) } catch {}
    try { if (s.deepseekKeyEnc) deepseek = maskKey('' + decrypt(s.deepseekKeyEnc)) } catch {}
    try { if (s.geminiKeyEnc) gemini = maskKey('' + decrypt(s.geminiKeyEnc)) } catch {}
    try { if (s.perplexityKeyEnc) perplexity = maskKey('' + decrypt(s.perplexityKeyEnc)) } catch {}
    let anthropic: string | undefined
    let mistral: string | undefined
    let openrouter: string | undefined
    let groq: string | undefined
    try { if (s.anthropicKeyEnc) anthropic = maskKey('' + decrypt(s.anthropicKeyEnc)) } catch {}
    try { if (s.mistralKeyEnc) mistral = maskKey('' + decrypt(s.mistralKeyEnc)) } catch {}
    try { if (s.openrouterKeyEnc) openrouter = maskKey('' + decrypt(s.openrouterKeyEnc)) } catch {}
    try { if (s.groqKeyEnc) groq = maskKey('' + decrypt(s.groqKeyEnc)) } catch {}
    res.json({
      defaultProvider: s.defaultProvider,
      apiKeys: { openai, deepseek, gemini, perplexity, anthropic, mistral, openrouter, groq },
    })
  } catch (e) { next(e) }
})

router.put('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = settingsSchema.parse(req.body)
    const s = await prisma.settings.upsert({
      where: { userId: req.user!.id },
      update: {},
      create: { userId: req.user!.id },
    })
    const update: any = {}
    if (data.defaultProvider) update.defaultProvider = data.defaultProvider
    if (data.apiKeys) {
      if (data.apiKeys.openai) update.openaiKeyEnc = encrypt(data.apiKeys.openai)
      if (data.apiKeys.deepseek) update.deepseekKeyEnc = encrypt(data.apiKeys.deepseek)
      if (data.apiKeys.gemini) update.geminiKeyEnc = encrypt(data.apiKeys.gemini)
      if (data.apiKeys.perplexity) update.perplexityKeyEnc = encrypt(data.apiKeys.perplexity)
      if (data.apiKeys.anthropic) update.anthropicKeyEnc = encrypt(data.apiKeys.anthropic)
      if (data.apiKeys.mistral) update.mistralKeyEnc = encrypt(data.apiKeys.mistral)
      if (data.apiKeys.openrouter) update.openrouterKeyEnc = encrypt(data.apiKeys.openrouter)
      if (data.apiKeys.groq) update.groqKeyEnc = encrypt(data.apiKeys.groq)
    }
    const out = await prisma.settings.update({ where: { id: s.id }, data: update })
    res.json({ defaultProvider: out.defaultProvider, updated: true })
  } catch (e) { next(e) }
})

export default router
