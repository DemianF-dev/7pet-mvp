
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const count = await prisma.payAdjustment.count();
        console.log(`PayAdjustment count: ${count}`);
    } catch (e) {
        console.log("Error counting PayAdjustment:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
