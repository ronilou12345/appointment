import { createHash, randomBytes, timingSafeEqual } from "crypto"
import prisma from "@/lib/prisma"

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

type VerificationRow = {
  id: number
  user_id: string
  email: string
  token_hash: string
  expires_at: Date
}

let tableReady = false

async function ensureTable() {
  if (tableReady) return

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS email_verification (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      email VARCHAR(255) NOT NULL,
      token_hash VARCHAR(128) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS email_verification_token_idx ON email_verification (token_hash)`
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS email_verification_user_idx ON email_verification (user_id)`
  )

  tableReady = true
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

function hashesMatch(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function generateVerificationToken() {
  return randomBytes(32).toString("hex")
}

export async function issueEmailVerificationToken(userId: string, email: string) {
  await ensureTable()

  const token = generateVerificationToken()
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  await prisma.$executeRawUnsafe(`DELETE FROM email_verification WHERE user_id = $1`, userId)
  await prisma.$executeRawUnsafe(
    `INSERT INTO email_verification (user_id, email, token_hash, expires_at) VALUES ($1, $2, $3, $4)`,
    userId,
    email,
    hashToken(token),
    expiresAt
  )

  return { token, expiresAt }
}

export async function consumeEmailVerificationToken(token: string) {
  await ensureTable()

  const tokenHash = hashToken(token)
  const rows = await prisma.$queryRawUnsafe<VerificationRow[]>(
    `SELECT id, user_id, email, token_hash, expires_at FROM email_verification WHERE token_hash = $1 LIMIT 1`,
    tokenHash
  )
  const record = rows[0]

  if (!record || !hashesMatch(record.token_hash, tokenHash)) {
    return { ok: false as const, reason: "invalid" as const }
  }

  if (new Date(record.expires_at).getTime() <= Date.now()) {
    await prisma.$executeRawUnsafe(`DELETE FROM email_verification WHERE id = $1`, record.id)
    return { ok: false as const, reason: "expired" as const }
  }

  await prisma.$executeRawUnsafe(`DELETE FROM email_verification WHERE user_id = $1`, record.user_id)
  return { ok: true as const, userId: record.user_id, email: record.email }
}
