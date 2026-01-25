import prisma from './src/lib/prisma';

async function testActiveUsers() {
    try {
        console.log('🔍 Testing database connection and active users...');
        
        // Test connection
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        
        // Count all users
        const totalUsers = await prisma.user.count();
        console.log(`📊 Total users in database: ${totalUsers}`);
        
        // Count active users
        const activeUsers = await prisma.user.count({
            where: { active: true }
        });
        console.log(`📊 Active users in database: ${activeUsers}`);
        
        // Get sample of active users
        const sampleUsers = await prisma.user.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true,
                color: true,
                active: true
            },
            take: 5,
            orderBy: { name: 'asc' }
        });
        
        console.log('👥 Sample active users:');
        sampleUsers.forEach(user => {
            console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.division}`);
        });
        
        // Test the exact query used in searchUsers function
        console.log('\n🔍 Testing the exact searchUsers query...');
        const searchQuery = await prisma.user.findMany({
            where: {
                active: true,
                id: { not: 'test-user-id' }
            },
            take: 40,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                division: true,
                color: true
            }
        });
        
        console.log(`📊 Search query returned ${searchQuery.length} users`);
        
        if (searchQuery.length > 0) {
            console.log('👥 First few results:');
            searchQuery.slice(0, 3).forEach(user => {
                console.log(`  - ${user.name} (${user.email})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing active users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testActiveUsers();
