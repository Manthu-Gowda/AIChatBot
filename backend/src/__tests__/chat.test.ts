import request from 'supertest'
import express from 'express'
import chatRoutes from '../routes/chat'
import { prisma } from '../prisma/client'

function buildApp(userId: string) {
  const app = express()
  app.use(express.json())
  app.use('/chat', (req, _res, next) => { (req as any).user = { id: userId, email: 't@e.com' }; next() }, chatRoutes)
  return app
}

describe('chat route', () => {
  it('returns 400 when missing key for provider', async () => {
    const user = await prisma.user.create({ data: { email: `t${Date.now()}@e.com`, passwordHash: 'x' } })
    await prisma.settings.upsert({ where: { userId: user.id }, update: { defaultProvider: 'OPENAI', openaiKeyEnc: null }, create: { userId: user.id, defaultProvider: 'OPENAI' } })
    const app = buildApp(user.id)
    const res = await request(app).post('/chat').send({ message: 'Hello' })
    expect(res.status).toBe(400)
  })
})

afterAll(async () => { await prisma.$disconnect() })
