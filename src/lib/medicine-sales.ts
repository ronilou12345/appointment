import prisma from "@/lib/prisma"

let ensured = false

export async function ensureMedicineSalesDiscountColumn() {
  if (ensured) return

  await prisma.$executeRawUnsafe(`
    ALTER TABLE medicine_sales
    ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0
  `)

  ensured = true
}
