import fs from 'fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const env = fs.readFileSync('.env', 'utf8')
const match = env.match(/^DATABASE_URL=(.*)$/m)
const url = match ? match[1].replace(/^"|"$/g, '') : undefined
if (!url) {
  console.error('NO DATABASE_URL')
  process.exit(1)
}

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

async function main() {
  const ids = await client.appointment.findMany({ select: { appointment_id: true }, orderBy: { appointment_id: 'asc' }, take: 30 })
  console.log('first 30 appointment ids:', ids.map((row) => row.appointment_id))
  const app14 = await client.appointment.findUnique({ where: { appointment_id: 14 } })
  console.log('appointment 14:', app14 ? 'found' : 'not found')
  if (app14) console.log(app14)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await client.$disconnect()
  })
