import { createHash, randomInt, timingSafeEqual } from "crypto"
import prisma from "@/lib/prisma"

const CODE_TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

type ResetRow = {
  id: number
  email: string
  code_hash: string
  expires_at: Date
  attempts: number
  created_at: Date
}

let tableReady = false

async function ensureTable() {
  if (tableReady) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS password_reset (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      code_hash VARCHAR(128) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS password_reset_email_idx ON password_reset (email)`
  )

  tableReady = true
}

function hashCode(email: string, code: string) {
  return createHash("sha256").update(`${email}:${code}`).digest("hex")
}

function hashesMatch(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function generateResetCode() {
  return String(randomInt(100000, 1000000))
}

export async function issuePasswordResetCode(email: string) {
  await ensureTable()

  const recent = await prisma.$queryRawUnsafe<ResetRow[]>(
    `SELECT * FROM password_reset WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    email
  )
  const latest = recent[0]

  if (latest && Date.now() - new Date(latest.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false as const, reason: "cooldown" as const }
  }

  const code = generateResetCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)

  await prisma.$executeRawUnsafe(`DELETE FROM password_reset WHERE email = $1`, email)
  await prisma.$executeRawUnsafe(
    `INSERT INTO password_reset (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
    email,
    hashCode(email, code),
    expiresAt
  )

  return { ok: true as const, code, expiresAt }
}

export async function consumePasswordResetCode(email: string, code: string) {
  await ensureTable()

  const rows = await prisma.$queryRawUnsafe<ResetRow[]>(
    `SELECT * FROM password_reset WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    email
  )
  const record = rows[0]

  if (!record) return { ok: false as const, reason: "invalid" as const }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    await prisma.$executeRawUnsafe(`DELETE FROM password_reset WHERE email = $1`, email)
    return { ok: false as const, reason: "expired" as const }
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.$executeRawUnsafe(`DELETE FROM password_reset WHERE email = $1`, email)
    return { ok: false as const, reason: "locked" as const }
  }

  if (!hashesMatch(record.code_hash, hashCode(email, code))) {
    await prisma.$executeRawUnsafe(
      `UPDATE password_reset SET attempts = attempts + 1 WHERE id = $1`,
      record.id
    )
    return { ok: false as const, reason: "invalid" as const }
  }

  await prisma.$executeRawUnsafe(`DELETE FROM password_reset WHERE email = $1`, email)
  return { ok: true as const }
}
