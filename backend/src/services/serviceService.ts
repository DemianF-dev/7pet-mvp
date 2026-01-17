import prisma from '../lib/prisma';

// Soft Delete
export const remove = async (id: string) => {
    return prisma.service.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
};

// Soft Delete em Massa
export const bulkDelete = async (ids: string[]) => {
    return prisma.service.updateMany({
        where: {
            id: { in: ids },
            deletedAt: null
        },
        data: { deletedAt: new Date() }
    });
};

// Restaurar Individual
export const restore = async (id: string) => {
    return prisma.service.update({
        where: { id },
        data: { deletedAt: null }
    });
};

// Restaurar em Massa
export const bulkRestore = async (ids: string[]) => {
    return prisma.service.updateMany({
        where: {
            id: { in: ids },
            deletedAt: { not: null }
        },
        data: { deletedAt: null }
    });
};

// Listar Lixeira
export const listTrash = async () => {
    const retentionDate = new Date();
    // Retention period increased to 365 days for manual cleanup
    retentionDate.setDate(retentionDate.getDate() - 365);

    return prisma.service.findMany({
        where: {
            deletedAt: {
                not: null,
                gte: retentionDate
            }
        },
        include: {
            responsible: {
                select: {
                    id: true,
                    name: true,
                    color: true
                }
            }
        },
        orderBy: { deletedAt: 'desc' }
    });
};

// Hard Delete
export const permanentRemove = async (id: string) => {
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service?.deletedAt) {
        throw new Error('Serviço deve estar na lixeira antes de exclusão permanente');
    }

    // REMOVED: 7 day retention rule as per user request for manual cleanup
    /*
    const minDays = 7;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - minDays);

    if (service.deletedAt > minDate) {
        const daysRemaining = Math.ceil((service.deletedAt.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        throw new Error(`Serviço deve estar na lixeira por pelo menos ${minDays} dias. Faltam ${daysRemaining} dias.`);
    }
    */

    return prisma.service.delete({ where: { id } });
};
