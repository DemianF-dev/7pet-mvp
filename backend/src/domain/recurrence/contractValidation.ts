import { RecurrenceType, PackageFrequency } from '@prisma/client';

export type ContractInput = {
    customerId?: string;
    type?: RecurrenceType;
    title?: string;
    frequency?: PackageFrequency;
    billingDay?: number;
    defaultDiscountPercent?: number;
    notes?: string;
};

export const validateContractInput = (
    input: ContractInput,
    options?: { require?: Array<keyof ContractInput> }
) => {
    const errors: string[] = [];
    const required = options?.require || [];

    if (required.includes('customerId') && !input.customerId) {
        errors.push('customerId é obrigatório.');
    } else if (input.customerId !== undefined && input.customerId.trim() === '') {
        errors.push('customerId é obrigatório.');
    }

    if (required.includes('title') && !input.title) {
        errors.push('title é obrigatório.');
    } else if (input.title !== undefined && input.title.trim() === '') {
        errors.push('title é obrigatório.');
    }

    if (input.billingDay !== undefined) {
        if (!Number.isInteger(input.billingDay) || input.billingDay < 1 || input.billingDay > 31) {
            errors.push('billingDay deve estar entre 1 e 31.');
        }
    }

    if (input.defaultDiscountPercent !== undefined) {
        if (input.defaultDiscountPercent < 0 || input.defaultDiscountPercent > 100) {
            errors.push('defaultDiscountPercent deve estar entre 0 e 100.');
        }
    }

    if (required.includes('type') && !input.type) {
        errors.push('type é obrigatório.');
    } else if (input.type !== undefined && !input.type) {
        errors.push('type é obrigatório.');
    }

    if (required.includes('frequency') && !input.frequency) {
        errors.push('frequency é obrigatório.');
    } else if (input.frequency !== undefined && !input.frequency) {
        errors.push('frequency é obrigatório.');
    }

    return errors;
};
