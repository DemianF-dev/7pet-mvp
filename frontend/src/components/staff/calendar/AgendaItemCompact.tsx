import React from 'react';
import { RefreshCw, Truck, Clock, ChevronRight } from 'lucide-react';
import { GlassSurface } from '../../ui';

interface AgendaItemCompactProps {
    appointment: any;
    onClick: (appt: any) => void;
}

// Status bar colors matching the reference
const getBarColor = (status: string, category?: string): string => {
    // Yellow for recurring/rodizio
    // Orange/red shades for transport
    // Different colors per type
    switch (status) {
        case 'PENDENTE': return '#F59E0B'; // Yellow/Orange
        case 'CONFIRMADO': return '#EF4444'; // Red
        case 'EM_ATENDIMENTO': return '#8B5CF6'; // Purple
        case 'FINALIZADO': return '#22C55E'; // Green
        default: return '#6B7280'; // Gray
    }
};

export default function AgendaItemCompact({ appointment, onClick }: AgendaItemCompactProps) {
    const start = new Date(appointment.startAt);
    const timeString = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Check for all-day event
    const isAllDay = appointment.isAllDay || timeString === '00:00';

    // Determine bar color - use performer color if available
    const barColor = appointment.performer?.color || getBarColor(appointment.status, appointment.category);

    // Icons based on content
    const isRecurring = appointment.customer?.type === 'RECORRENTE' || appointment.title?.includes('RODIZIO');
    const isTransport = appointment.quote?.appointments?.some((a: any) => a.category === 'LOGISTICA');
    const transportType = isTransport ? (appointment.title?.includes('Leva') ? 'R' : appointment.title?.includes('Traz') ? 'A' : 'LI') : null;

    const petName = appointment.pet?.name || '';
    const customerName = appointment.customer?.name || '';
    const serviceName = appointment.service?.name || '';

    // Build title like reference: "● (A) João - Chloe"
    const isCat = appointment.pet?.species?.toUpperCase().includes('GATO');
    const dotColor = appointment.performer?.color || (isCat ? '#F472B6' : '#60A5FA');

    // Subtitle: address or service
    const subtitle = appointment.address
        ? `Endereço de embarque: ${appointment.address}`
        : serviceName;

    return (
        <button
            onClick={() => onClick(appointment)}
            className="flex w-full bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-secondary)] transition-all min-h-[80px] border-b border-[var(--color-border)] text-left"
        >
            {/* Left Status Bar - Modern thin version */}
            <div
                className="w-[4px] shrink-0"
                style={{ backgroundColor: barColor }}
            />

            {/* Content Area */}
            <div className="flex-1 py-[var(--space-4)] px-[var(--space-5)] flex items-center gap-[var(--space-4)]">
                {/* Visual Indicator Layer */}
                <div className="relative shrink-0 flex flex-col items-center">
                    <div
                        className="w-2.5 h-2.5 rounded-full shadow-sm ring-2 ring-[var(--color-bg-surface)] z-10"
                        style={{ backgroundColor: dotColor }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-current opacity-[0.08]" style={{ color: dotColor }} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] tracking-tight truncate leading-tight">
                            {isTransport && appointment.transport?.type && (
                                <span className="text-[var(--color-accent-primary)] font-[var(--font-weight-black)] text-[var(--font-size-xs)] mr-1">
                                    {appointment.transport.type.toUpperCase()}:
                                </span>
                            )}
                            {isRecurring ? '(R)' : '(A)'} {customerName.split(' ')[0]} <span className="text-[var(--color-text-tertiary)] mx-0.5 font-medium">/</span> {petName}
                        </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] font-[var(--font-weight-medium)] truncate opacity-80">
                            {subtitle}
                        </span>
                    </div>
                </div>

                {/* Right Side: Time & Action */}
                <div className="flex flex-col items-end shrink-0 gap-1.5 ml-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-[var(--color-bg-tertiary)] rounded-full border border-[var(--color-border)]">
                        {!isAllDay && <Clock size={10} className="text-[var(--color-text-tertiary)]" />}
                        <span className="text-[11px] font-[var(--font-weight-black)] text-[var(--color-text-secondary)] uppercase tracking-wide">
                            {isAllDay ? 'O DIA TODO' : timeString}
                        </span>
                    </div>
                    <ChevronRight size={14} className="text-[var(--color-text-quaternary)] mr-1" />
                </div>
            </div>
        </button>
    );
}
