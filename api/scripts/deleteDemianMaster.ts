
import prisma from '../lib/prisma';

async function deleteDemianMaster() {
    console.log('🗑️ Deleting Demian@Master...');

    const user = await prisma.user.findFirst({
        where: { email: { equals: 'Demian@Master', mode: 'insensitive' } } // Case insensitive just in case
    });

    if (!user) {
        console.log('User Demian@Master not found.');
        return;
    }

    console.log(`Found user ${user.id} (${user.email}). Deleting...`);

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                deletedAt: new Date(),
                active: false,
                email: `deleted_${Date.now()}_${user.email}`,
                googleId: user.googleId ? `deleted_${Date.now()}_${user.googleId}` : null
            }
        });
        console.log('✅ User deleted successfully (Soft Delete + Rename).');
    } catch (e) {
        console.error('❌ Error deleting user:', e);
    }
}

deleteDemianMaster()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
