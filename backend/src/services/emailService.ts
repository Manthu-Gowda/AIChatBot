import sgMail from "@sendgrid/mail";

export async function sendNewLeadNotification(data: any) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromAddress = "manthugowda4u@gmail.com";
  const toAddress = "manthugowda4u@gmail.com";

  if (!apiKey) {
    console.error("[Email Service] SENDGRID_API_KEY missing in environment");
    return;
  }

  if (!fromAddress || !toAddress) {
    console.error("[Email Service] EMAIL_FROM or EMAIL_TO missing in environment");
    return;
  }

  sgMail.setApiKey(apiKey);

  try {
    const result = await sgMail.send({
      from: `Admin Inquiry <${fromAddress}>`,
      to: toAddress,
      subject: `New Lead: ${data?.name || "Unknown"} (${data?.topic || "No Topic"})`,
      html: `
        <h2>New Lead Received</h2>
        <p><strong>Name:</strong> ${data?.name || "-"}</p>
        <p><strong>Email:</strong> ${data?.email || "-"}</p>
        <p><strong>Phone:</strong> ${data?.phone || "-"}</p>
        <p><strong>Topic:</strong> ${data?.topic || "-"}</p>
        <p><strong>Role:</strong> ${data?.role || "-"}</p>
      `,
    });

    console.log("[Email Service] SendGrid result:", result);
  } catch (error: any) {
    console.error("[Email Service] Failed:", error?.message || error);
    if (error?.response?.body) {
      console.error("[Email Service] Response:", error.response.body);
    }
  }
}
