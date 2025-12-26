import sgMail from "@sendgrid/mail";

export async function sendNewLeadNotification(data: any) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromAddress = process.env.EMAIL_FROM;
  const toAddress = process.env.EMAIL_TO;

  if (!apiKey) {
    console.error("[Email Service] SENDGRID_API_KEY missing in environment");
    return;
  }

  if (!fromAddress || !toAddress) {
    console.error("[Email Service] EMAIL_FROM or EMAIL_TO missing in environment");
    return;
  }

  sgMail.setApiKey(apiKey);

  const subject = `New Lead: ${data?.name || "Unknown"} (${data?.topic || "No Topic"})`;
  const html = `
    <div style="font-family: Arial, sans-serif; background: #f6f7fb; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);">
        <div style="background: linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%); padding: 20px 24px;">
          <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">New Lead Received</h2>
          <p style="margin: 6px 0 0; color: #e2e8f0; font-size: 13px;">A new inquiry just came in from your website.</p>
        </div>
        <div style="padding: 24px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px;">
            <p style="margin: 0 0 12px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em;">Lead Details</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #0f172a;">
              <tr>
                <td style="padding: 6px 0; color: #64748b; width: 140px;">Name</td>
                <td style="padding: 6px 0; font-weight: 600;">${data?.name || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Email</td>
                <td style="padding: 6px 0;">${data?.email || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Phone</td>
                <td style="padding: 6px 0;">${data?.phone || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Topic</td>
                <td style="padding: 6px 0;">${data?.topic || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Role</td>
                <td style="padding: 6px 0;">${data?.role || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Project ID</td>
                <td style="padding: 6px 0;">${data?.projectId || "-"}</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 18px; font-size: 12px; color: #94a3b8;">
            This message was generated automatically by your lead capture form.
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const result = await sgMail.send({
      to: toAddress,
      from: fromAddress,
      subject,
      text: subject,
      html,
    });

    console.log("[Email Service] SendGrid result:", result);
  } catch (error: any) {
    console.error("[Email Service] Failed:", error?.message || error);
    if (error?.response?.body) {
      console.error("[Email Service] Response:", error.response.body);
    }
  }
}
