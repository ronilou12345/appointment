import prisma from "@/lib/prisma"

let milligramColumnsEnsured = false

export async function ensureInventoryMilligramColumns() {
  if (milligramColumnsEnsured) return

  await prisma.$executeRawUnsafe(`ALTER TABLE public.medicine_inventory ADD COLUMN IF NOT EXISTS milligram TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE public.medicine_inventory ALTER COLUMN milligram TYPE TEXT USING milligram::text`)
  await prisma.$executeRawUnsafe(`ALTER TABLE public.products ADD COLUMN IF NOT EXISTS milligram TEXT`)
  await prisma.$executeRawUnsafe(`ALTER TABLE public.products ALTER COLUMN milligram TYPE TEXT USING milligram::text`)
  milligramColumnsEnsured = true
}
