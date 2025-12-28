const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sizes = ['P', 'M', 'G', 'GG'];
const durations = {
    'P': 40, 'M': 50, 'G': 60, 'GG': 80
};
const extraDuration = 15;

const servicesData = [
    // BANHOS PELOS CURTOS
    { category: 'Banho Curto', name: 'Tradicional', prices: [60, 70, 80, 90] },
    { category: 'Banho Curto', name: 'Especial (Máscara Ideal)', prices: [85, 95, 105, 115] },
    { category: 'Banho Curto', name: 'Medicamentoso (Clínica)', prices: [70, 80, 90, 100] },
    { category: 'Banho Curto', name: 'Medicamentoso (Cliente)', prices: [55, 65, 75, 85] },

    // BANHOS PELOS MÉDIOS
    { category: 'Banho Médio', name: 'Tradicional', prices: [70, 80, 90, 100] },
    { category: 'Banho Médio', name: 'Especial (Máscara Ideal)', prices: [95, 105, 115, 125] },
    { category: 'Banho Médio', name: 'Medicamentoso (Clínica)', prices: [80, 90, 100, 110] },
    { category: 'Banho Médio', name: 'Medicamentoso (Cliente)', prices: [65, 75, 85, 95] },

    // BANHOS PELOS LONGOS
    { category: 'Banho Longo', name: 'Tradicional', prices: [80, 90, 100, 110] },
    { category: 'Banho Longo', name: 'Especial (Máscara Ideal)', prices: [105, 115, 125, 135] },
    { category: 'Banho Longo', name: 'Medicamentoso (Clínica)', prices: [90, 100, 110, 120] },
    { category: 'Banho Longo', name: 'Medicamentoso (Cliente)', prices: [75, 85, 95, 105] },

    // TOSAS
    { category: 'Tosa', name: 'Higiênica', prices: [30, 35, 40, 45] },
    { category: 'Tosa', name: 'Estética', prices: [85, 105, 125, 145] },

    // EXTRAS
    { category: 'Extra', name: 'Desembolos Básicos', prices: [15, 20, 25, 30] },
    { category: 'Extra', name: 'Desembolos Intermediários', prices: [25, 30, 35, 45] },
    { category: 'Extra', name: 'Desembolos Avançados', prices: [35, 40, 45, 55] },
    { category: 'Extra', name: 'Corte de Unhas', prices: [15, 15, 20, 20] },
    { category: 'Extra', name: 'Limpeza de Ouvidos', prices: [7, 7, 10, 10] },
    { category: 'Extra', name: 'Escovação de Dentes (c/ escova)', prices: [5, 5, 7.5, 7.5] },
    { category: 'Extra', name: 'Escovação de Dentes (s/ escova)', prices: [15, 15, 17.5, 17.5] },
    { category: 'Extra', name: 'Hidratação Patas e Focinho', prices: [7, 7, 10, 10] },
    { category: 'Extra', name: 'Remoção de Pelos Mortos (Stripping)', prices: [20, 25, 35, 40] },
];

async function seed() {
    console.log('Starting CAT services seed...');
    let created = 0;

    // First, update all existing "Canino" services to be explicit if they aren't already
    // (Though default value handles this, running updateMany ensures consistency)
    const update = await prisma.service.updateMany({
        where: { species: 'Canino' }, // This logic is slightly circular if default is Canino, but safe.
        data: { species: 'Canino' }
    });
    console.log(`Ensured ${update.count} existing services are marked as Canino.`);

    for (const group of servicesData) {
        for (let i = 0; i < group.prices.length; i++) {
            const size = sizes[i];
            const price = group.prices[i];
            const duration = group.category.includes('Extra') ? extraDuration : durations[size];
            const serviceName = `${group.name} - ${size} (Gato)`;

            try {
                // Check if exists
                const existing = await prisma.service.findFirst({ where: { name: serviceName } });

                if (!existing) {
                    await prisma.service.create({
                        data: {
                            name: serviceName,
                            description: `Serviço de ${group.name} para gatos porte ${size}`,
                            basePrice: Number(price),
                            duration: duration,
                            category: group.category,
                            species: 'Felino'
                        }
                    });
                    created++;
                    process.stdout.write('.');
                }
            } catch (err) {
                console.error(`Error creating ${serviceName}:`, err.message);
            }
        }
    }

    console.log(`\nSeed completed! Created ${created} new CAT services.`);
    await prisma.$disconnect();
}

seed();
