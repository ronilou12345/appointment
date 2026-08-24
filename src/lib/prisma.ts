import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const DEFAULT_POOL_MAX = 5

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured')
  }

  const configuredPoolMax = Number.parseInt(process.env.PRISMA_POOL_MAX ?? '', 10)
  const max = Number.isFinite(configuredPoolMax) && configuredPoolMax > 0
    ? configuredPoolMax
    : DEFAULT_POOL_MAX
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
  })
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as typeof globalThis & {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>
}

const getPrismaClient = () => {
  if (!globalForPrisma.prismaGlobal) {
    globalForPrisma.prismaGlobal = prismaClientSingleton()
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
