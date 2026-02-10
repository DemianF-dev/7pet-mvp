import { createHash } from 'crypto';

export type QuoteType = 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE' | string;
export type TransportType = 'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF' | string | null | undefined;

export type OccurrenceInput = {
    spaAt?: string;
    levaAt?: string;
    trazAt?: string;
    levaDriverId?: string;
    trazDriverId?: string;
    itemIds?: string[];
};

export type OccurrenceValidationResult = {
    valid: boolean;
    errors: string[];
};

const normalizeDate = (value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

export const validateOccurrencesForQuote = (input: {
    quoteType: QuoteType;
    transportType?: TransportType;
    occurrences: OccurrenceInput[];
}): OccurrenceValidationResult => {
    const { quoteType, transportType, occurrences } = input;
    const errors: string[] = [];
    const seen = new Set<string>();

    const requiresSpa = quoteType === 'SPA' || quoteType === 'SPA_TRANSPORTE';
    const requiresTransport = quoteType === 'TRANSPORTE' || quoteType === 'SPA_TRANSPORTE';

    const isRoundTrip = transportType === 'ROUND_TRIP' || (!transportType && quoteType === 'SPA_TRANSPORTE');
    const isPickup = transportType === 'PICK_UP';
    const isDropoff = transportType === 'DROP_OFF';

    occurrences.forEach((occ, index) => {
        const row = index + 1;
        const key = buildOccurrenceKey(occ);
        if (seen.has(key)) {
            errors.push(`Linha ${row}: Ocorrencia duplicada.`);
        } else {
            seen.add(key);
        }

        if (requiresSpa) {
            if (!occ.spaAt) {
                errors.push(`Linha ${row}: Data do SPA é obrigatória.`);
            } else if (!normalizeDate(occ.spaAt)) {
                errors.push(`Linha ${row}: Data do SPA inválida.`);
            }
        }

        if (requiresTransport) {
            if (isRoundTrip || isPickup) {
                if (!occ.levaAt) errors.push(`Linha ${row}: Horário de Busca (Leva) é obrigatório.`);
                else if (!normalizeDate(occ.levaAt)) errors.push(`Linha ${row}: Horário de Busca (Leva) inválido.`);
                if (!occ.levaDriverId) errors.push(`Linha ${row}: Motorista da Busca é obrigatório.`);
            }

            if (isRoundTrip || isDropoff) {
                if (!occ.trazAt) errors.push(`Linha ${row}: Horário de Entrega (Traz) é obrigatório.`);
                else if (!normalizeDate(occ.trazAt)) errors.push(`Linha ${row}: Horário de Entrega (Traz) inválido.`);
                if (!occ.trazDriverId) errors.push(`Linha ${row}: Motorista da Entrega é obrigatório.`);
            }
        }
    });

    return { valid: errors.length === 0, errors };
};

const normalizeOccurrence = (occ: OccurrenceInput) => ({
    spaAt: normalizeDate(occ.spaAt),
    levaAt: normalizeDate(occ.levaAt),
    trazAt: normalizeDate(occ.trazAt),
    levaDriverId: occ.levaDriverId || null,
    trazDriverId: occ.trazDriverId || null,
    itemIds: occ.itemIds ? [...occ.itemIds].sort() : []
});

const buildOccurrenceKey = (occ: OccurrenceInput) => {
    const normalized = normalizeOccurrence(occ);
    return [
        normalized.spaAt || '',
        normalized.levaAt || '',
        normalized.trazAt || '',
        normalized.levaDriverId || '',
        normalized.trazDriverId || '',
        (normalized.itemIds || []).join(',')
    ].join('|');
};

export const buildScheduleHash = (input: {
    quoteId: string;
    quoteType: QuoteType;
    transportType?: TransportType;
    performerId?: string;
    occurrences: OccurrenceInput[];
}) => {
    const normalized = input.occurrences.map(normalizeOccurrence).sort((a, b) => {
        const aKey = a.spaAt || a.levaAt || a.trazAt || '';
        const bKey = b.spaAt || b.levaAt || b.trazAt || '';
        return aKey.localeCompare(bKey);
    });

    const payload = {
        quoteId: input.quoteId,
        quoteType: input.quoteType,
        transportType: input.transportType || null,
        performerId: input.performerId || null,
        occurrences: normalized
    };

    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};

export const buildAppointmentKey = (input: {
    startAt: Date;
    category: string;
    transportType?: string | null;
    performerId?: string | null;
}) => {
    return `${input.startAt.toISOString()}|${input.category}|${input.transportType || ''}|${input.performerId || ''}`;
};

export const areAllRequestedKeysPresent = (existingKeys: Set<string>, requestedKeys: Set<string>) => {
    for (const key of requestedKeys) {
        if (!existingKeys.has(key)) return false;
    }
    return true;
};

export const mergeMetadata = (current: unknown, updates: Record<string, unknown>) => {
    const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {};
    return { ...base, ...updates };
};

