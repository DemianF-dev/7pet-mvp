import prisma from '../lib/prisma';
import crypto from 'crypto';

export const createGoal = async (data: {
    title: string;
    description?: string;
    targetValue: number;
    initialValue?: number;
    unit?: string;
    startDate: Date | string;
    endDate: Date | string;
    category?: string;
    department?: string;
    staffIds?: string[];
    createdBy: string;
}) => {
    const { staffIds, startDate, endDate, ...goalData } = data;

    return prisma.goal.create({
        data: {
            id: crypto.randomUUID(),
            ...goalData,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            goalAssignments: staffIds ? {
                create: staffIds.map(staffId => ({
                    id: crypto.randomUUID(),
                    staffId
                }))
            } : undefined
        },
        include: {
            goalAssignments: {
                include: {
                    staff: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    });
};

export const updateGoal = async (id: string, data: any) => {
    const { staffIds, startDate, endDate, ...goalData } = data;

    // Handle staff assignments if provided
    if (staffIds) {
        // Delete old assignments
        await prisma.goalAssignment.deleteMany({ where: { goalId: id } });
        // Create new ones
        await prisma.goalAssignment.createMany({
            data: staffIds.map((staffId: string) => ({
                id: crypto.randomUUID(), // Ensure IDs are generated here too just in case
                goalId: id,
                staffId
            }))
        });
    }

    return prisma.goal.update({
        where: { id },
        data: {
            ...goalData,
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
        },
        include: {
            goalAssignments: {
                include: {
                    staff: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        }
    });
};

export const deleteGoal = async (id: string) => {
    return prisma.goal.delete({ where: { id } });
};

export const getAllGoals = async () => {
    return prisma.goal.findMany({
        include: {
            goalAssignments: {
                include: {
                    staff: {
                        include: {
                            user: {
                                select: { name: true }
                            }
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getGoalsForStaff = async (staffId: string, department?: string) => {
    const now = new Date();

    return prisma.goal.findMany({
        where: {
            status: 'ACTIVE',
            startDate: { lte: now },
            endDate: { gte: now },
            OR: [
                { goalAssignments: { some: { staffId } } },
                { department: department || undefined }
            ]
        },
        orderBy: { endDate: 'asc' }
    });
};

export const updateProgress = async (id: string, value: number) => {
    return prisma.goal.update({
        where: { id },
        data: { currentValue: value }
    });
};
