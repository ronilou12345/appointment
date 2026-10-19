import prisma from "@/lib/prisma"

let milligramColumnsEnsured = false

export async function ensureInventoryMilligramColumns() {
  if (milligramColumnsEnsured) return

  await prisma.$executeRawUnsafe(`ALTER TABLE public.medicine_inventory ADD COLUMN IF NOT EXISTS milligram NUMERIC(10, 2)`)
  await prisma.$executeRawUnsafe(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS milligram NUMERIC(10, 2)`)
  milligramColumnsEnsured = true
}
