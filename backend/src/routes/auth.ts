import { Router } from 'express'
import { prisma } from '../prisma/client'
import { forgotSchema, loginSchema, resetSchema, signupSchema } from '../utils/validator'
import bcrypt from 'bcrypt'
import { signJwt } from '../utils/jwt'

const router = Router()

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body)
    const exists = await prisma.user.findUnique({ where: { email: data.email } })
    if (exists) return res.status(400).json({ error: { message: 'Email already registered' } })
    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await prisma.user.create({ data: { email: data.email, name: data.name, passwordHash } })
    await prisma.settings.create({ data: { userId: user.id } })
    const token = signJwt({ sub: user.id, email: user.email })
    res.json({ token })
  } catch (e) {
    next(e)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) return res.status(400).json({ error: { message: 'Invalid credentials' } })
    const ok = await bcrypt.compare(data.password, user.passwordHash)
    if (!ok) return res.status(400).json({ error: { message: 'Invalid credentials' } })
    const token = signJwt({ sub: user.id, email: user.email })
    res.json({ token })
  } catch (e) {
    next(e)
  }
})

// Dev stub: returns reset token instead of sending email
router.post('/forgot', async (req, res, next) => {
  try {
    const { email } = forgotSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.json({ ok: true })
    const token = signJwt({ sub: user.id, email: user.email, typ: 'reset' }, { expiresIn: '15m' })
    res.json({ ok: true, resetToken: token })
  } catch (e) {
    next(e)
  }
})

router.post('/reset', async (req, res, next) => {
  try {
    const { token, password } = resetSchema.parse(req.body)
    // verify in jwt util directly to keep deps small in router
    const payload = (await import('jsonwebtoken')).then(m => m.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret_change_me')) as any
    const pl = (await payload) as any
    if (pl.typ !== 'reset') return res.status(400).json({ error: { message: 'Invalid token' } })
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.update({ where: { id: pl.sub as string }, data: { passwordHash } })
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
