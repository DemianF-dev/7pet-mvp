import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tabela completa de serviços para GATOS conforme planilha 7Pet
const CAT_SERVICES = [
    // BANHOS - PELO LONGO
    { category: 'Banho', name: 'Banho - Longo Porte P', species: 'Felino', basePrice: 60, duration: 60, minWeight: 0, maxWeight: 3, sizeLabel: 'P', description: 'Banho completo para gatos de pelo longo - Porte P' },
    { category: 'Banho', name: 'Banho - Longo Porte M', species: 'Felino', basePrice: 70, duration: 75, minWeight: 3, maxWeight: 5, sizeLabel: 'M', description: 'Banho completo para gatos de pelo longo - Porte M' },
    { category: 'Banho', name: 'Banho - Longo Porte G', species: 'Felino', basePrice: 85, duration: 90, minWeight: 5, maxWeight: 8, sizeLabel: 'G', description: 'Banho completo para gatos de pelo longo - Porte G' },
    { category: 'Banho', name: 'Banho - Longo Porte GG', species: 'Felino', basePrice: 100, duration: 105, minWeight: 8, maxWeight: null, sizeLabel: 'GG', description: 'Banho completo para gatos de pelo longo - Porte GG' },

    // BANHOS - PELO MÉDIO
    { category: 'Banho', name: 'Banho - Médio Porte P', species: 'Felino', basePrice: 55, duration: 50, minWeight: 0, maxWeight: 3, sizeLabel: 'P', description: 'Banho completo para gatos de pelo médio - Porte P' },
    { category: 'Banho', name: 'Banho - Médio Porte M', species: 'Felino', basePrice: 65, duration: 65, minWeight: 3, maxWeight: 5, sizeLabel: 'M', description: 'Banho completo para gatos de pelo médio - Porte M' },
    { category: 'Banho', name: 'Banho - Médio Porte G', species: 'Felino', basePrice: 80, duration: 80, minWeight: 5, maxWeight: 8, sizeLabel: 'G', description: 'Banho completo para gatos de pelo médio - Porte G' },
    { category: 'Banho', name: 'Banho - Médio Porte GG', species: 'Felino', basePrice: 95, duration: 95, minWeight: 8, maxWeight: null, sizeLabel: 'GG', description: 'Banho completo para gatos de pelo médio - Porte GG' },

    // BANHOS - PELO CURTO
    { category: 'Banho', name: 'Banho - Curto Porte P', species: 'Felino', basePrice: 50, duration: 45, minWeight: 0, maxWeight: 3, sizeLabel: 'P', description: 'Banho completo para gatos de pelo curto - Porte P' },
    { category: 'Banho', name: 'Banho - Curto Porte M', species: 'Felino', basePrice: 60, duration: 60, minWeight: 3, maxWeight: 5, sizeLabel: 'M', description: 'Banho completo para gatos de pelo curto - Porte M' },
    { category: 'Banho', name: 'Banho - Curto Porte G', species: 'Felino', basePrice: 75, duration: 75, minWeight: 5, maxWeight: 8, sizeLabel: 'G', description: 'Banho completo para gatos de pelo curto - Porte G' },
    { category: 'Banho', name: 'Banho - Curto Porte GG', species: 'Felino', basePrice: 90, duration: 85, minWeight: 8, maxWeight: null, sizeLabel: 'GG', description: 'Banho completo para gatos de pelo curto - Porte GG' },

    // TOSA HIGIÊNICA
    { category: 'Tosa', name: 'Tosa higiênica - Porte P', species: 'Felino', basePrice: 65, duration: 60, minWeight: 0, maxWeight: 3, sizeLabel: 'P', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte P' },
    { category: 'Tosa', name: 'Tosa higiênica - Porte M', species: 'Felino', basePrice: 75, duration: 75, minWeight: 3, maxWeight: 5, sizeLabel: 'M', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte M' },
    { category: 'Tosa', name: 'Tosa higiênica - Porte G', species: 'Felino', basePrice: 90, duration: 90, minWeight: 5, maxWeight: 8, sizeLabel: 'G', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte G' },
    { category: 'Tosa', name: 'Tosa higiênica - Porte GG', species: 'Felino', basePrice: 105, duration: 100, minWeight: 8, maxWeight: null, sizeLabel: 'GG', description: 'Tosa higiênica (patas, região íntima, orelhas) - Porte GG' },

    // TOSA BEBÊ
    { category: 'Tosa', name: 'Tosa bebê - Porte P', species: 'Felino', basePrice: 80, duration: 90, minWeight: 0, maxWeight: 3, sizeLabel: 'P', description: 'Tosa bebê completa - Porte P' },
    { category: 'Tosa', name: 'Tosa bebê - Porte M', species: 'Felino', basePrice: 100, duration: 120, minWeight: 3, maxWeight: 5, sizeLabel: 'M', description: 'Tosa bebê completa - Porte M' },
    { category: 'Tosa', name: 'Tosa bebê - Porte G', species: 'Felino', basePrice: 130, duration: 150, minWeight: 5, maxWeight: 8, sizeLabel: 'G', description: 'Tosa bebê completa - Porte G' },
    { category: 'Tosa', name: 'Tosa bebê - Porte GG', species: 'Felino', basePrice: 160, duration: 165, minWeight: 8, maxWeight: null, sizeLabel: 'GG', description: 'Tosa bebê completa - Porte GG' },

    // TOSA NA TESOURA
    { category: 'Tosa', name: 'Tosa na tesoura - Porte P', species: 'Felino', basePrice: 85, duration: 100, minWeight: 0, maxWeight: 3, sizeLabel: 'P', description: 'Tosa com tesoura (artística) - Porte P' },
    { category: 'Tosa', name: 'Tosa na tesoura - Porte M', species: 'Felino', basePrice: 105, duration: 130, minWeight: 3, maxWeight: 5, sizeLabel: 'M', description: 'Tosa com tesoura (artística) - Porte M' },
    { category: 'Tosa', name: 'Tosa na tesoura - Porte G', species: 'Felino', basePrice: 135, duration: 165, minWeight: 5, maxWeight: 8, sizeLabel: 'G', description: 'Tosa com tesoura (artística) - Porte G' },
    { category: 'Tosa', name: 'Tosa na tesoura - Porte GG', species: 'Felino', basePrice: 165, duration: 185, minWeight: 8, maxWeight: null, sizeLabel: 'GG', description: 'Tosa com tesoura (artística) - Porte GG' },

    // SERVIÇOS EXTRAS
    { category: 'Extra', name: 'Hidratação', species: 'Felino', basePrice: 40, duration: 30, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Hidratação profunda do pelo' },
    { category: 'Extra', name: 'Escovação', species: 'Felino', basePrice: 30, duration: 20, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Escovação e desembaraço' },
    { category: 'Extra', name: 'Limpeza de ouvidos', species: 'Felino', basePrice: 20, duration: 10, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Limpeza completa dos ouvidos' },
    { category: 'Extra', name: 'Limpeza de glândulas', species: 'Felino', basePrice: 25, duration: 10, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Esvaziamento de glândulas perianais' },
    { category: 'Extra', name: 'Anti-stress', species: 'Felino', basePrice: 35, duration: 20, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Banho relaxante anti-stress' },
    { category: 'Extra', name: 'Corte de unha', species: 'Felino', basePrice: 25, duration: 15, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Corte e lixa de unhas' },
    { category: 'Extra', name: 'SPA dos pés', species: 'Felino', basePrice: 30, duration: 20, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Tratamento especial para as patas' },
    { category: 'Extra', name: 'Escovação de dentes', species: 'Felino', basePrice: 30, duration: 15, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Escovação dentária completa' },
    { category: 'Extra', name: 'Perfume', species: 'Felino', basePrice: 20, duration: 5, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Perfume especial para pets' },
    { category: 'Extra', name: 'Laço/Bandana', species: 'Felino', basePrice: 10, duration: 5, minWeight: null, maxWeight: null, sizeLabel: null, description: 'Acessório decorativo' },
];

async function addCatServices() {
    try {
        console.log('🐱 Iniciando criação de serviços para GATOS...\n');

        let createdCount = 0;

        for (const service of CAT_SERVICES) {
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

        console.log(`\n🎉 Sucesso! ${createdCount} serviços para gatos criados.`);
        console.log('\n📊 Resumo por categoria:');
        console.log(`  - Banho: ${CAT_SERVICES.filter(s => s.category === 'Banho').length}`);
        console.log(`  - Tosa: ${CAT_SERVICES.filter(s => s.category === 'Tosa').length}`);
        console.log(`  - Extra: ${CAT_SERVICES.filter(s => s.category === 'Extra').length}`);

        // Resumo total do sistema
        const totalServices = await prisma.service.count({ where: { deletedAt: null } });
        const totalDogs = await prisma.service.count({ where: { species: 'Canino', deletedAt: null } });
        const totalCats = await prisma.service.count({ where: { species: 'Felino', deletedAt: null } });

        console.log('\n📈 Total no sistema:');
        console.log(`  🐕 Cães: ${totalDogs} serviços`);
        console.log(`  🐱 Gatos: ${totalCats} serviços`);
        console.log(`  🎯 Total: ${totalServices} serviços ativos`);

    } catch (error) {
        console.error('❌ Erro ao adicionar serviços para gatos:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Executar
addCatServices()
    .then(() => {
        console.log('\n✨ Serviços para gatos adicionados com sucesso!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Falha ao adicionar serviços:', error);
        process.exit(1);
    });
