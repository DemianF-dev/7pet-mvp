import prisma from '../lib/prisma';

export const create = async (data: any) => {
    return prisma.pet.create({ data });
};

export const list = async (customerId?: string) => {
    return prisma.pet.findMany({
        where: customerId ? { customerId } : {},
        include: { customer: true }
    });
};

export const get = async (id: string) => {
    return prisma.pet.findUnique({
        where: { id },
        include: { customer: true }
    });
};

export const update = async (id: string, data: any) => {
    return prisma.pet.update({
        where: { id },
        data
    });
};

export const remove = async (id: string) => {
    return prisma.pet.delete({ where: { id } });
};
