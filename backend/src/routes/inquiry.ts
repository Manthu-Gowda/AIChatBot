import express from 'express'
import { prisma } from '../prisma/client'
import { sendNewLeadNotification } from '../services/emailService'

const router = express.Router()

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
    
    // If phone is present, it means the flow is complete => Notify Admin
    if (phone) {
       // Fire and forget email notification
       sendNewLeadNotification(inquiry).catch(err => console.error('Bg Email Error', err))
    }

    res.json(inquiry)
  } catch (error) {
    console.error('Inquiry Error:', error)
    res.status(500).json({ error: 'Failed to save inquiry' })
  }
})

export default router
