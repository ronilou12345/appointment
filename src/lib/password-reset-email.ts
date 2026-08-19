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

export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  const transporter = getTransporter()
  if (!transporter) return { success: false, reason: "missing-credentials" }

  const patientName = name.trim() || "there"

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim() || `${CLINIC_NAME} <${process.env.SMTP_USER?.trim()}>`,
      to,
      subject: `${code} is your ${CLINIC_NAME} password reset code`,
      text: `Hello, ${patientName}!

We received a request to reset the password for your ${CLINIC_NAME} account.

Your verification code is: ${code}

This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.

— ${CLINIC_NAME}`,
      html: `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <p style="margin:0 0 4px;color:#0f766e;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${CLINIC_NAME}</p>
      <h1 style="margin:0 0 16px;color:#0f172a;font-size:22px;">Reset your password</h1>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:24px;">
        Hello, ${patientName}! Use this code to reset the password for your account.
      </p>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Verification code</p>
      <p style="margin:0 0 24px;color:#0f172a;font-size:32px;font-weight:700;letter-spacing:8px;">${code}</p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:20px;">
        This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.
      </p>
      <p style="margin:24px 0 0;color:#64748b;font-size:13px;">— ${CLINIC_NAME}</p>
    </div>
  </body>
</html>`,
    })

    return { success: true, reason: "sent" }
  } catch (error) {
    console.error("Password reset email failed:", error)
    return { success: false, reason: "send-failed" }
  }
}
