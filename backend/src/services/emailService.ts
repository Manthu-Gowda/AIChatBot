import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewLeadNotification(data: any) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[Email Service] RESEND_API_KEY missing in environment");
    return;
  }

  const adminEmail = process.env.EMAIL_USER || "ksanjaykumar7280@gmail.com";

  try {
    const result = await resend.emails.send({
      from: "Admin Inquiry <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `New Lead: ${data?.name || "Unknown"} (${data?.topic || "No Topic"})`,
      html: `
        <h2>New Lead Received</h2>
        <p><strong>Name:</strong> ${data?.name || "-"}</p>
        <p><strong>Email:</strong> ${data?.email || "-"}</p>
        <p><strong>Phone:</strong> ${data?.phone || "-"}</p>
        <p><strong>Topic:</strong> ${data?.topic || "-"}</p>
        <p><strong>Role:</strong> ${data?.role || "-"}</p>
        <p><strong>Project ID:</strong> ${data?.projectId || "-"}</p>
      `,
    });

    console.log("[Email Service] Resend result:", result);
  } catch (error: any) {
    console.error("[Email Service] Failed:", error?.message || error);
    // Resend often includes extra details:
    if (error?.response) console.error("[Email Service] Response:", error.response);
  }
}
