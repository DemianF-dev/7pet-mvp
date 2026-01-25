import prisma from '../lib/prisma';

/**
 * Script para padronizar nomes de serviços
 * Formato: TipoServiço + Porte + Pelagem (para banhos)
 * Exemplos: "Banho M Curto", "Tosa Higiênica P", "Banho Máscara XG Longo"
 */

interface ServiceDef {
    name: string;
    category: string;
    species: string;
    sizeLabel: string;
    minWeight: number;
    maxWeight: number | null;
    coatType?: string; // CURTO, MEDIO, LONGO (only for baths)
    basePrice: number;
    duration: number;
}

// Definição de portes por peso
const SIZES = [
    { label: 'PP', min: 0, max: 3 },
    { label: 'P', min: 3.1, max: 8 },
    { label: 'M', min: 8.1, max: 15 },
    { label: 'G', min: 15.1, max: 25 },
    { label: 'GG', min: 25.1, max: 40 },
    { label: 'XG', min: 40.1, max: null }
];

// Tipos de pelo
const COAT_TYPES = ['Curto', 'Medio', 'Longo'];

// Preços base por tamanho (multiplicador)
const SIZE_MULTIPLIER: { [key: string]: number } = {
    'PP': 0.8, 'P': 0.9, 'M': 1.0, 'G': 1.2, 'GG': 1.4, 'XG': 1.6
};

// Preços base por tipo de pelo
const COAT_MULTIPLIER: { [key: string]: number } = {
    'Curto': 1.0, 'Medio': 1.1, 'Longo': 1.25
};

