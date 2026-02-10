import { calculateRecurrenceCount } from '../domain/recurrence/recurrenceUtils';

describe('recurrenceUtils', () => {
    it('returns 1 for non-recurring quotes', () => {
        expect(calculateRecurrenceCount(false)).toBe(1);
    });

    it('returns 4 for recurring quotes', () => {
        expect(calculateRecurrenceCount(true)).toBe(4);
    });
});
