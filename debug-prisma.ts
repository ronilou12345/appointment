import prisma from './src/lib/prisma'

async function main() {
  console.log('typeof $queryRaw', typeof (prisma as any).$queryRaw)
  console.log('typeof queryRaw', typeof (prisma as any).queryRaw)
  console.log('typeof $executeRaw', typeof (prisma as any).$executeRaw)
  console.log('typeof $disconnect', typeof (prisma as any).$disconnect)
  console.log('prisma keys sample', Object.getOwnPropertyNames(prisma).slice(0, 5))

  try {
    const rows = await (prisma as any).$queryRaw`SELECT COUNT(*)::int AS c FROM "session_tbl"`
    console.log('raw count', rows)
  } catch (err) {
    console.error('raw failed', err)
  }

  try {
    const count = await prisma.session_tbl.count()
    console.log('count', count)
  } catch (err) {
    console.error('count failed', err)
  }

  await (prisma as any).$disconnect?.()
}

main().catch((err) => {
  console.error('outer', err)
  process.exit(1)
})
