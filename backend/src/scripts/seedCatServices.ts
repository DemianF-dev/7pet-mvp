import prisma from '../lib/prisma';

async function seedCatServices() {
    const services = [
        // Banho - Pelo Longo - Gato
        { name: 'Banho Pelo Longo - Pequeno (1-4kg)', description: 'Banho completo para gatos de pelo longo porte pequeno', basePrice: 80.00, duration: 60, category: 'Banho', species: 'Felino', minWeight: 1, maxWeight: 4, sizeLabel: 'P' },
        { name: 'Banho Pelo Longo - Médio (5-7kg)', description: 'Banho completo para gatos de pelo longo porte médio', basePrice: 90.00, duration: 75, category: 'Banho', species: 'Felino', minWeight: 5, maxWeight: 7, sizeLabel: 'M' },
        { name: 'Banho Pelo Longo - Grande (8kg+)', description: 'Banho completo para gatos de pelo longo porte grande', basePrice: 100.00, duration: 90, category: 'Banho', species: 'Felino', minWeight: 8, maxWeight: null, sizeLabel: 'G' },

        // Banho - Pelo Curto - Gato
        { name: 'Banho Pelo Curto - Pequeno (1-4kg)', description: 'Banho completo para gatos de pelo curto porte pequeno', basePrice: 70.00, duration: 45, category: 'Banho', species: 'Felino', minWeight: 1, maxWeight: 4, sizeLabel: 'P' },
        { name: 'Banho Pelo Curto - Médio (5-7kg)', description: 'Banho completo para gatos de pelo curto porte médio', basePrice: 80.00, duration: 60, category: 'Banho', species: 'Felino', minWeight: 5, maxWeight: 7, sizeLabel: 'M' },
        { name: 'Banho Pelo Curto - Grande (8kg+)', description: 'Banho completo para gatos de pelo curto porte grande', basePrice: 90.00, duration: 75, category: 'Banho', species: 'Felino', minWeight: 8, maxWeight: null, sizeLabel: 'G' },

        // Tosa Higiênica - Gato
        { name: 'Tosa Higiênica - Pequeno (1-4kg)', description: 'Tosa higiênica para gatos porte pequeno', basePrice: 50.00, duration: 30, category: 'Tosa', species: 'Felino', minWeight: 1, maxWeight: 4, sizeLabel: 'P' },
        { name: 'Tosa Higiênica - Médio (5-7kg)', description: 'Tosa higiênica para gatos porte médio', basePrice: 60.00, duration: 40, category: 'Tosa', species: 'Felino', minWeight: 5, maxWeight: 7, sizeLabel: 'M' },
        { name: 'Tosa Higiênica - Grande (8kg+)', description: 'Tosa higiênica para gatos porte grande', basePrice: 70.00, duration: 50, category: 'Tosa', species: 'Felino', minWeight: 8, maxWeight: null, sizeLabel: 'G' },

        // Tosa Completa (Leão) - Gato
        { name: 'Tosa Leão - Pequeno (1-4kg)', description: 'Tosa completa estilo leão para gatos porte pequeno', basePrice: 100.00, duration: 90, category: 'Tosa', species: 'Felino', minWeight: 1, maxWeight: 4, sizeLabel: 'P' },
        { name: 'Tosa Leão - Médio (5-7kg)', description: 'Tosa completa estilo leão para gatos porte médio', basePrice: 120.00, duration: 105, category: 'Tosa', species: 'Felino', minWeight: 5, maxWeight: 7, sizeLabel: 'M' },
        { name: 'Tosa Leão - Grande (8kg+)', description: 'Tosa completa estilo leão para gatos porte grande', basePrice: 140.00, duration: 120, category: 'Tosa', species: 'Felino', minWeight: 8, maxWeight: null, sizeLabel: 'G' },

        // Banho & Tosa - Gato
        { name: 'Banho & Tosa - Pequeno (1-4kg)', description: 'Banho e tosa completa para gatos porte pequeno', basePrice: 130.00, duration: 120, category: 'Banho & Tosa', species: 'Felino', minWeight: 1, maxWeight: 4, sizeLabel: 'P' },
        { name: 'Banho & Tosa - Médio (5-7kg)', description: 'Banho e tosa completa para gatos porte médio', basePrice: 150.00, duration: 150, category: 'Banho & Tosa', species: 'Felino', minWeight: 5, maxWeight: 7, sizeLabel: 'M' },
        { name: 'Banho & Tosa - Grande (8kg+)', description: 'Banho e tosa completa para gatos porte grande', basePrice: 170.00, duration: 180, category: 'Banho & Tosa', species: 'Felino', minWeight: 8, maxWeight: null, sizeLabel: 'G' },

        // Serviços Adicionais - Gato
        { name: 'Corte de Unha (Gato)', description: 'Corte e lixamento de unhas', basePrice: 20.00, duration: 15, category: 'Adicional', species: 'Felino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Limpeza de Ouvido (Gato)', description: 'Limpeza completa dos ouvidos', basePrice: 20.00, duration: 10, category: 'Adicional', species: 'Felino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Escovação de Pelos (Gato)', description: 'Escovação e desembaraço de nós', basePrice: 30.00, duration: 20, category: 'Adicional', species: 'Felino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Hidratação Premium (Gato)', description: 'Hidratação profunda dos pelos', basePrice: 35.00, duration: 30, category: 'Adicional', species: 'Felino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Perfume Premium (Gato)', description: 'Aplicação de perfume premium específico para gatos', basePrice: 15.00, duration: 5, category: 'Adicional', species: 'Felino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Laço/Bandana (Gato)', description: 'Colocação de laço ou bandana', basePrice: 5.00, duration: 5, category: 'Adicional', species: 'Felino', minWeight: null, maxWeight: null, sizeLabel: null },

        // Tosa Bebê - Gato
        { name: 'Tosa Bebê - Pequeno (1-4kg)', description: 'Tosa estilo bebê para gatos porte pequeno', basePrice: 90.00, duration: 75, category: 'Tosa', species: 'Felino', minWeight: 1, maxWeight: 4, sizeLabel: 'P' },
        { name: 'Tosa Bebê - Médio (5-7kg)', description: 'Tosa estilo bebê para gatos porte médio', basePrice: 110.00, duration: 90, category: 'Tosa', species: 'Felino', minWeight: 5, maxWeight: 7, sizeLabel: 'M' },
        { name: 'Tosa Bebê - Grande (8kg+)', description: 'Tosa estilo bebê para gatos porte grande', basePrice: 130.00, duration: 105, category: 'Tosa', species: 'Felino', minWeight: 8, maxWeight: null, sizeLabel: 'G' },
    ];

    console.log('🐱 Cadastrando serviços para gatos...');
    let successCount = 0;
    let errorCount = 0;

    for (const service of services) {
        try {
            // Check if already exists
            const exists = await prisma.service.findFirst({
                where: { name: service.name }
            });

            if (exists) {
                console.log(`⏭️  ${service.name} (já existe)`);
                continue;
            }

            const created = await prisma.service.create({
                data: {
                    name: service.name,
                    description: service.description,
                    basePrice: service.basePrice,
                    duration: service.duration,
                    category: service.category,
                    species: service.species,
                    minWeight: service.minWeight,
                    maxWeight: service.maxWeight,
                    sizeLabel: service.sizeLabel,
                }
            });
            console.log(`✅ ${created.name} - R$ ${created.basePrice.toFixed(2)}`);
            successCount++;
        } catch (error: any) {
            console.error(`❌ Erro ao cadastrar ${service.name}:`, error.message);
            errorCount++;
        }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`✅ ${successCount} serviços cadastrados`);
    console.log(`❌ ${errorCount} erros`);
}

seedCatServices()
    .catch((e) => {
        console.error('Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
