import { Router } from 'express'
import { prisma } from '../prisma/client'
import { AuthRequest, requireAuth } from '../middleware/auth'
import bcrypt from 'bcrypt'

const router = Router()

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, email: true, name: true, avatarUrl: true } })
    res.json(user)
  } catch (e) { next(e) }
})

router.put('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { name, avatarUrl } = req.body || {}
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { name, avatarUrl }, select: { id: true, email: true, name: true, avatarUrl: true } })
    res.json(user)
  } catch (e) { next(e) }
})

router.put('/password', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {}
    if (!currentPassword || !newPassword) return res.status(400).json({ error: { message: 'Missing fields' } })
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) return res.status(404).json({ error: { message: 'Not found' } })
    const ok = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!ok) return res.status(400).json({ error: { message: 'Invalid password' } })
    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: req.user!.id }, data: { passwordHash } })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router

