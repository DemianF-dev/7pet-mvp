import prisma from './src/lib/prisma';

async function checkSettings() {
    try {
        const settings = await prisma.transportSettings.findFirst();
        console.log('Transport Settings:', settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSettings();
