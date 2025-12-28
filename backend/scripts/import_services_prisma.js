const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sizes = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const durations = {
    'PP': 30, 'P': 40, 'M': 50, 'G': 60, 'GG': 80, 'XG': 90
};
const extraDuration = 15;

const servicesData = [
    // BANHOS PELOS CURTOS
    { category: 'Banho Curto', name: 'Tradicional', prices: [40, 50, 70, 95, 135, 185] },
    { category: 'Banho Curto', name: 'Especial (Máscara Ideal)', prices: [60, 70, 90, 115, 165, 225] },
    { category: 'Banho Curto', name: 'Medicamentoso (Clínica)', prices: [50, 60, 80, 110, 155, 215] },
    { category: 'Banho Curto', name: 'Medicamentoso (Cliente)', prices: [35, 45, 65, 90, 130, 180] },

    // BANHOS PELOS MÉDIOS
    { category: 'Banho Médio', name: 'Tradicional', prices: [45, 55, 75, 100, 140, 195] },
    { category: 'Banho Médio', name: 'Especial (Máscara Ideal)', prices: [65, 75, 95, 120, 170, 235] },
    { category: 'Banho Médio', name: 'Medicamentoso (Clínica)', prices: [55, 65, 85, 115, 160, 225] },
    { category: 'Banho Médio', name: 'Medicamentoso (Cliente)', prices: [40, 50, 70, 95, 135, 190] },

    // BANHOS PELOS LONGOS
    { category: 'Banho Longo', name: 'Tradicional', prices: [50, 60, 80, 105, 145, 205] },
    { category: 'Banho Longo', name: 'Especial (Máscara Ideal)', prices: [70, 80, 100, 125, 175, 245] },
    { category: 'Banho Longo', name: 'Medicamentoso (Clínica)', prices: [60, 70, 90, 120, 165, 235] },
    { category: 'Banho Longo', name: 'Medicamentoso (Cliente)', prices: [45, 55, 75, 100, 140, 200] },

    // TOSAS
    { category: 'Tosa', name: 'Higiênica', prices: [15, 20, 25, 35, 45, 55] },
    { category: 'Tosa', name: 'Estética', prices: [80, 90, 100, 125, 155, 190] },
    { category: 'Tosa', name: 'Raça (Trimming)', prices: [90, 100, 110, 130, 160, 200] },
    { category: 'Tosa', name: 'Bebê', prices: [100, 110, 120, 145, 175, 220] },

    // EXTRAS
    { category: 'Extra', name: 'Desembolo Básico', prices: [20, 25, 30, 35, 45, 55] },
    { category: 'Extra', name: 'Desembolo Intermediário', prices: [30, 35, 40, 45, 55, 65] },
    { category: 'Extra', name: 'Desembolo Avançado', prices: [40, 45, 50, 55, 65, 75] },
    { category: 'Extra', name: 'Corte de Unhas', prices: [15, 15, 20, 20, 25, 25] },
    { category: 'Extra', name: 'Limpeza de Ouvidos', prices: [7, 7, 7, 10, 10, 10] },
    { category: 'Extra', name: 'Head Trimming', prices: [10, 15, 20, 20, 25, 30] },
    { category: 'Extra', name: 'Escovação de Dentes (c/ escova)', prices: [5, 5, 5, 7.5, 7.5, 7.5] },
    { category: 'Extra', name: 'Escovação de Dentes (s/ escova)', prices: [15, 15, 15, 17.5, 17.5, 17.5] },
    { category: 'Extra', name: 'Hidratação Patas e Focinho', prices: [7, 7, 10, 10, 17.5, 17.5] },
    { category: 'Extra', name: 'Stripping (Remoção Pelos Mortos)', prices: [15, 20, 40, 55, 80, 100] },
    { category: 'Extra', name: 'Penteados', prices: [20, 20, 25, 25, 30, 30] },
];

async function seed() {
    console.log('Starting seed...');
    let created = 0;

    for (const group of servicesData) {
        for (let i = 0; i < group.prices.length; i++) {
            const size = sizes[i];
            const price = group.prices[i];
            const duration = group.category.includes('Extra') ? extraDuration : durations[size];
            const serviceName = `${group.name} - ${size}`;

            try {
                // Check if exists
                const existing = await prisma.service.findFirst({ where: { name: serviceName } });

                if (!existing) {
                    await prisma.service.create({
                        data: {
                            name: serviceName,
                            description: `Serviço de ${group.name} para porte ${size}`,
                            basePrice: Number(price),
                            duration: duration,
                            category: group.category
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

    console.log(`\nSeed completed! Created ${created} new services.`);
    await prisma.$disconnect();
}

seed();
