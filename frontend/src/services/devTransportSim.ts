import api from './api';

export interface TransportSimScenario {
    plan: 'TL1' | 'TL2';
    mode: 'LEVA' | 'TRAZ' | 'LEVA_TRAZ';
    destinationIsThePet: boolean;
    address1: string;
    address2?: string | null;
    stopAddress?: string | null;
    discountPercent: number;
    kmRate: number;
    minRate: number;
}

export interface TransportLegData {
    kind: string;
    originAddress: string;
    destinationAddress: string;
    distanceKm: number;
    durationMin: number;
    chargeKm: number;
    chargeMin: number;
    kmRate: number;
    minRate: number;
    subtotal: number;
}

export interface TransportSimResult {
    ok: boolean;
    checksum: string;
    engineVersion: string;
    timestamp: string;
    scenario: TransportSimScenario;
    legs: TransportLegData[];
    totals: {
        totalBeforeDiscount: number;
        totalAfterDiscount: number;
        totalLevaBeforeDiscount?: number;
        totalLevaAfterDiscount?: number;
        totalTrazBeforeDiscount?: number;
        totalTrazAfterDiscount?: number;
        discountPercent: number;
    };
}

export interface SimulateTransportRequest {
    plan: 'TL1' | 'TL2';
    mode: 'LEVA' | 'TRAZ' | 'LEVA_TRAZ';
    destinationIsThePet: boolean;
    address1: string;
    address2?: string;
    stopAddress?: string;
    discountPercent?: number;
    kmRateOverride?: number;
    minRateOverride?: number;
}

/**
 * Simulate transport calculation (MASTER-only)
 */
export async function simulateTransport(params: SimulateTransportRequest): Promise<TransportSimResult> {
    const response = await api.post('/dev/transport/simulate', params);
    return response.data;
}

/**
 * Format number as Brazilian Real currency
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Format KM with 1 decimal place
 */
export function formatKm(value: number): string {
    return `${value.toFixed(1)} km`;
}

/**
 * Format minutes
 */
export function formatMin(value: number): string {
    return `${Math.ceil(value)} min`;
}

/**
 * Generate calculation memory text (operator format)
 */
export function generateCalculationMemory(result: TransportSimResult): string {
    const { legs, totals, scenario } = result;
    const lines: string[] = [];

    lines.push('='.repeat(50));
    lines.push('MEMÓRIA DE CÁLCULO - TRANSPORTE');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`Plano: ${scenario.plan}`);
    lines.push(`Modo: ${scenario.mode === 'LEVA' ? 'Só Leva' : scenario.mode === 'TRAZ' ? 'Só Traz' : 'Leva & Traz'}`);
    lines.push(`Destino: ${scenario.destinationIsThePet ? 'The Pet' : 'Outro local'}`);
    lines.push('');

    // Group legs by kind
    const legsByKind = legs.reduce((acc, leg) => {
        if (!acc[leg.kind]) acc[leg.kind] = [];
        acc[leg.kind].push(leg);
        return acc;
    }, {} as Record<string, TransportLegData[]>);

    // Display in order: PARTIDA, LEVA, LEVA2, TRAZ, TRAZ2, RETORNO
    const order = ['PARTIDA', 'LEVA', 'LEVA2', 'TRAZ', 'TRAZ2', 'RETORNO'];

    for (const kind of order) {
        const kindLegs = legsByKind[kind];
        if (!kindLegs) continue;

        for (const leg of kindLegs) {
            const label = getLegLabel(kind);
            if (leg.chargeMin > 0) {
                lines.push(`${label}: KMs ${formatKm(leg.chargeKm)} + MINs ${formatMin(leg.chargeMin)}`);
            } else {
                lines.push(`${label}: KMs ${formatKm(leg.chargeKm)}`);
            }
        }
    }

    lines.push('');
    lines.push('-'.repeat(50));
    lines.push(`Total: ${formatCurrency(totals.totalBeforeDiscount)}`);

    if (totals.discountPercent > 0) {
        lines.push(`Desconto: ${totals.discountPercent}%`);
        lines.push('');

        if (scenario.mode === 'LEVA_TRAZ') {
            if (totals.totalLevaAfterDiscount !== undefined) {
                lines.push(`Leva (com desconto): ${formatCurrency(totals.totalLevaAfterDiscount)}`);
            }
            if (totals.totalTrazAfterDiscount !== undefined) {
                lines.push(`Traz (com desconto): ${formatCurrency(totals.totalTrazAfterDiscount)}`);
            }
            lines.push(`Total Leva & Traz com Desconto: ${formatCurrency(totals.totalAfterDiscount)}`);
        } else {
            lines.push(`Total com Desconto: ${formatCurrency(totals.totalAfterDiscount)}`);
        }
    } else {
        lines.push('');
        lines.push(`Total: ${formatCurrency(totals.totalAfterDiscount)}`);
    }

    lines.push('-'.repeat(50));
    lines.push('');
    lines.push(`Checksum: ${result.checksum}`);
    lines.push(`Engine: ${result.engineVersion}`);
    lines.push(`Timestamp: ${new Date(result.timestamp).toLocaleString('pt-BR')}`);
    lines.push('='.repeat(50));

    return lines.join('\n');
}

function getLegLabel(kind: string): string {
    const labels: Record<string, string> = {
        'PARTIDA': 'Partida',
        'LEVA': 'Leva',
        'LEVA2': 'Leva 2',
        'TRAZ': 'Traz',
        'TRAZ2': 'Traz 2',
        'RETORNO': 'Retorno'
    };
    return labels[kind] || kind;
}

// LocalStorage key for history
const HISTORY_KEY = 'dev.transportSim.history.v1';
const MAX_HISTORY = 20;

export interface HistoryEntry {
    id: string;
    timestamp: string;
    scenario: TransportSimScenario;
    result: TransportSimResult;
}

/**
 * Get simulation history from localStorage
 */
export function getHistory(): HistoryEntry[] {
    try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('Failed to load history:', error);
        return [];
    }
}

/**
 * Save simulation to history
 */
export function saveToHistory(result: TransportSimResult): void {
    try {
        const history = getHistory();
        const entry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: result.timestamp,
            scenario: result.scenario,
            result
        };

        // Prepend new entry
        history.unshift(entry);

        // Keep only last MAX_HISTORY entries
        const trimmed = history.slice(0, MAX_HISTORY);

        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save to history:', error);
    }
}

/**
 * Clear all history
 */
export function clearHistory(): void {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear history:', error);
    }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
}

/**
 * Download JSON file
 */
export function downloadJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
