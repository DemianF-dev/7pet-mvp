import { PrismaClient } from './src/generated/client';
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['marcio@gmail.com', 'claudio@gmail.com']
      }
    }
  });
  
  console.log('=== USERS FOUND ===');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Division: ${user.division}`);
    console.log(`   Active: ${user.active}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log('---');
  });
  
  await prisma.$disconnect();
}

checkUsers().catch(console.error);