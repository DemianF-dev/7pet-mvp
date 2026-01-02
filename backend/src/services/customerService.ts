import prisma from '../lib/prisma';

//Soft Delete
export const remove = async (id: string) => {
    return prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() }
    });
};

// Soft Delete em Massa
export const bulkDelete = async (ids: string[]) => {
    return prisma.customer.updateMany({
        where: {
            id: { in: ids },
            deletedAt: null // Apenas ativos
        },
        data: { deletedAt: new Date() }
    });
};

// Restaurar Individual
export const restore = async (id: string) => {
    return prisma.customer.update({
        where: { id },
        data: { deletedAt: null }
    });
};

// Restaurar em Massa
export const bulkRestore = async (ids: string[]) => {
    return prisma.customer.updateMany({
        where: {
            id: { in: ids },
            deletedAt: { not: null } // Apenas deletados
        },
        data: { deletedAt: null }
    });
};

// Listar Lixeira
export const listTrash = async () => {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - 15);

    return prisma.customer.findMany({
        where: {
            deletedAt: {
                not: null,
                gte: retentionDate // Últimos 15 dias
            }
        },
        include: {
            user: {
                select: {
                    email: true,
                    role: true,
                    seqId: true,
                    firstName: true,
                    lastName: true,
                    phone: true
                }
            },
            pets: true,
            _count: {
                select: { appointments: true, quotes: true }
            }
        },
        orderBy: { deletedAt: 'desc' }
    });
};

// Hard Delete (APENAS após verificação)
export const permanentRemove = async (id: string) => {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer?.deletedAt) {
        throw new Error('Cliente deve estar na lixeira antes de exclusão permanente');
    }

    // Proteção de tempo mínimo (7 dias)
    const minDays = 7;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - minDays);

    if (customer.deletedAt > minDate) {
        const daysRemaining = Math.ceil((customer.deletedAt.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        throw new Error(`Cliente deve estar na lixeira por pelo menos ${minDays} dias. Faltam ${daysRemaining} dias.`);
    }

    // Delete pets first
    await prisma.pet.deleteMany({ where: { customerId: id } });
    return prisma.customer.delete({ where: { id } });
};
