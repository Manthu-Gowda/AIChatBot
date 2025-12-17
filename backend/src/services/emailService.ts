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

export async function sendOtp(to: string, code: string) {
  // If credentials are missing, log to console for development
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // eslint-disable-next-line no-console
    console.log(`[DEV MODE] Email Service not configured. OTP for ${to} is: ${code}`)
    return
  }

  try {
    await transporter.sendMail({
      from: `"Admin Inquiry" <${process.env.EMAIL_FROM || 'admininquiry@yopmail.com'}>`, // Custom sender name
      to,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #f9f9f9;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Please use the following code to verify your email:</p>
            <div style="font-size: 24px; font-weight: bold; color: #4F46E5; margin: 20px 0;">${code}</div>
            <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
          </div>
        </div>
      `
    })
    // eslint-disable-next-line no-console
    console.log(`[Email Service] OTP sent to ${to}`)
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error)
    // Fallback for development/testing with invalid credentials
    // eslint-disable-next-line no-console
    console.log(`[Email Service] FAILURE FALLBACK: OTP for ${to} is: ${code}`)
    // We do NOT throw here so the frontend flow continues and user can copy OTP from console
  }
}
