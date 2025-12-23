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
    <h2>New Lead Received</h2>
    <p><strong>Name:</strong> ${data?.name || "-"}</p>
    <p><strong>Email:</strong> ${data?.email || "-"}</p>
    <p><strong>Phone:</strong> ${data?.phone || "-"}</p>
    <p><strong>Topic:</strong> ${data?.topic || "-"}</p>
    <p><strong>Role:</strong> ${data?.role || "-"}</p>
    <p><strong>Project ID:</strong> ${data?.projectId || "-"}</p>
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
