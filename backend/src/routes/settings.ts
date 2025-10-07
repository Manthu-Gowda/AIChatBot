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
    res.json({
      defaultProvider: s.defaultProvider,
      apiKeys: {
        openai: s.openaiKeyEnc ? maskKey('' + decrypt(s.openaiKeyEnc)) : undefined,
        deepseek: s.deepseekKeyEnc ? maskKey('' + decrypt(s.deepseekKeyEnc)) : undefined,
        gemini: s.geminiKeyEnc ? maskKey('' + decrypt(s.geminiKeyEnc)) : undefined,
        perplexity: s.perplexityKeyEnc ? maskKey('' + decrypt(s.perplexityKeyEnc)) : undefined,
      },
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

