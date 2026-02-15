import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const quote = await prisma.quote.findFirst();
  console.log(quote?.id);
  process.exit();
}
main();
