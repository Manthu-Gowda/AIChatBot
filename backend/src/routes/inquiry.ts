import express from 'express'
import { prisma } from '../prisma/client'
import { sendOtp } from '../services/emailService'
import crypto from 'crypto'

const router = express.Router()

// POST /widget/otp/send
router.post('/otp/send', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email required' })

    const code = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 mins

    // Upsert OTP record
    await prisma.otp.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt }
    })

    // Send via email (or log if dev)
    await sendOtp(email, code)

    res.json({ success: true, message: 'OTP sent' })
  } catch (error) {
    console.error('OTP Send Error:', error)
    res.status(500).json({ error: 'Failed to send OTP' })
  }
})

// POST /widget/otp/verify
router.post('/otp/verify', async (req, res) => {
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' })

    const record = await prisma.otp.findUnique({ where: { email } })
    if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' })

    if (new Date() > record.expiresAt) {
      return res.status(400).json({ error: 'OTP expired' })
    }

    if (record.code !== code) {
      return res.status(400).json({ error: 'Invalid code' })
    }

    // Clear OTP after successful verify
    await prisma.otp.delete({ where: { email } })

    res.json({ success: true })
  } catch (error) {
    console.error('OTP Verify Error:', error)
    res.status(500).json({ error: 'Verification failed' })
  }
})

// POST /widget/inquiry
// Upsert inquiry details based on email or create new if not exists
router.post('/inquiry', async (req, res) => {
  try {
    const { projectId, role, topic, name, email, phone } = req.body
    if (!projectId) return res.status(400).json({ error: 'Project ID required' })

    let inquiry

    // If we have an email, try to find existing inquiry for this project/email to update
    if (email) {
      const existing = await prisma.inquiry.findFirst({
        where: { projectId, email }
      })
      if (existing) {
        inquiry = await prisma.inquiry.update({
          where: { id: existing.id },
          data: { role, topic, name, phone } // update fields provided
        })
      }
    }

    // If no existing found or no email yet, create new
    if (!inquiry) {
      inquiry = await prisma.inquiry.create({
        data: {
          projectId,
          role,
          topic,
          name,
          email,
          phone
        }
      })
    }

    res.json(inquiry)
  } catch (error) {
    console.error('Inquiry Error:', error)
    res.status(500).json({ error: 'Failed to save inquiry' })
  }
})

export default router
