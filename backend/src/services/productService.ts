import prisma from '../lib/prisma';

// Soft Delete
export const remove = async (id: string) => {
    return prisma.product.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
};

// Soft Delete em Massa
export const bulkDelete = async (ids: string[]) => {
    return prisma.product.updateMany({
        where: {
            id: { in: ids },
            deletedAt: null
        },
        data: { deletedAt: new Date() }
    });
};

// Restaurar Individual
export const restore = async (id: string) => {
    return prisma.product.update({
        where: { id },
        data: { deletedAt: null }
    });
};

// Restaurar em Massa
export const bulkRestore = async (ids: string[]) => {
    return prisma.product.updateMany({
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
    retentionDate.setDate(retentionDate.getDate() - 15);

    return prisma.product.findMany({
        where: {
            deletedAt: {
                not: null,
                gte: retentionDate
            }
        },
        orderBy: { deletedAt: 'desc' }
    });
};

// Hard Delete
export const permanentRemove = async (id: string) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product?.deletedAt) {
        throw new Error('Produto deve estar na lixeira antes de exclusão permanente');
    }

    const minDays = 7;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - minDays);

    if (product.deletedAt > minDate) {
        const daysRemaining = Math.ceil((product.deletedAt.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        throw new Error(`Produto deve estar na lixeira por pelo menos ${minDays} dias. Faltam ${daysRemaining} dias.`);
    }

    return prisma.product.delete({ where: { id } });
};
