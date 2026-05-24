/**
 * fix-phases-prod.ts
 * Reemplaza el valor inválido "ELIMINATION" en EventCategory.phases
 * por ["FINAL", "BRONZE_MATCH"] en la base de datos de producción.
 *
 * Uso:
 *   DATABASE_URL="postgres://..." npx ts-node apps/api/fix-phases-prod.ts
 *
 * También podés correr el SQL directamente en el SQL Editor de Supabase:
 *
 * UPDATE "EventCategory"
 * SET phases = (
 *   array_remove(phases, 'ELIMINATION')
 *   || CASE WHEN NOT ('FINAL'         = ANY(phases)) THEN ARRAY['FINAL']         ELSE ARRAY[]::text[] END
 *   || CASE WHEN NOT ('BRONZE_MATCH'  = ANY(phases)) THEN ARRAY['BRONZE_MATCH']  ELSE ARRAY[]::text[] END
 * )
 * WHERE 'ELIMINATION' = ANY(phases);
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verificando filas con ELIMINATION...');

  const affected = await prisma.$queryRawUnsafe<{ id: number; phases: string[] }[]>(
    `SELECT id, phases FROM "EventCategory" WHERE 'ELIMINATION' = ANY(phases)`
  );

  if (affected.length === 0) {
    console.log('✅ No hay filas con ELIMINATION. La base de datos ya está limpia.');
    return;
  }

  console.log(`⚠️  Encontradas ${affected.length} filas con ELIMINATION:`);
  affected.forEach(r => console.log(`   id=${r.id}  phases=${JSON.stringify(r.phases)}`));

  console.log('\n🔧 Aplicando fix...');
  const result = await prisma.$queryRawUnsafe<{ rowcount: number }[]>(`
    UPDATE "EventCategory"
    SET phases = (
      array_remove(phases, 'ELIMINATION')
      || CASE WHEN NOT ('FINAL'        = ANY(phases)) THEN ARRAY['FINAL']        ELSE ARRAY[]::text[] END
      || CASE WHEN NOT ('BRONZE_MATCH' = ANY(phases)) THEN ARRAY['BRONZE_MATCH'] ELSE ARRAY[]::text[] END
    )
    WHERE 'ELIMINATION' = ANY(phases)
    RETURNING id, phases
  `);

  console.log(`✅ Fix aplicado. Filas actualizadas: ${(result as any[]).length}`);
  (result as any[]).forEach((r: any) => console.log(`   id=${r.id}  phases=${JSON.stringify(r.phases)}`));

  console.log('\n🔍 Verificación post-fix (debe ser 0 filas):');
  const remaining = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id FROM "EventCategory" WHERE 'ELIMINATION' = ANY(phases)`
  );
  console.log(`   Filas con ELIMINATION restantes: ${remaining.length}`);

  console.log('\n📊 Valores de fase en uso actualmente:');
  const phases = await prisma.$queryRawUnsafe<{ phase_value: string }[]>(
    `SELECT DISTINCT unnest(phases) AS phase_value FROM "EventCategory" ORDER BY phase_value`
  );
  phases.forEach(p => console.log(`   ${p.phase_value}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
