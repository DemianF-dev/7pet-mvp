export interface ScheduleOccurrence {
    spaAt?: string | Date | null;
    levaAt?: string | Date | null;
    trazAt?: string | Date | null;
    levaDriverId?: string | null;
    trazDriverId?: string | null;
}

export interface ScheduleQuoteData {
    occurrences: ScheduleOccurrence[];
}