async function generateStandardServices() {
    console.log('🔄 Iniciando padronização de serviços...');

    // Delete existing services (optional - be careful!)
    // await prisma.service.deleteMany({});

    const allServices: ServiceDef[] = [];

    // =============================
    // CÃES (Canino)
    // =============================

    // BANHOS - variam por porte E pelagem
    for (const size of SIZES) {
        for (const coat of COAT_TYPES) {
            const basePrice = 45 * SIZE_MULTIPLIER[size.label] * COAT_MULTIPLIER[coat];
            const duration = Math.round(45 * SIZE_MULTIPLIER[size.label] * (coat === 'Longo' ? 1.3 : 1));

            // Banho Tradicional
            allServices.push({
                name: `Banho ${size.label} ${coat}`,
                category: 'Banhos',
                species: 'Canino',
                sizeLabel: size.label,
                minWeight: size.min,
                maxWeight: size.max,
                coatType: coat.toUpperCase(),
                basePrice: Math.round(basePrice),
                duration
            });

            // Banho com Máscara
            allServices.push({
                name: `Banho Máscara ${size.label} ${coat}`,
                category: 'Banhos',
                species: 'Canino',
                sizeLabel: size.label,
                minWeight: size.min,
                maxWeight: size.max,
                coatType: coat.toUpperCase(),
                basePrice: Math.round(basePrice * 1.3),
                duration: duration + 15
            });

            // Banho Medicamentoso (Produto Cliente)
            allServices.push({
                name: `Banho Med. Cliente ${size.label} ${coat}`,
                category: 'Banhos',
                species: 'Canino',
                sizeLabel: size.label,
                minWeight: size.min,
                maxWeight: size.max,
                coatType: coat.toUpperCase(),
                basePrice: Math.round(basePrice * 1.1),
                duration: duration + 10
            });

            // Banho Medicamentoso (Nosso Produto)
            allServices.push({
                name: `Banho Med. 7Pet ${size.label} ${coat}`,
                category: 'Banhos',
                species: 'Canino',
                sizeLabel: size.label,
                minWeight: size.min,
                maxWeight: size.max,
                coatType: coat.toUpperCase(),
                basePrice: Math.round(basePrice * 1.4),
                duration: duration + 10
            });
        }
    }

    // TOSAS - variam apenas por porte (não por pelagem)
    for (const size of SIZES) {
        const basePrice = 35 * SIZE_MULTIPLIER[size.label];

        // Tosa Higiênica
        allServices.push({
            name: `Tosa Higiênica ${size.label}`,
            category: 'Tosas',
            species: 'Canino',
            sizeLabel: size.label,
            minWeight: size.min,
            maxWeight: size.max,
            basePrice: Math.round(basePrice),
            duration: 30
        });

        // Tosa Estética Geral
        allServices.push({
            name: `Tosa Estética ${size.label}`,
            category: 'Tosas',
            species: 'Canino',
            sizeLabel: size.label,
            minWeight: size.min,
            maxWeight: size.max,
            basePrice: Math.round(basePrice * 2),
            duration: 60
        });

        // Tosa da Raça
        allServices.push({
            name: `Tosa Raça ${size.label}`,
            category: 'Tosas',
            species: 'Canino',
            sizeLabel: size.label,
            minWeight: size.min,
            maxWeight: size.max,
            basePrice: Math.round(basePrice * 2.5),
            duration: 90
        });

        // Tosa Bebê
        allServices.push({
            name: `Tosa Bebê ${size.label}`,
            category: 'Tosas',
            species: 'Canino',
            sizeLabel: size.label,
            minWeight: size.min,
            maxWeight: size.max,
            basePrice: Math.round(basePrice * 1.8),
            duration: 45
        });
    }

    // SERVIÇOS EXTRAS - sem restrição de porte/pelagem
    const extras = [
        { name: 'Corte de Unha', price: 15, duration: 10 },
        { name: 'Limpeza de Ouvido', price: 15, duration: 10 },
        { name: 'Escovação de Dentes', price: 20, duration: 15 },
        { name: 'Hidratação', price: 25, duration: 20 },
        { name: 'Desembaraço (por região)', price: 30, duration: 30 },
        { name: 'Perfume Premium', price: 10, duration: 5 },
        { name: 'Laço/Bandana', price: 5, duration: 5 },
    ];

    for (const extra of extras) {
        allServices.push({
            name: extra.name,
            category: 'Extras',
            species: 'Canino',
            sizeLabel: '',
            minWeight: 0,
            maxWeight: null,
            basePrice: extra.price,
            duration: extra.duration
        });
    }

    // =============================
    // GATOS (Felino) - subset simplificado
    // =============================
    const CAT_SIZES = [
        { label: 'P', min: 0, max: 4 },
        { label: 'M', min: 4.1, max: 6 },
        { label: 'G', min: 6.1, max: null }
    ];

    for (const size of CAT_SIZES) {
        for (const coat of COAT_TYPES) {
            const basePrice = 55 * (size.label === 'G' ? 1.3 : size.label === 'M' ? 1.1 : 1) * COAT_MULTIPLIER[coat];

            allServices.push({
                name: `Banho Gato ${size.label} ${coat}`,
                category: 'Banhos',
                species: 'Felino',
                sizeLabel: size.label,
                minWeight: size.min,
                maxWeight: size.max,
                coatType: coat.toUpperCase(),
                basePrice: Math.round(basePrice),
                duration: 40
            });
        }

        // Tosas para gatos
        allServices.push({
            name: `Tosa Higiênica Gato ${size.label}`,
            category: 'Tosas',
            species: 'Felino',
            sizeLabel: size.label,
            minWeight: size.min,
            maxWeight: size.max,
            basePrice: 45,
            duration: 30
        });

        allServices.push({
            name: `Tosa Leão Gato ${size.label}`,
            category: 'Tosas',
            species: 'Felino',
            sizeLabel: size.label,
            minWeight: size.min,
            maxWeight: size.max,
            basePrice: 80,
            duration: 60
        });
    }

    // Extras para gatos
    for (const extra of extras) {
        allServices.push({
            name: `${extra.name} Gato`,
            category: 'Extras',
            species: 'Felino',
            sizeLabel: '',
            minWeight: 0,
            maxWeight: null,
            basePrice: extra.price,
            duration: extra.duration
        });
    }

    console.log(`📋 Total de serviços a criar: ${allServices.length}`);

    // Criar serviços no banco
    let created = 0;
    let skipped = 0;

    for (const svc of allServices) {
        const existing = await prisma.service.findFirst({ where: { name: svc.name, species: svc.species } });
        if (!existing) {
            await prisma.service.create({
                data: {
                    name: svc.name,
                    category: svc.category,
                    species: svc.species,
                    sizeLabel: svc.sizeLabel || null,
                    minWeight: svc.minWeight || null,
                    maxWeight: svc.maxWeight || null,
                    coatType: svc.coatType || null,
                    basePrice: svc.basePrice,
                    duration: svc.duration,
                    description: `${svc.name} para ${svc.species}`
                }
            });
            created++;
        } else {
            skipped++;
        }
    }

    console.log(`✅ Criados: ${created} | Já existentes: ${skipped}`);
    console.log('🎉 Padronização concluída!');
}

generateStandardServices()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
