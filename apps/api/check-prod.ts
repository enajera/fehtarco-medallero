import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const phases = await p.$queryRawUnsafe<any[]>('SELECT id, name, "orderIndex" FROM phases ORDER BY id');
  console.log('=== PHASES TABLE ===');
  console.log(JSON.stringify(phases, null, 2));

  const cnt = await p.$queryRawUnsafe<any[]>('SELECT COUNT(*) as total FROM results');
  console.log('=== RESULTS COUNT ===', cnt[0]?.total);

  const cats = await p.$queryRawUnsafe<any[]>('SELECT id, phases FROM event_categories ORDER BY id');
  console.log('=== EVENT CATEGORIES ===');
  cats.forEach((c: any) => console.log(`  id=${c.id} phases=${JSON.stringify(c.phases)}`));

  await p.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
