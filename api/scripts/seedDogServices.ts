import prisma from '../lib/prisma';

async function seedDogServices() {
    const services = [
        // Banho - Pelo Longo - Cachorro
        { name: 'Banho Pelo Longo - Pequeno (1-10kg)', description: 'Banho completo para cães de pelo longo porte pequeno', basePrice: 60.00, duration: 60, category: 'Banho', species: 'Canino', minWeight: 1, maxWeight: 10, sizeLabel: 'P' },
        { name: 'Banho Pelo Longo - Médio (11-25kg)', description: 'Banho completo para cães de pelo longo porte médio', basePrice: 70.00, duration: 75, category: 'Banho', species: 'Canino', minWeight: 11, maxWeight: 25, sizeLabel: 'M' },
        { name: 'Banho Pelo Longo - Grande (26-35kg)', description: 'Banho completo para cães de pelo longo porte grande', basePrice: 80.00, duration: 90, category: 'Banho', species: 'Canino', minWeight: 26, maxWeight: 35, sizeLabel: 'G' },
        { name: 'Banho Pelo Longo - Extra Grande (36kg+)', description: 'Banho completo para cães de pelo longo porte extra grande', basePrice: 90.00, duration: 105, category: 'Banho', species: 'Canino', minWeight: 36, maxWeight: null, sizeLabel: 'GG' },

        // Banho - Pelo Curto - Cachorro
        { name: 'Banho Pelo Curto - Pequeno (1-10kg)', description: 'Banho completo para cães de pelo curto porte pequeno', basePrice: 50.00, duration: 45, category: 'Banho', species: 'Canino', minWeight: 1, maxWeight: 10, sizeLabel: 'P' },
        { name: 'Banho Pelo Curto - Médio (11-25kg)', description: 'Banho completo para cães de pelo curto porte médio', basePrice: 60.00, duration: 60, category: 'Banho', species: 'Canino', minWeight: 11, maxWeight: 25, sizeLabel: 'M' },
        { name: 'Banho Pelo Curto - Grande (26-35kg)', description: 'Banho completo para cães de pelo curto porte grande', basePrice: 70.00, duration: 75, category: 'Banho', species: 'Canino', minWeight: 26, maxWeight: 35, sizeLabel: 'G' },
        { name: 'Banho Pelo Curto - Extra Grande (36kg+)', description: 'Banho completo para cães de pelo curto porte extra grande', basePrice: 80.00, duration: 90, category: 'Banho', species: 'Canino', minWeight: 36, maxWeight: null, sizeLabel: 'GG' },

        // Tosa Higiênica - Cachorro
        { name: 'Tosa Higiênica - Pequeno (1-10kg)', description: 'Tosa higiênica para cães porte pequeno', basePrice: 30.00, duration: 30, category: 'Tosa', species: 'Canino', minWeight: 1, maxWeight: 10, sizeLabel: 'P' },
        { name: 'Tosa Higiênica - Médio (11-25kg)', description: 'Tosa higiênica para cães porte médio', basePrice: 40.00, duration: 40, category: 'Tosa', species: 'Canino', minWeight: 11, maxWeight: 25, sizeLabel: 'M' },
        { name: 'Tosa Higiênica - Grande (26-35kg)', description: 'Tosa higiênica para cães porte grande', basePrice: 50.00, duration: 50, category: 'Tosa', species: 'Canino', minWeight: 26, maxWeight: 35, sizeLabel: 'G' },
        { name: 'Tosa Higiênica - Extra Grande (36kg+)', description: 'Tosa higiênica para cães porte extra grande', basePrice: 60.00, duration: 60, category: 'Tosa', species: 'Canino', minWeight: 36, maxWeight: null, sizeLabel: 'GG' },

        // Tosa Completa - Cachorro
        { name: 'Tosa Completa - Pequeno (1-10kg)', description: 'Tosa completa para cães porte pequeno', basePrice: 80.00, duration: 90, category: 'Tosa', species: 'Canino', minWeight: 1, maxWeight: 10, sizeLabel: 'P' },
        { name: 'Tosa Completa - Médio (11-25kg)', description: 'Tosa completa para cães porte médio', basePrice: 100.00, duration: 105, category: 'Tosa', species: 'Canino', minWeight: 11, maxWeight: 25, sizeLabel: 'M' },
        { name: 'Tosa Completa - Grande (26-35kg)', description: 'Tosa completa para cães porte grande', basePrice: 120.00, duration: 120, category: 'Tosa', species: 'Canino', minWeight: 26, maxWeight: 35, sizeLabel: 'G' },
        { name: 'Tosa Completa - Extra Grande (36kg+)', description: 'Tosa completa para cães porte extra grande', basePrice: 150.00, duration: 150, category: 'Tosa', species: 'Canino', minWeight: 36, maxWeight: null, sizeLabel: 'GG' },

        // Banho & Tosa - Cachorro
        { name: 'Banho & Tosa - Pequeno (1-10kg)', description: 'Banho e tosa completa para cães porte pequeno', basePrice: 100.00, duration: 120, category: 'Banho & Tosa', species: 'Canino', minWeight: 1, maxWeight: 10, sizeLabel: 'P' },
        { name: 'Banho & Tosa - Médio (11-25kg)', description: 'Banho e tosa completa para cães porte médio', basePrice: 130.00, duration: 150, category: 'Banho & Tosa', species: 'Canino', minWeight: 11, maxWeight: 25, sizeLabel: 'M' },
        { name: 'Banho & Tosa - Grande (26-35kg)', description: 'Banho e tosa completa para cães porte grande', basePrice: 160.00, duration: 180, category: 'Banho & Tosa', species: 'Canino', minWeight: 26, maxWeight: 35, sizeLabel: 'G' },
        { name: 'Banho & Tosa - Extra Grande (36kg+)', description: 'Banho e tosa completa para cães porte extra grande', basePrice: 200.00, duration: 210, category: 'Banho & Tosa', species: 'Canino', minWeight: 36, maxWeight: null, sizeLabel: 'GG' },

        // Serviços Adicionais
        { name: 'Corte de Unha', description: 'Corte e lixamento de unhas', basePrice: 15.00, duration: 15, category: 'Adicional', species: 'Canino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Limpeza de Ouvido', description: 'Limpeza completa dos ouvidos', basePrice: 15.00, duration: 10, category: 'Adicional', species: 'Canino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Escovação de Pelos', description: 'Escovação e desembaraço de nós', basePrice: 20.00, duration: 20, category: 'Adicional', species: 'Canino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Hidratação Premium', description: 'Hidratação profunda dos pelos', basePrice: 25.00, duration: 30, category: 'Adicional', species: 'Canino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Perfume Premium', description: 'Aplicação de perfume premium', basePrice: 10.00, duration: 5, category: 'Adicional', species: 'Canino', minWeight: null, maxWeight: null, sizeLabel: null },
        { name: 'Laço/Bandana', description: 'Colocação de laço ou bandana', basePrice: 5.00, duration: 5, category: 'Adicional', species: 'Canino', minWeight: null, maxWeight: null, sizeLabel: null },
    ];

    console.log('🐕 Cadastrando serviços para cachorros...');
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

seedDogServices()
    .catch((e) => {
        console.error('Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
