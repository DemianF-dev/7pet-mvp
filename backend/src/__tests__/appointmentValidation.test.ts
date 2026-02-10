import { validateAppointmentCreateInput } from '../domain/appointments/appointmentValidation';

describe('appointmentValidation', () => {
    it('flags past date for non-staff', () => {
        const now = new Date('2026-02-10T10:00:00.000Z');
        const issues = validateAppointmentCreateInput({
            customerId: 'cust-1',
            petId: 'pet-1',
            startAt: new Date('2026-02-10T09:00:00.000Z')
        }, false, now);

        expect(issues.some(issue => issue.level === 'error')).toBe(true);
    });

    it('returns warning for staff past date without override', () => {
        const now = new Date('2026-02-10T10:00:00.000Z');
        const issues = validateAppointmentCreateInput({
            customerId: 'cust-1',
            petId: 'pet-1',
            startAt: new Date('2026-02-10T09:00:00.000Z')
        }, true, now);

        const warning = issues.find(issue => issue.code === 'PAST_DATE_WARNING');
        expect(warning).toBeDefined();
        expect(warning?.level).toBe('warning');
    });

    it('enforces minimum lead time for non-staff', () => {
        const now = new Date('2026-02-10T10:00:00.000Z');
        const issues = validateAppointmentCreateInput({
            customerId: 'cust-1',
            petId: 'pet-1',
            startAt: new Date('2026-02-10T15:00:00.000Z')
        }, false, now);

        expect(issues.some(issue => issue.message.includes('12h'))).toBe(true);
    });

    it('requires logistics providers for staff', () => {
        const now = new Date('2026-02-10T10:00:00.000Z');
        const issues = validateAppointmentCreateInput({
            customerId: 'cust-1',
            petId: 'pet-1',
            startAt: new Date('2026-02-11T10:00:00.000Z'),
            category: 'LOGISTICA'
        }, true, now);

        const errorCount = issues.filter(issue => issue.level === 'error').length;
        expect(errorCount).toBe(2);
    });
});
