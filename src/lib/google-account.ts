import prisma from "@/lib/prisma"

let googleCreatedColumnEnsured = false

export async function ensureGoogleCreatedColumn() {
  if (googleCreatedColumnEnsured) return
  await prisma.$executeRawUnsafe(`
    ALTER TABLE public."user"
    ADD COLUMN IF NOT EXISTS google_created BOOLEAN NOT NULL DEFAULT FALSE
  `)
  googleCreatedColumnEnsured = true
}

export async function isGoogleCreatedAccount(userId: string) {
  await ensureGoogleCreatedColumn()
  const rows = await prisma.$queryRaw<Array<{ google_created: boolean }>>`
    SELECT google_created
    FROM public."user"
    WHERE id = ${userId}
    LIMIT 1
  `
  return rows[0]?.google_created === true
}
