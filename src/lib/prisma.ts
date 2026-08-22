import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const PRISMA_RUNTIME_ID = 'medicine_sales'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as typeof globalThis & {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>
  prismaRuntimeId?: string
}

const getPrismaClient = () => {
  if (!globalForPrisma.prismaGlobal || globalForPrisma.prismaRuntimeId !== PRISMA_RUNTIME_ID) {
    const previous = globalForPrisma.prismaGlobal
    globalForPrisma.prismaGlobal = prismaClientSingleton()
    globalForPrisma.prismaRuntimeId = PRISMA_RUNTIME_ID
    void previous?.$disconnect()
  }

  return globalForPrisma.prismaGlobal
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient()
    const value = Reflect.get(client, property, client)
    return typeof value === 'function' ? value.bind(client) : value
  },
})

export default prisma
