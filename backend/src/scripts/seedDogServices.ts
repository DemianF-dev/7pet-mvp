import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sizes = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
const weightLabels = {
    'PP': '0 a 2,99 kg',
    'P': '3 a 7,99 kg',
    'M': '8 a 17,99 kg',
    'G': '18 a 34,99 kg',
    'GG': '35 a 49,99 kg',
    'XG': '> 50 kg'
};

async function main() {
    console.log('Iniciando cadastro de serviços de Cães...');

    const servicesData = [
        // BANHOS PELOS CURTOS
        { category: 'Banho Pelo Curto', sub: 'Linha Tradicional', duration: 45, prices: [40, 50, 70, 95, 135, 185] },
        { category: 'Banho Pelo Curto', sub: 'Linha Especial (Máscara)', duration: 60, prices: [60, 70, 90, 115, 165, 225] },
        { category: 'Banho Pelo Curto', sub: 'Medicamentoso (Anti-pulgas/Clorexidina)', duration: 60, prices: [50, 60, 80, 110, 155, 215] },
        { category: 'Banho Pelo Curto', sub: 'Medicamentoso (Prod. Cliente)', duration: 45, prices: [35, 45, 65, 90, 130, 180] },

        // BANHOS PELOS MÉDIOS
        { category: 'Banho Pelo Médio', sub: 'Tradicionais', duration: 60, prices: [45, 55, 75, 100, 140, 195] },
        { category: 'Banho Pelo Médio', sub: 'Linha Especial (Máscara)', duration: 75, prices: [65, 75, 95, 120, 170, 235] },
        { category: 'Banho Pelo Médio', sub: 'Medicamentoso (Anti-pulgas/Clorexidina)', duration: 75, prices: [55, 65, 85, 115, 160, 225] },
        { category: 'Banho Pelo Médio', sub: 'Medicamentoso (Prod. Cliente)', duration: 60, prices: [40, 50, 70, 95, 135, 190] },

        // BANHOS PELOS LONGOS
        { category: 'Banho Pelo Longo', sub: 'Tradicionais', duration: 75, prices: [50, 60, 80, 105, 145, 205] },
        { category: 'Banho Pelo Longo', sub: 'Linha Especial (Máscara)', duration: 90, prices: [70, 80, 100, 125, 175, 245] },
        { category: 'Banho Pelo Longo', sub: 'Medicamentoso (Anti-pulgas/Clorexidina)', duration: 90, prices: [60, 70, 90, 120, 165, 235] },
        { category: 'Banho Pelo Longo', sub: 'Medicamentoso (Prod. Cliente)', duration: 75, prices: [45, 55, 75, 100, 140, 200] },

        // TOSAS
        { category: 'Tosa', sub: 'Higiênica', duration: 30, prices: [15, 20, 25, 35, 45, 55] },
        { category: 'Tosa', sub: 'Estética (Geral Tesoura)', duration: 120, prices: [80, 90, 100, 125, 155, 190] },
        { category: 'Tosa', sub: 'Raça (Trimming)', duration: 120, prices: [90, 100, 110, 130, 160, 200] },
        { category: 'Tosa', sub: 'Bebê', duration: 90, prices: [100, 110, 120, 145, 175, 220] },

        // EXTRAS
        { category: 'Extra', sub: 'Desembolo Básico (/hr)', duration: 60, prices: [20, 25, 30, 35, 45, 55] },
        { category: 'Extra', sub: 'Desembolo Intermediário (/hr)', duration: 60, prices: [30, 35, 40, 45, 55, 65] },
        { category: 'Extra', sub: 'Desembolo Avançado (/hr)', duration: 60, prices: [40, 45, 50, 55, 65, 75] },
        { category: 'Extra', sub: 'Corte de Unhas', duration: 15, prices: [15, 15, 20, 20, 25, 25] },
        { category: 'Extra', sub: 'Limpeza de Ouvidos', duration: 10, prices: [7, 7, 7, 10, 10, 10] },
        { category: 'Extra', sub: 'Head Trimming (Tesoura Cabecinha)', duration: 20, prices: [10, 15, 20, 20, 25, 30] },
        { category: 'Extra', sub: 'Escovação de Dentes (c/ escova)', duration: 10, prices: [5, 5, 5, 7.5, 7.5, 7.5] },
        { category: 'Extra', sub: 'Escovação de Dentes (s/ escova)', duration: 15, prices: [15, 15, 15, 17.5, 17.5, 17.5] },
        { category: 'Extra', sub: 'Hidratação Patas e Focinho', duration: 10, prices: [7, 7, 10, 10, 17.5, 17.5] },
        { category: 'Extra', sub: 'Remoção de Pelos Mortos (Stripping)', duration: 45, prices: [15, 20, 40, 55, 80, 100] },
        { category: 'Extra', sub: 'Penteado', duration: 20, prices: [20, 20, 25, 25, 30, 30] },
    ];

    for (const service of servicesData) {
        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const price = service.prices[i];
            const weight = weightLabels[size as keyof typeof weightLabels];

            await prisma.service.create({
                data: {
                    name: `${service.category} - ${service.sub} (${size})`,
                    basePrice: price,
                    description: `Porte ${size} - Peso: ${weight}`,
                    category: service.category,
                    duration: service.duration,
                    species: 'Cachorro'
                }
            });
        }
    }

    console.log('✅ Todos os serviços de Cães foram cadastrados com sucesso!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
