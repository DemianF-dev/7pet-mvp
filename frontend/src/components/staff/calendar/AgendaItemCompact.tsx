import { Clock, ChevronRight } from 'lucide-react';
import { AgendaItem } from '../../../features/agenda/domain/types';

interface AgendaItemCompactProps {
    appointment: AgendaItem;
    onClick: (appt: AgendaItem) => void;
}

// Status bar colors matching the reference
const getBarColor = (status: string): string => {
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
    const barColor = appointment.performer?.color || getBarColor(appointment.status);

    // Icons based on content
    const isRecurring = appointment.customer?.type === 'RECORRENTE' || appointment.title?.includes('RODIZIO');
    const isTransport = appointment.quote?.appointments?.some((a: { category: string }) => a.category === 'LOGISTICA');
    void (isTransport ? (appointment.title?.includes('Leva') ? 'R' : appointment.title?.includes('Traz') ? 'A' : 'LI') : null); // transportType - reserved for future badge

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
            className="flex w-full bg-[var(--color-bg-surface)] active:bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all min-h-[95px] border-b border-[var(--color-border)] text-left group"
        >
            {/* Left Status Bar - Modern thicker version */}
            <div
                className="w-[6px] shrink-0"
                style={{ backgroundColor: barColor }}
            />

            {/* Content Area */}
            <div className="flex-1 py-[var(--space-5)] px-[var(--space-6)] flex items-center gap-[var(--space-6)]">
                {/* Visual Indicator Layer */}
                <div className="relative shrink-0 flex flex-col items-center">
                    <div
                        className="w-3.5 h-3.5 rounded-full shadow-md ring-2 ring-[var(--color-bg-surface)] z-10 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: dotColor }}
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-current opacity-[0.08]" style={{ color: dotColor }} />
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1.5">
                        <span className="text-[15px] font-[var(--font-weight-black)] text-[var(--color-text-primary)] tracking-tight truncate leading-tight uppercase">
                            {isTransport && appointment.transport?.type && (
                                <span className="text-[var(--color-accent-primary)] font-[var(--font-weight-black)] text-[var(--font-size-xs)] mr-2">
                                    {(appointment.transport.type || '').toUpperCase()}:
                                </span>
                            )}
                            {isRecurring ? '(R)' : '(A)'} {customerName.split(' ')[0]} <span className="text-[var(--color-text-tertiary)] mx-1 font-medium opacity-30">/</span> {petName}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-[11px] text-[var(--color-text-tertiary)] font-[var(--font-weight-bold)] truncate opacity-80 uppercase tracking-widest bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded-md">
                            {subtitle}
                        </span>
                    </div>

                    {import.meta.env.VITE_TRANSPORT_LEGS_V2_ENABLED === 'true' && appointment.transportLegs && appointment.transportLegs.length > 0 && (
                        <div className="flex gap-1 mt-2">
                            {appointment.transportLegs.some(l => l.legType === 'LEVA') && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Leva: {appointment.transportLegs.find(l => l.legType === 'LEVA')?.provider?.name?.split(' ')[0] || 'N/A'}
                                </span>
                            )}
                            {appointment.transportLegs.some(l => l.legType === 'TRAZ') && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                    Traz: {appointment.transportLegs.find(l => l.legType === 'TRAZ')?.provider?.name?.split(' ')[0] || 'N/A'}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Time & Action */}
                <div className="flex flex-col items-end shrink-0 gap-1.5 ml-4">
                    <div className="text-[14px] font-[var(--font-weight-black)] text-[var(--color-accent-primary)] tabular-nums">
                        R$ {(
                            (appointment.services || (appointment.service ? [appointment.service] : [])).reduce((acc: number, s: any) => acc + (s?.basePrice || 0), 0) +
                            (appointment.transportLegs || []).reduce((acc: number, l: any) => acc + Number(l.price || 0), 0) +
                            ((!appointment.transportLegs?.length && appointment.category === 'LOGISTICA' && appointment.transportSnapshot) ? Number(appointment.transportSnapshot.totalAmount || 0) : 0)
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border)] shadow-sm">
                        {!isAllDay && <Clock size={10} className="text-[var(--color-accent-primary)]" />}
                        <span className="text-[11px] font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-wider">
                            {isAllDay ? 'O DIA TODO' : timeString}
                        </span>
                    </div>
                    <ChevronRight size={20} className="text-[var(--color-text-quaternary)] mr-1 group-hover:text-[var(--color-accent-primary)] transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </button>
    );
}
