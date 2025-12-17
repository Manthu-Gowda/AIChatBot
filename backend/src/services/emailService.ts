import nodemailer from 'nodemailer'

// Configure SMTP transport from environment variables.
// Recommended (Gmail): SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, SMTP_SECURE=false
// Use `EMAIL_USER` and `EMAIL_PASS` (app password for Gmail) for auth.
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
const smtpPort = Number(process.env.SMTP_PORT || 587)
const smtpSecure = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true'

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  } : undefined,
  // Force IPv4 to avoid IPv6 timeouts on some cloud providers (like Render)
  family: 4,
  // Add reasonable timeouts to surface connection issues quickly
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 30000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 30000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
  tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false' }
} as any)

// Verify connection configuration with clearer logging
transporter.verify(function (error, success) {
  if (error) {
    console.error('[Email Service] SMTP Connection Error:', error && error.code ? error.code : error)
    // Helpful debug info (do not print secrets)
    console.error('[Email Service] SMTP config:', { host: smtpHost, port: smtpPort, secure: smtpSecure })
  } else {
    console.log('[Email Service] SMTP Connection Ready')
  }
});

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
