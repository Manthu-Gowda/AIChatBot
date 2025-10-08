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
    res.json({
      defaultProvider: s.defaultProvider,
      apiKeys: { openai, deepseek, gemini, perplexity },
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
    }
    const out = await prisma.settings.update({ where: { id: s.id }, data: update })
    res.json({ defaultProvider: out.defaultProvider, updated: true })
  } catch (e) { next(e) }
})

export default router
