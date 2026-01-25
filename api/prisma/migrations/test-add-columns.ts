import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parse price
function parsePrice(priceStr: string): number {
    return parseFloat(priceStr.replace('R$', '').replace('.', '').replace(',', '.').trim());
}

// Parse time to minutes
function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + (minutes || 0);
}

async function addMissingColumnsAndPopulate() {
    try {
        console.log('🔧 Adicionando colunas ao banco (se necessário)...\n');

        // Add columns using raw SQL
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE "Service" 
        ADD COLUMN IF NOT EXISTS "subcategory" TEXT,
        ADD COLUMN IF NOT EXISTS "type" TEXT,
        ADD COLUMN IF NOT EXISTS "coatType" TEXT,
        ADD COLUMN IF NOT EXISTS "unit" TEXT DEFAULT 'por pet';
      `);
            console.log('✅ Colunas adicionadas.');
        } catch (e) {
            console.log('ℹ️ Colunas já existem ou erro:', (e as Error).message);
        }

        console.log('\n🧹 Removendo serviços antigos...');
        await prisma.service.updateMany({
            data: { deletedAt: new Date() }
        });
        console.log('✅ Serviços antigos removidos.\n');

        console.log('🌱 Criando serviços CORRETOS da planilha...\n');

        // Simplified data - just key examples to test
        const services = [
            // Banhos Felinos
            { category: 'Banhos', subcategory: 'Linha Especial', type: null, name: 'Banho Linha Especial com Máscara Ideal', sizeLabel: 'PP', coatType: 'Curto', basePrice: 60, unit: 'por pet', duration: 60, species: 'Felino' },
            { category: 'Banhos', subcategory: 'Tradicional', type: null, name: 'Banho Tradicional', sizeLabel: 'P', coatType: 'Curto', basePrice: 50, unit: 'por pet', duration: 60, species: 'Felino' },

            // Tosas Felinas
            { category: 'Tosas', subcategory: 'Higiênica', type: null, name: 'Tosa Higiênica', sizeLabel: 'PP', coatType: null, basePrice: 15, unit: 'por pet', duration: 30, species: 'Felino' },
            { category: 'Tosas', subcategory: 'Bebê', type: null, name: 'Tosa Bebê', sizeLabel: 'PP', coatType: null, basePrice: 100, unit: 'por pet', duration: 60, species: 'Felino' },

            // Adicionais Felinos
            { category: 'Adicionais', subcategory: 'Corta Unha', type: null, name: 'Corte de unhas', sizeLabel: 'PP', coatType: null, basePrice: 15, unit: 'por pet', duration: 10, species: 'Felino' },
            { category: 'Adicionais', subcategory: 'Desembolo', type: 'Básico', name: 'Desembolo', sizeLabel: 'PP', coatType: null, basePrice: 20, unit: 'por hora', duration: 60, species: 'Felino' },

            // Same for Canino
            { category: 'Banhos', subcategory: 'Linha Especial', type: null, name: 'Banho Linha Especial com Máscara Ideal', sizeLabel: 'PP', coatType: 'Curto', basePrice: 60, unit: 'por pet', duration: 60, species: 'Canino' },
            { category: 'Banhos', subcategory: 'Tradicional', type: null, name: 'Banho Tradicional', sizeLabel: 'P', coatType: 'Curto', basePrice: 50, unit: 'por pet', duration: 60, species: 'Canino' },
            { category: 'Tosas', subcategory: 'Higiênica', type: null, name: 'Tosa Higiênica', sizeLabel: 'PP', coatType: null, basePrice: 15, unit: 'por pet', duration: 30, species: 'Canino' },
            { category: 'Adicionais', subcategory: 'Corta Unha', type: null, name: 'Corte de unhas', sizeLabel: 'PP', coatType: null, basePrice: 15, unit: 'por pet', duration: 10, species: 'Canino' },
        ];

        let created = 0;
        for (const service of services) {
            await prisma.service.create({
                data: {
                    ...service,
                    description: `${service.name} - ${service.species}${service.sizeLabel ? ` (${service.sizeLabel})` : ''}${service.coatType ? ` [${service.coatType}]` : ''}`
                }
            });
            created++;
            console.log(`✓ ${service.name} (${service.species} - ${service.sizeLabel || 'N/A'})`);
        }

        console.log(`\n🎉 ${created} serviços de teste criados com sucesso!`);
        console.log('\n⚠️ NOTA: Este é um teste com poucos serviços.');
        console.log('   Se funcionou, podemos popular TODOS os 328 serviços da planilha.');

    } catch (error) {
        console.error('❌ Erro:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addMissingColumnsAndPopulate()
    .then(() => {
        console.log('\n✨ Teste concluído!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Falha:', error);
        process.exit(1);
    });
