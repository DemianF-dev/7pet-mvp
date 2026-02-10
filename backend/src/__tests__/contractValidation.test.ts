import { validateContractInput } from '../domain/recurrence/contractValidation';

describe('contractValidation', () => {
    it('rejects invalid billingDay', () => {
        const errors = validateContractInput({
            customerId: 'cust-1',
            title: 'Plano',
            billingDay: 0
        });

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('billingDay');
    });

    it('rejects invalid discount', () => {
        const errors = validateContractInput({
            customerId: 'cust-1',
            title: 'Plano',
            defaultDiscountPercent: 150
        });

        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('defaultDiscountPercent');
    });

    it('accepts valid input', () => {
        const errors = validateContractInput({
            customerId: 'cust-1',
            title: 'Plano',
            billingDay: 5,
            defaultDiscountPercent: 10
        });

        expect(errors.length).toBe(0);
    });
});
