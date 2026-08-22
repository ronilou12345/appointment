import prisma from "@/lib/prisma"

let ensured = false

export async function ensureVitalSignsColumns() {
  if (ensured) return

  await prisma.$executeRawUnsafe(`ALTER TABLE "vital_signs" ADD COLUMN IF NOT EXISTS user_id TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "vital_signs" ADD COLUMN IF NOT EXISTS height NUMERIC(5, 2)`)

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "vital_signs" ALTER COLUMN appointment_id DROP NOT NULL`)
  } catch {
    // Already nullable, or the database does not allow this change.
  }

  ensured = true
}

export function toVitalNumber(value: unknown) {
  if (value == null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
