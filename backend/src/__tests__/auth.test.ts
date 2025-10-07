import request from 'supertest'
import express from 'express'
import authRoutes from '../routes/auth'
import { prisma } from '../prisma/client'

const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

describe('auth routes', () => {
  it('signup + login happy path', async () => {
    const email = `u${Date.now()}@ex.com`
    const res1 = await request(app).post('/auth/signup').send({ name: 'Test User', email, password: 'password123' })
    expect(res1.status).toBe(200)
    expect(res1.body.token).toBeTruthy()
    const res2 = await request(app).post('/auth/login').send({ email, password: 'password123' })
    expect(res2.status).toBe(200)
    expect(res2.body.token).toBeTruthy()
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
