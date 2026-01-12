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
            className="flex w-full bg-[#121212] active:bg-[#1a1a1a] transition-colors min-h-[56px]"
        >
            {/* Left Vertical Bar */}
            <div
                className="w-[4px] shrink-0 rounded-r-sm"
                style={{ backgroundColor: barColor }}
            />

            {/* Content Area */}
            <div className="flex-1 py-3 px-4 flex items-start gap-3">
                {/* Icon */}
                {isRecurring && (
                    <RefreshCw size={14} className="text-gray-400 mt-1 shrink-0" />
                )}
                {isTransport && !isRecurring && (
                    <Truck size={14} className="text-gray-400 mt-1 shrink-0" />
                )}

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    {/* Title Row */}
                    <div className="flex items-start justify-between gap-2">
                        <span className="text-white font-medium text-[14px] leading-tight truncate flex-1">
                            {title}
                        </span>
                        <span className="text-gray-500 text-[13px] whitespace-nowrap shrink-0">
                            {isAllDay ? 'o dia todo' : timeString}
                        </span>
                    </div>

                    {/* Subtitle Row */}
                    {subtitle && (
                        <div className="flex items-start justify-between gap-2 mt-0.5">
                            <span className="text-gray-500 text-[12px] truncate flex-1">
                                {subtitle}
                            </span>
                            {!isAllDay && (
                                <span className="text-gray-600 text-[12px] whitespace-nowrap shrink-0">
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
