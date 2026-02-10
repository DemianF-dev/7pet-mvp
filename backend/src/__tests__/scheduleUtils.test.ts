import { areAllRequestedKeysPresent, buildAppointmentKey, buildScheduleHash, validateOccurrencesForQuote } from '../domain/scheduling/scheduleUtils';

describe('scheduleUtils', () => {
    it('requires driver for transport occurrences', () => {
        const result = validateOccurrencesForQuote({
            quoteType: 'TRANSPORTE',
            transportType: 'PICK_UP',
            occurrences: [{
                levaAt: new Date().toISOString()
            }]
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toContain('Motorista');
    });

    it('rejects duplicate occurrences', () => {
        const date = new Date('2026-02-03T10:00:00.000Z').toISOString();
        const result = validateOccurrencesForQuote({
            quoteType: 'SPA',
            occurrences: [
                { spaAt: date, itemIds: ['a'] },
                { spaAt: date, itemIds: ['a'] }
            ]
        });

        expect(result.valid).toBe(false);
        expect(result.errors.join(' ')).toContain('duplicada');
    });

    it('buildScheduleHash is stable across occurrence order', () => {
        const occA = {
            spaAt: new Date('2026-02-01T10:00:00.000Z').toISOString(),
            itemIds: ['b', 'a']
        };
        const occB = {
            spaAt: new Date('2026-02-02T10:00:00.000Z').toISOString()
        };

        const hash1 = buildScheduleHash({
            quoteId: 'quote-1',
            quoteType: 'SPA',
            transportType: null,
            performerId: 'perf-1',
            occurrences: [occA, occB]
        });

        const hash2 = buildScheduleHash({
            quoteId: 'quote-1',
            quoteType: 'SPA',
            transportType: null,
            performerId: 'perf-1',
            occurrences: [occB, occA]
        });

        expect(hash1).toEqual(hash2);
    });

    it('areAllRequestedKeysPresent validates idempotent sets', () => {
        const key1 = buildAppointmentKey({
            startAt: new Date('2026-02-01T10:00:00.000Z'),
            category: 'SPA',
            transportType: null,
            performerId: null
        });
        const key2 = buildAppointmentKey({
            startAt: new Date('2026-02-02T10:00:00.000Z'),
            category: 'LOGISTICA',
            transportType: 'LEVA',
            performerId: 'driver-1'
        });

        const existing = new Set([key1, key2]);
        const requested = new Set([key1]);

        expect(areAllRequestedKeysPresent(existing, requested)).toBe(true);
        expect(areAllRequestedKeysPresent(existing, new Set([key1, 'missing']))).toBe(false);
    });
});
