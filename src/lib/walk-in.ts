import prisma from "@/lib/prisma"

let addressColumnEnsured = false

export async function ensureWalkInAddressColumn() {
  if (addressColumnEnsured) return
  await prisma.$executeRawUnsafe(`ALTER TABLE public.walk_in ADD COLUMN IF NOT EXISTS address VARCHAR(500)`)
  addressColumnEnsured = true
}