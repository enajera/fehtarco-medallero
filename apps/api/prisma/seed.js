"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    // ============================================
    // 1. MODALITIES
    // ============================================
    console.log('Creating modalities...');
    const modalities = ['INDIVIDUAL', 'TEAM', 'MIXED'];
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
    const phases = [
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
            role: client_1.UserRole.SUPER_ADMIN,
            active: true,
        },
        create: {
            email: adminEmail,
            passwordHash,
            role: client_1.UserRole.SUPER_ADMIN,
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
        { bowType: 'RECURVE', gender: 'M', division: 'Senior' },
        { bowType: 'RECURVE', gender: 'F', division: 'Senior' },
        { bowType: 'RECURVE', gender: 'M', division: 'Junior' },
        { bowType: 'RECURVE', gender: 'F', division: 'Junior' },
        { bowType: 'RECURVE', gender: 'M', division: 'Cadete' },
        { bowType: 'RECURVE', gender: 'F', division: 'Cadete' },
        { bowType: 'RECURVE', gender: 'M', division: 'Master' },
        { bowType: 'RECURVE', gender: 'F', division: 'Master' },
        // Compound
        { bowType: 'COMPOUND', gender: 'M', division: 'Senior' },
        { bowType: 'COMPOUND', gender: 'F', division: 'Senior' },
        { bowType: 'COMPOUND', gender: 'M', division: 'Junior' },
        { bowType: 'COMPOUND', gender: 'F', division: 'Junior' },
        // Barebow
        { bowType: 'BAREBOW', gender: 'M', division: 'Senior' },
        { bowType: 'BAREBOW', gender: 'F', division: 'Senior' },
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
//# sourceMappingURL=seed.js.map