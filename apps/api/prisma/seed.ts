import { PrismaClient, ModalityName, PhaseName, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ============================================
  // 1. MODALITIES
  // ============================================
  console.log('Creating modalities...');
  
  const modalities: ModalityName[] = ['INDIVIDUAL', 'TEAM', 'MIXED'];
  
  for (const name of modalities) {
    await prisma.modality.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Modalities created');

  // ============================================
  // 2. PHASES
  // ============================================
  console.log('Creating phases...');
  
  const phases: { name: PhaseName; orderIndex: number }[] = [
    { name: 'QUALIFICATION', orderIndex: 1 },
    { name: 'FINAL', orderIndex: 2 },
    { name: 'BRONZE_MATCH', orderIndex: 3 },
  ];
  
  for (const phase of phases) {
    await prisma.phase.upsert({
      where: { name: phase.name },
      update: { orderIndex: phase.orderIndex },
      create: phase,
    });
  }
  console.log('✅ Phases created');

  // ============================================
  // 3. SUPER_ADMIN USER
  // ============================================
  console.log('Creating super admin user...');
  
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@federacion.hn';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'CambiarEnProduccion!';
  
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      active: true,
    },
  });
  console.log(`✅ Super admin created: ${adminEmail}`);

  // ============================================
  // 4. SAMPLE CATEGORIES (Optional but useful)
  // ============================================
  console.log('Creating sample categories...');
  
  const sampleCategories = [
    // Recurve
    { bowType: 'RECURVE' as const, gender: 'M' as const, division: 'Senior' },
    { bowType: 'RECURVE' as const, gender: 'F' as const, division: 'Senior' },
    { bowType: 'RECURVE' as const, gender: 'M' as const, division: 'Junior' },
    { bowType: 'RECURVE' as const, gender: 'F' as const, division: 'Junior' },
    { bowType: 'RECURVE' as const, gender: 'M' as const, division: 'Cadete' },
    { bowType: 'RECURVE' as const, gender: 'F' as const, division: 'Cadete' },
    { bowType: 'RECURVE' as const, gender: 'M' as const, division: 'Master' },
    { bowType: 'RECURVE' as const, gender: 'F' as const, division: 'Master' },
    // Compound
    { bowType: 'COMPOUND' as const, gender: 'M' as const, division: 'Senior' },
    { bowType: 'COMPOUND' as const, gender: 'F' as const, division: 'Senior' },
    { bowType: 'COMPOUND' as const, gender: 'M' as const, division: 'Junior' },
    { bowType: 'COMPOUND' as const, gender: 'F' as const, division: 'Junior' },
    // Barebow
    { bowType: 'BAREBOW' as const, gender: 'M' as const, division: 'Senior' },
    { bowType: 'BAREBOW' as const, gender: 'F' as const, division: 'Senior' },
  ];
  
  for (const cat of sampleCategories) {
    await prisma.category.upsert({
      where: {
        bowType_gender_division: {
          bowType: cat.bowType,
          gender: cat.gender,
          division: cat.division,
        },
      },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Sample categories created');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log(`   - Modalities: ${modalities.length}`);
  console.log(`   - Phases: ${phases.length}`);
  console.log(`   - Categories: ${sampleCategories.length}`);
  console.log(`   - Admin user: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
