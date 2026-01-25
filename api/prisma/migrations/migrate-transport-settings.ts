import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateTransportSettings() {
    try {
        console.log('🔧 Atualizando estrutura de TransportSettings...\n');

        // Add new columns
        await prisma.$executeRawUnsafe(`
      ALTER TABLE "TransportSettings" 
      ADD COLUMN IF NOT EXISTS "kmPriceLargada" DOUBLE PRECISION DEFAULT 2.0,
      ADD COLUMN IF NOT EXISTS "kmPriceLeva" DOUBLE PRECISION DEFAULT 2.0,
      ADD COLUMN IF NOT EXISTS "kmPriceTraz" DOUBLE PRECISION DEFAULT 2.0,
      ADD COLUMN IF NOT EXISTS "kmPriceRetorno" DOUBLE PRECISION DEFAULT 2.0,
      ADD COLUMN IF NOT EXISTS "minPriceLargada" DOUBLE PRECISION DEFAULT 1.5,
      ADD COLUMN IF NOT EXISTS "minPriceLeva" DOUBLE PRECISION DEFAULT 1.5,
      ADD COLUMN IF NOT EXISTS "minPriceTraz" DOUBLE PRECISION DEFAULT 1.5,
      ADD COLUMN IF NOT EXISTS "minPriceRetorno" DOUBLE PRECISION DEFAULT 1.5,
      ADD COLUMN IF NOT EXISTS "handlingTimeLargada" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "handlingTimeLeva" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "handlingTimeTraz" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "handlingTimeRetorno" INTEGER DEFAULT 0;
    `);

        console.log('✅ Colunas adicionadas com sucesso.');

        // Check if there's an existing record and update it with new structure
        const existing = await prisma.$queryRaw`SELECT * FROM "TransportSettings" LIMIT 1`;

        if (Array.isArray(existing) && existing.length > 0) {
            console.log('\n📝 Migrando dados existentes para nova estrutura...');

            const old: any = existing[0];

            // Migrate old values to new structure
            await prisma.$executeRawUnsafe(`
        UPDATE "TransportSettings" 
        SET 
          "kmPriceLargada" = COALESCE("kmPriceLargada", ${old.pricePerKm || 2.0}),
          "kmPriceLeva" = COALESCE("kmPriceLeva", ${old.pricePerKm || 2.0}),
          "kmPriceTraz" = COALESCE("kmPriceTraz", ${old.pricePerKm || 2.0}),
          "kmPriceRetorno" = COALESCE("kmPriceRetorno", ${old.pricePerKm || 2.0}),
          "minPriceLargada" = COALESCE("minPriceLargada", ${old.pricePerMinute || 1.5}),
          "minPriceLeva" = COALESCE("minPriceLeva", ${old.pricePerMinute || 1.5}),
          "minPriceTraz" = COALESCE("minPriceTraz", ${old.pricePerMinute || 1.5}),
          "minPriceRetorno" = COALESCE("minPriceRetorno", ${old.pricePerMinute || 1.5}),
          "handlingTimeLargada" = COALESCE("handlingTimeLargada", ${old.handlingTimeStart || 0}),
          "handlingTimeLeva" = COALESCE("handlingTimeLeva", ${old.handlingTimeLeva || 0}),
          "handlingTimeTraz" = COALESCE("handlingTimeTraz", ${old.handlingTimeTraz || 0}),
          "handlingTimeRetorno" = COALESCE("handlingTimeRetorno", ${old.handlingTimeReturn || 0})
        WHERE "id" = '${old.id}';
      `);

            console.log('✅ Dados migrados.');
        } else {
            console.log('\n📝 Criando registro inicial...');
            await prisma.$executeRawUnsafe(`
        INSERT INTO "TransportSettings" (
          "id", 
          "kmPriceLargada", "kmPriceLeva", "kmPriceTraz", "kmPriceRetorno",
          "minPriceLargada", "minPriceLeva", "minPriceTraz", "minPriceRetorno",
          "handlingTimeLargada", "handlingTimeLeva", "handlingTimeTraz", "handlingTimeRetorno",
          "updatedAt"
        ) VALUES (
          gen_random_uuid(),
          2.0, 2.0, 2.0, 2.0,
          1.5, 1.5, 1.5, 1.5,
          0, 0, 0, 0,
          NOW()
        );
      `);
            console.log('✅ Registro criado.');
        }

        console.log('\n✨ Atualização concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

updateTransportSettings()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
