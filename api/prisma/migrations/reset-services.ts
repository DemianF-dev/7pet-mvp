import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tabela completa de serviços para CÃES conforme planilha 7Pet
const DOG_SERVICES = [
    // BANHOS - PELO LONGO
    { category: 'Banho', name: 'Banho - Longo Porte P', species: 'Canino', basePrice: 50, duration: 60, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Banho completo para cães de pelo longo - Porte P' },
    { category: 'Banho', name: 'Banho - Longo Porte M', species: 'Canino', basePrice: 60, duration: 75, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Banho completo para cães de pelo longo - Porte M' },
    { category: 'Banho', name: 'Banho - Longo Porte G', species: 'Canino', basePrice: 75, duration: 90, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Banho completo para cães de pelo longo - Porte G' },
    { category: 'Banho', name: 'Banho - Longo Porte GG', species: 'Canino', basePrice: 95, duration: 120, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Banho completo para cães de pelo longo - Porte GG' },

    // BANHOS - PELO MÉDIO
    { category: 'Banho', name: 'Banho - Médio Porte P', species: 'Canino', basePrice: 45, duration: 50, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Banho completo para cães de pelo médio - Porte P' },
    { category: 'Banho', name: 'Banho - Médio Porte M', species: 'Canino', basePrice: 55, duration: 65, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Banho completo para cães de pelo médio - Porte M' },
    { category: 'Banho', name: 'Banho - Médio Porte G', species: 'Canino', basePrice: 70, duration: 80, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Banho completo para cães de pelo médio - Porte G' },
    { category: 'Banho', name: 'Banho - Médio Porte GG', species: 'Canino', basePrice: 85, duration: 100, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Banho completo para cães de pelo médio - Porte GG' },

    // BANHOS - PELO CURTO
    { category: 'Banho', name: 'Banho - Curto Porte P', species: 'Canino', basePrice: 40, duration: 45, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Banho completo para cães de pelo curto - Porte P' },
    { category: 'Banho', name: 'Banho - Curto Porte M', species: 'Canino', basePrice: 50, duration: 60, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Banho completo para cães de pelo curto - Porte M' },
    { category: 'Banho', name: 'Banho - Curto Porte G', species: 'Canino', basePrice: 65, duration: 75, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Banho completo para cães de pelo curto - Porte G' },
    { category: 'Banho', name: 'Banho - Curto Porte GG', species: 'Canino', basePrice: 80, duration: 90, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Banho completo para cães de pelo curto - Porte GG' },

    // TOSA HIGIÊNICA
    { category: 'Tosa', name: 'Tosa higiênica - Porte P', species: 'Canino', basePrice: 55, duration: 60, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte P' },
    { category: 'Tosa', name: 'Tosa higiênica - Porte M', species: 'Canino', basePrice: 65, duration: 75, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte M' },
    { category: 'Tosa', name: 'Tosa higiênica - Porte G', species: 'Canino', basePrice: 80, duration: 90, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte G' },
    { category: 'Tosa', name: 'Tosa higiênica - Porte GG', species: 'Canino', basePrice: 100, duration: 120, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte GG' },

    // TOSA BEBÊ
    { category: 'Tosa', name: 'Tosa bebê - Porte P', species: 'Canino', basePrice: 70, duration: 90, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Tosa bebê completa - Porte P' },
    { category: 'Tosa', name: 'Tosa bebê - Porte M', species: 'Canino', basePrice: 90, duration: 120, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Tosa bebê completa - Porte M' },
    { category: 'Tosa', name: 'Tosa bebê - Porte G', species: 'Canino', basePrice: 120, duration: 150, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Tosa bebê completa - Porte G' },
    { category: 'Tosa', name: 'Tosa bebê - Porte GG', species: 'Canino', basePrice: 150, duration: 180, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Tosa bebê completa - Porte GG' },

    // TOSA NA NAVALHA
    { category: 'Tosa', name: 'Tosa na navalha - Porte P', species: 'Canino', basePrice: 65, duration: 80, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Tosa com máquina (navalha) - Porte P' },
    { category: 'Tosa', name: 'Tosa na navalha - Porte M', species: 'Canino', basePrice: 85, duration: 100, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Tosa com máquina (navalha) - Porte M' },
    { category: 'Tosa', name: 'Tosa na navalha - Porte G', species: 'Canino', basePrice: 110, duration: 135, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Tosa com máquina (navalha) - Porte G' },
    { category: 'Tosa', name: 'Tosa na navalha - Porte GG', species: 'Canino', basePrice: 140, duration: 165, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Tosa com máquina (navalha) - Porte GG' },

    // TOSA NA TESOURA
    { category: 'Tosa', name: 'Tosa na tesoura - Porte P', species: 'Canino', basePrice: 75, duration: 100, minWeight: 0, maxWeight: 5, sizeLabel: 'P', description: 'Tosa com tesoura (artística) - Porte P' },
    { category: 'Tosa', name: 'Tosa na tesoura - Porte M', species: 'Canino', basePrice: 95, duration: 130, minWeight: 5, maxWeight: 15, sizeLabel: 'M', description: 'Tosa com tesoura (artística) - Porte M' },
    { category: 'Tosa', name: 'Tosa na tesoura - Porte G', species: 'Canino', basePrice: 125, duration: 165, minWeight: 15, maxWeight: 30, sizeLabel: 'G', description: 'Tosa com tesoura (artística) - Porte G' },
    { category: 'Tosa', name: 'Tosa na tesoura - Porte GG', species: 'Canino', basePrice: 155, duration: 200, minWeight: 30, maxWeight: null, sizeLabel: 'GG', description: 'Tosa com tesoura (artística) - Porte GG' },

    // SERVIÇOS EXTRAS
    { category: 'Extra', name: 'Hidratação', species: 'Canino', basePrice: 35, duration: 30, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Hidratação profunda do pelo' },
    { category: 'Extra', name: 'Escovação', species: 'Canino', basePrice: 25, duration: 20, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Escovação e desembaraço' },
    { category: 'Extra', name: 'Limpeza de ouvidos', species: 'Canino', basePrice: 15, duration: 10, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Limpeza completa dos ouvidos' },
    { category: 'Extra', name: 'Limpeza de glândulas', species: 'Canino', basePrice: 20, duration: 10, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Esvaziamento de glândulas perianais' },
    { category: 'Extra', name: 'Anti-stress', species: 'Canino', basePrice: 30, duration: 20, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Banho relaxante anti-stress' },
    { category: 'Extra', name: 'Corte de unha', species: 'Canino', basePrice: 20, duration: 15, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Corte e lixa de unhas' },
    { category: 'Extra', name: 'SPA dos pés', species: 'Canino', basePrice: 25, duration: 20, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Tratamento especial para as patas' },
    { category: 'Extra', name: 'Escovação de dentes', species: 'Canino', basePrice: 25, duration: 15, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Escovação dentária completa' },
    { category: 'Extra', name: 'Perfume', species: 'Canino', basePrice: 15, duration: 5, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Perfume especial para pets' },
    { category: 'Extra', name: 'Laço/Bandana', species: 'Canino', basePrice: 10, duration: 5, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Acessório decorativo' },
];

async function resetAndSeedServices() {
    try {
        console.log('🧹 Iniciando limpeza de serviços antigos...');

        // Soft delete de todos os serviços existentes
        await prisma.service.updateMany({
            data: {
                deletedAt: new Date()
            }
        });

        console.log('✅ Serviços antigos marcados como deletados.');
        console.log('🌱 Iniciando criação de novos serviços...');

        let createdCount = 0;

        for (const service of DOG_SERVICES) {
            await prisma.service.create({
                data: {
                    name: service.name,
                    description: service.description,
                    basePrice: service.basePrice,
                    duration: service.duration,
                    category: service.category,
                    species: service.species,
                    minWeight: service.minWeight,
                    maxWeight: service.maxWeight,
                    sizeLabel: service.sizeLabel
                }
            });
            createdCount++;
            console.log(`✓ ${service.name}`);
        }

        console.log(`\n🎉 Sucesso! ${createdCount} serviços criados.`);
        console.log('\n📊 Resumo por categoria:');
        console.log(`  - Banho: ${DOG_SERVICES.filter(s => s.category === 'Banho').length}`);
        console.log(`  - Tosa: ${DOG_SERVICES.filter(s => s.category === 'Tosa').length}`);
        console.log(`  - Extra: ${DOG_SERVICES.filter(s => s.category === 'Extra').length}`);

    } catch (error) {
        console.error('❌ Erro ao resetar serviços:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
resetAndSeedServices()
    .then(() => {
        console.log('\n✨ Migração concluída com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Falha na migração:', error);
        process.exit(1);
    });
