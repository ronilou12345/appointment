import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'mysql://root@127.0.0.1:3306/next_db'
  }

  const adapter = new PrismaMariaDb(process.env.DATABASE_URL)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as typeof globalThis & {
  prismaGlobal?: ReturnType<typeof prismaClientSingleton>
}

const prisma = globalForPrisma.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaGlobal = prisma
}

export default prisma
