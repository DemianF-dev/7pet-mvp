import prisma from './src/lib/prisma';

async function testConnection() {
    try {
        await prisma.$connect();
        console.log('✅ DB Connected');
        
        // Try to find user count
        const userCount = await prisma.user.count();
        console.log('👥 Total users:', userCount);
        
        // Find admin user
        const admin = await prisma.user.findUnique({
            where: { email: 'oidemianf@gmail.com' },
            select: {
                id: true,
                email: true,
                name: true,
                active: true,
                role: true,
                division: true
            }
        });
        
        if (admin) {
            console.log('✅ Admin found:', admin);
            console.log('🔥 Active status:', admin.active);
        } else {
            console.log('❌ Admin not found');
        }
        
    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
