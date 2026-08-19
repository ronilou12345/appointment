import nodemailer, { type Transporter } from "nodemailer"

const CLINIC_NAME = "C2M Family Clinic & Pharmacy"

let cachedTransporter: Transporter | null = null

function getTransporter() {
  const user = process.env.SMTP_USER?.trim()
  const pass = process.env.SMTP_PASSWORD?.trim()

  if (!user || !pass) return null
  if (cachedTransporter) return cachedTransporter

  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com"
  const port = Number(process.env.SMTP_PORT?.trim() || 465)

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return cachedTransporter
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function sendContactMessage({
  email,
  message,
}: {
  email: string
  message: string
}) {
  const transporter = getTransporter()
  if (!transporter) return { success: false, reason: "missing-credentials" }

  const inbox = process.env.CONTACT_EMAIL?.trim() || process.env.SMTP_USER?.trim()
  if (!inbox) return { success: false, reason: "missing-inbox" }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || `${CLINIC_NAME} <${process.env.SMTP_USER?.trim()}>`,
      to: inbox,
      replyTo: email,
      subject: `Website message from ${email}`,
      text: `New message from the C2M website contact form.

From: ${email}

Message:
${message}
`,
      html: `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 4px;color:#0f766e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${CLINIC_NAME}</p>
      <h1 style="margin:0 0 16px;color:#0f172a;font-size:22px;">New website message</h1>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">From</p>
      <p style="margin:0 0 16px;color:#0f172a;font-size:15px;font-weight:600;">${escapeHtml(email)}</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Message</p>
      <p style="margin:0;color:#334155;font-size:15px;line-height:24px;white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
  </body>
</html>`,
    })

    return { success: true, reason: "sent" }
  } catch (error) {
    console.error("Contact email failed:", error)
    return { success: false, reason: "send-failed" }
  }
}
