import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanOldColumns() {
    try {
        console.log('🧹 Removendo colunas antigas do TransportSettings...\n');

        // Drop old columns
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "TransportSettings" 
      DROP COLUMN IF EXISTS "pricePerKm",
      DROP COLUMN IF EXISTS "pricePerMinute",
      DROP COLUMN IF EXISTS "feeStart",
      DROP COLUMN IF EXISTS "feeReturn",
      DROP COLUMN IF EXISTS "handlingTimeStart",
      DROP COLUMN IF EXISTS "handlingTimeReturn";
    `);

        console.log('✅ Colunas antigas removidas.');

        // Verify current structure
        const settings = await prisma.transportSettings.findFirst();
        console.log('\n📊 Configurações atuais:', settings);

        console.log('\n✨ Limpeza concluída!');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

cleanOldColumns()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
