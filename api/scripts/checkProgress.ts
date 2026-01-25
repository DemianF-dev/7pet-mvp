import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.service.count();
    console.log(`Total de serviços cadastrados: ${count}`);
}
main().finally(() => prisma.$disconnect());
