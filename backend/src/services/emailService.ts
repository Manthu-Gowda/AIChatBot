import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendNewLeadNotification(data: any) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("[Email Service] EMAIL_USER or EMAIL_PASS missing in environment");
    return;
  }

  const adminEmail =
    process.env.EMAIL_TO || process.env.EMAIL_USER || "'ksanjaykumar7280@gmail.com";
  const fromAddress = process.env.EMAIL_USER || "'ksanjaykumar7280@gmail.com";

  try {
    const result = await transporter.sendMail({
      from: `Admin Inquiry <${fromAddress}>`,
      to: adminEmail,
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

    console.log("[Email Service] Gmail result:", result);
  } catch (error: any) {
    console.error("[Email Service] Failed:", error?.message || error);
    if (error?.response) console.error("[Email Service] Response:", error.response);
  }
}
