import prisma from "@/lib/prisma"

let ensurePromise: Promise<void> | null = null

export async function ensureMedicineSalesDiscountColumn() {
  if (ensurePromise) return ensurePromise

  ensurePromise = prisma.$executeRawUnsafe(`
    ALTER TABLE medicine_sales
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
  `).then(() => undefined).catch((error) => {
    ensurePromise = null
    throw error
  })

  return ensurePromise
}
