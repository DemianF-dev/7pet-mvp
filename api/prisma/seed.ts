import prisma from '../src/lib/prisma';

async function main() {
    console.log('🌱 Seeding database...');

    // Clear existing services
    await prisma.service.deleteMany();

    const services = [
        { name: 'Banho', basePrice: 50.00, duration: 45, description: 'Banho básico com shampoo neutro', category: 'Banho' },
        { name: 'Tosa Higiênica', basePrice: 40.00, duration: 30, description: 'Tosa das patas, barriga e áreas íntimas', category: 'Tosa' },
        { name: 'Tosa Completa', basePrice: 80.00, duration: 90, description: 'Banho e tosa completa na tesoura ou máquina', category: 'Tosa' },
        { name: 'Transporte (Ida)', basePrice: 20.00, duration: 30, description: 'Busca do pet em casa', category: 'Transporte' },
        { name: 'Transporte (Ida e Volta)', basePrice: 35.00, duration: 60, description: 'Busca e entrega do pet', category: 'Transporte' },
    ];

    for (const service of services) {
        await prisma.service.create({
            data: service,
        });
    }

    console.log('✅ Seed successful!');
}

main()
    .catch((e) => {
        console.error(e);
        // @ts-ignore
        if (typeof process !== 'undefined') process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
