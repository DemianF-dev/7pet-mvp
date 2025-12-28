import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const dogWeights: any = {
    'PP': { min: 0, max: 2.99 },
    'P': { min: 3, max: 7.99 },
    'M': { min: 8, max: 17.99 },
    'G': { min: 18, max: 34.99 },
    'GG': { min: 35, max: 49.99 },
    'XG': { min: 50, max: 150 }
};

const catWeights: any = {
    'P': { min: 0, max: 3.99 },
    'M': { min: 4, max: 7.99 },
    'G': { min: 8, max: 11.99 },
    'GG': { min: 12, max: 50 },
    'PP': { min: 0, max: 2 }, // Standard PP for cats if used
};

async function main() {
    const services = await prisma.service.findMany();
    console.log(`Processing ${services.length} services...`);

    let updatedCount = 0;

    for (const s of services) {
        let minWeight: number | null = null;
        let maxWeight: number | null = null;
        let sizeLabel: string | null = null;

        const name = s.name;
        const species = s.species; // "Canino" or "Felino"

        const weights = species === 'Felino' ? catWeights : dogWeights;

        // Try to find size label in parentheses
        const match = name.match(/\(([^)]+)\)$/);
        if (match) {
            const content = match[1]; // e.g. "PP", "P (0 a 3,99 kg)", "Porte PP - Peso: 0 a 2,99 kg"

            for (const label of Object.keys(weights)) {
                // Exact match or starts with label
                if (content === label || content.startsWith(label + ' ') || content.includes(' ' + label + ' ') || content.includes('Porte ' + label)) {
                    sizeLabel = label;
                    minWeight = weights[label].min;
                    maxWeight = weights[label].max;
                    break;
                }
            }
        }

        if (sizeLabel) {
            await prisma.service.update({
                where: { id: s.id },
                data: { minWeight, maxWeight, sizeLabel }
            });
            updatedCount++;
        }
    }

    console.log(`Successfully updated ${updatedCount} services with weight/size data.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
