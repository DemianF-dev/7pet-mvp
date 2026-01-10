
import prisma from '../lib/prisma';

async function forceDelete() {
    console.log('🔥 Force deleting oidemian@gmail.com...');

    // Find the user first
    const user = await prisma.user.findUnique({
        where: { email: 'oidemian@gmail.com' }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log(`Found user ${user.id} (${user.email}). Deleting...`);

    // Try Hard Delete first
    try {
        await prisma.user.delete({
            where: { id: user.id }
        });
        console.log('✅ Hard delete successful!');
    } catch (e: any) {
        console.error('❌ Hard delete failed (Constraint?):', e.code, e.meta);

        console.log('Trying Soft Delete + Rename to free up email...');
        await prisma.user.update({
            where: { id: user.id },
            data: {
                deletedAt: new Date(),
                active: false,
                email: `deleted_${Date.now()}_${user.email}` // Rename to avoid unique constraint if we create another
            }
        });
        console.log('✅ Soft delete + rename successful!');
    }
}

forceDelete()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
