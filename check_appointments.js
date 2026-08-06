const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/^DATABASE_URL=(.*)$/m);
const url = match ? match[1].replace(/^"|"$/g, '') : undefined;
if (\!url) {
  console.error('NO DATABASE_URL');
  process.exit(1);
}
(async () => {
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const ids = await client.appointment.findMany({ select: { appointment_id: true }, orderBy: { appointment_id: 'asc' }, take: 30 });
    console.log('first 30 appointment ids:', ids.map((r) => r.appointment_id));
    const app14 = await client.appointment.findUnique({ where: { appointment_id: 14 } });
    console.log('appointment 14:', app14 ? 'found' : 'not found');
    if (app14) console.log(app14);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.$disconnect();
  }
})();
