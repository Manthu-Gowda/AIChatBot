import nodemailer from 'nodemailer'

// Configure standard SMTP transport
// Users should provide EMAIL_USER (e.g. gmail) and EMAIL_PASS (app password) in .env
const transporter = nodemailer.createTransport({
  service: 'gmail', // or use host/port if configured
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export async function sendNewLeadNotification(data: any) {
  // If credentials are missing, log to console
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
     // eslint-disable-next-line no-console
     console.log('[DEV MODE] Email Service not configured. New Lead:', data)
     return
  }

  const adminEmail = process.env.EMAIL_USER // Send to self (admin)
  
  try {
    await transporter.sendMail({
      from: `"Admin Inquiry" <${process.env.EMAIL_FROM || 'ksanjaykumar7280@gmail.com'}>`, 
      to: adminEmail,
      subject: `New Lead: ${data.name} (${data.topic})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">New Lead Received</h2>
            <p><strong>Role:</strong> ${data.role}</p>
            <p><strong>Topic:</strong> ${data.topic}</p>
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Project ID:</strong> ${data.projectId}</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">Received via AI Chat Bot Widget</p>
          </div>
        </div>
      `
    })
    console.log(`[Email Service] Lead notification sent to ${adminEmail}`)
  } catch (error) {
    console.error('[Email Service] Failed to send lead notification:', error)
  }
}
