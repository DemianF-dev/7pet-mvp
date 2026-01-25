import { PrismaClient } from './src/lib/prisma';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.user.findFirst();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  } finally {
    await prisma.\$disconnect();
  }
}

testConnection();