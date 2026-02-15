import prisma from '../lib/prisma';
import logger from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { RecurrenceType, ContractStatus, PackageFrequency } from '@prisma/client';
import { validateContractInput } from '../domain/recurrence/contractValidation';

export interface CreateContractInput {
    customerId: string;
    type: RecurrenceType;
    title: string;
    frequency: PackageFrequency;
    billingDay?: number;
    defaultDiscountPercent?: number;
    notes?: string;
    createdBy: string;
}

export const createContract = async (input: CreateContractInput) => {
    const { createdBy, ...data } = input;

    const createErrors = validateContractInput(data, { require: ['customerId', 'type', 'title', 'frequency'] });
    if (createErrors.length > 0) {
        throw new Error(createErrors[0]);
    }

    return await prisma.$transaction(async (tx) => {
        const contract = await tx.recurrenceContract.create({
            data: {
                ...data,
                status: 'ATIVO'
            },
            include: {
                customer: true
            }
        });

        await createAuditLog({
            entityType: 'RECURRENCE_CONTRACT' as any,
            entityId: contract.id,
            action: 'CREATE' as any,
            performedBy: createdBy,
            reason: `Contrato de recorrência "${contract.title}" criado para cliente ${contract.customer.name}`
        }, tx);

        return contract;
    });
};

export const getContractById = async (id: string) => {
    return prisma.recurrenceContract.findUnique({
        where: { id },
        include: {
            customer: true
        }
    });
};

export const getContractDetails = async (id: string) => {
    const contract = await prisma.recurrenceContract.findUnique({
        where: { id },
        include: {
            customer: true,
            invoices: {
                orderBy: { createdAt: 'desc' },
                take: 12, // Last 12 invoices
                include: {
                    lines: true
                }
            }
        }
    });

    if (!contract) return null;

    // Fetch appointments linked to invoices of this contract
    // This is an indirect link since appointments are linked to invoices, and invoices to contracts
    const invoiceIds = contract.invoices.map(i => i.id);

    // Find appointments linked to these invoices
    const linkedAppointments = await prisma.appointment.findMany({
        where: {
            appointmentInvoiceLink: {
                invoiceId: { in: invoiceIds }
            }
        },
        orderBy: { startAt: 'desc' },
        take: 20,
        include: {
            services: true,
            pet: true
        }
    });

    return {
        ...contract,
        recentAppointments: linkedAppointments
    };
};

export const listContracts = async (filters: {
    type?: RecurrenceType,
    status?: ContractStatus,
    customerId?: string
}) => {
    return prisma.recurrenceContract.findMany({
        where: filters,
        include: {
            customer: true
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateContract = async (id: string, data: Partial<CreateContractInput>, updatedBy: string) => {
    const { createdBy, ...updateData } = data; // ignore createdBy if it's there

    const updateErrors = validateContractInput(updateData);
    if (updateErrors.length > 0) {
        throw new Error(updateErrors[0]);
    }

    return await prisma.$transaction(async (tx) => {
        const contract = await tx.recurrenceContract.update({
            where: { id },
            data: updateData,
            include: { customer: true }
        });

        await createAuditLog({
            entityType: 'RECURRENCE_CONTRACT' as any,
            entityId: id,
            action: 'UPDATE' as any,
            performedBy: updatedBy,
            reason: `Contrato de recorrência "${contract.title}" atualizado`
        }, tx);

        return contract;
    });
};

export const updateContractStatus = async (id: string, status: ContractStatus, reason: string, updatedBy: string) => {
    return await prisma.$transaction(async (tx) => {
        const contract = await tx.recurrenceContract.update({
            where: { id },
            data: { status },
            include: { customer: true }
        });

        await createAuditLog({
            entityType: 'RECURRENCE_CONTRACT' as any,
            entityId: id,
            action: 'STATUS_CHANGE' as any,
            performedBy: updatedBy,
            reason: `Status do contrato alterado para ${status}. Motivo: ${reason}`
        }, tx);

        return contract;
    });
};

export default {
    createContract,
    getContractById,
    getContractDetails,
    listContracts,
    updateContract,
    updateContractStatus
};


