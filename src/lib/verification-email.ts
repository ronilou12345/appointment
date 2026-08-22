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

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  const transporter = getTransporter()
  if (!transporter) return { success: false, reason: "missing-credentials" }

  const patientName = name.trim() || "there"
  const safeName = escapeHtml(patientName)
  const safeUrl = escapeHtml(verifyUrl)

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || `${CLINIC_NAME} <${process.env.SMTP_USER?.trim()}>`,
      to,
      subject: `Verify your ${CLINIC_NAME} account`,
      text: `Hello, ${patientName}!

Thanks for creating an account with ${CLINIC_NAME}.

Please verify your email address by opening this link:
${verifyUrl}

This link expires in 24 hours. After you verify, you can sign in to your account.

If you did not create this account, you can ignore this email.

— ${CLINIC_NAME}`,
      html: `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 4px;color:#0f766e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${CLINIC_NAME}</p>
      <h1 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Verify your account</h1>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:24px;">
        Hello, ${safeName}! Thanks for signing up. Click the button below to verify your email and activate your account.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${safeUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 20px;border-radius:10px;">
          Verify your account
        </a>
      </p>
      <p style="margin:0 0 16px;color:#64748b;font-size:13px;line-height:20px;">
        This link expires in 24 hours. After you verify, you can sign in.
      </p>
      <p style="margin:0;color:#94a3b8;font-size:12px;line-height:20px;word-break:break-all;">
        If the button does not work, copy and paste this link into your browser:<br />${safeUrl}
      </p>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;">— ${CLINIC_NAME}</p>
    </div>
  </body>
</html>`,
    })

    return { success: true, reason: "sent" }
  } catch (error) {
    console.error("Verification email failed:", error)
    return { success: false, reason: "send-failed" }
  }
}
