import React from 'react';
import { RefreshCw, Truck } from 'lucide-react';

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

    // Title formatting
    const petName = appointment.pet?.name || '';
    const customerName = appointment.customer?.name || '';
    const serviceName = appointment.service?.name || '';

    // Build title like reference: "(R) Leva - Blue - Industrial Auton..."
    let title = '';
    if (isRecurring && !isTransport) {
        title = `***${customerName.toUpperCase()}${petName ? ` ${petName.toUpperCase()}` : ''}****`;
    } else if (isTransport && transportType) {
        title = `(${transportType}) ${appointment.title || `Leva - ${petName}`}`;
    } else {
        title = `${customerName} - ${petName}`;
    }

    // Subtitle: address or service
    const subtitle = appointment.address
        ? `Endereço de embarque: ${appointment.address}`
        : serviceName;

    return (
        <div
            onClick={() => onClick(appointment)}
            className="flex w-full bg-[var(--color-bg-primary)] active:bg-[var(--color-bg-secondary)] transition-all min-h-[64px] border-b border-[var(--color-border)]/50"
        >
            {/* Left Vertical Bar */}
            <div
                className="w-[5px] shrink-0"
                style={{ backgroundColor: barColor }}
            />

            {/* Content Area */}
            <div className="flex-1 py-3.5 px-5 flex items-start gap-4">
                {/* Icon */}
                {isRecurring && (
                    <RefreshCw size={14} className="text-[var(--color-text-tertiary)] mt-1 shrink-0 opacity-70" />
                )}
                {isTransport && !isRecurring && (
                    <Truck size={14} className="text-[var(--color-text-tertiary)] mt-1 shrink-0 opacity-70" />
                )}

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-[var(--color-text-primary)] font-bold text-[15px] leading-tight truncate flex-1 tracking-tight">
                            {title}
                        </span>
                        <span className="text-[var(--color-text-tertiary)] text-[12px] font-medium whitespace-nowrap shrink-0 ml-2">
                            {isAllDay ? 'o dia todo' : timeString}
                        </span>
                    </div>

                    {/* Subtitle Row */}
                    {subtitle && (
                        <div className="flex items-start justify-between gap-2 mt-1">
                            <span className="text-[var(--color-text-secondary)] text-[13px] truncate flex-1 opacity-80">
                                {subtitle}
                            </span>
                            {!isAllDay && (
                                <span className="text-[var(--color-text-tertiary)] text-[11px] whitespace-nowrap shrink-0 opacity-50 font-light">
                                    {timeString}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
