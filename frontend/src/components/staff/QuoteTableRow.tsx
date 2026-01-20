import React from 'react';
import { CheckSquare, Square, Edit, Trash2, Copy, Share2, Calendar, RefreshCcw } from 'lucide-react';
import { getQuoteStatusColor } from '../../utils/statusColors';

interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    price: number;
    serviceId?: string;
}

interface Quote {
    id: string;
    customerId: string;
    customer: { name: string };
    status: string;
    totalAmount: number;
    createdAt: string;
    seqId?: number;
    items: QuoteItem[];
    petId?: string;
    pet?: { name: string };
    desiredAt?: string;
    scheduledAt?: string;
    transportAt?: string;
    type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
    transportOrigin?: string;
    transportDestination?: string;
    transportReturnAddress?: string;
    transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
    appointments?: { id: string; category: string; status: string; startAt?: string }[];
}

interface QuoteTableRowProps {
    quote: Quote;
    view: 'active' | 'trash' | 'history';
    isBulkMode: boolean;
    isSelected: boolean;
    onToggleSelect: (id: string, e?: React.MouseEvent) => void;
    onViewCustomer: (id: string) => void;
    onViewDetails: (id: string) => void;
    onDuplicate: (id: string) => void;
    onShare: (quote: Quote) => void;
    onDelete: (id: string) => void;
    onPermanentDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onReactivate: (id: string) => void;
    onSchedule: (quote: Quote) => void;
    onViewAppointment: (quote: Quote) => void;
}

const QuoteTableRow = React.memo(({
    quote,
    view,
    isBulkMode,
    isSelected,
    onToggleSelect,
    onViewCustomer,
    onViewDetails,
    onDuplicate,
    onShare,
    onDelete,
    onPermanentDelete,
    onRestore,
    onReactivate,
    onSchedule,
    onViewAppointment
}: QuoteTableRowProps) => {
    return (
        <div
            className={`flex flex-col md:flex-row md:items-center px-[var(--space-6)] py-[var(--space-5)] transition-all group border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-fill-secondary)] ${isSelected ? 'bg-[var(--color-accent-primary-alpha)]' : 'bg-transparent'}`}
            onClick={() => onViewDetails(quote.id)}
        >
            {/* selection & ID */}
            <div className="flex items-center gap-4 mb-4 md:mb-0 md:w-48 lg:w-64">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(quote.id, e); }}
                    className={`flex-shrink-0 transition-all ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
                >
                    {isSelected ? <CheckSquare size={22} strokeWidth={2.5} /> : <Square size={22} strokeWidth={2} />}
                </button>

                <div className="flex flex-col">
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewCustomer(quote.customerId); }}
                        className="font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-tight text-base hover:text-[var(--color-accent-primary)] transition-colors text-left truncate"
                    >
                        {quote.customer?.name || 'Cliente'}
                    </button>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-[var(--font-weight-black)] text-[var(--color-text-tertiary)] uppercase tracking-widest">
                            OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                        </span>
                        {quote.pet && (
                            <Badge variant="surface" size="sm" className="bg-[var(--color-accent-primary-alpha)] text-[var(--color-accent-primary)] border-transparent leading-none py-0.5 px-1.5 h-auto font-bold">
                                {quote.pet.name}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Date & Type */}
            <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-center md:flex-1 mb-4 md:mb-0 text-center">
                <div className="flex flex-col items-start md:items-center">
                    <span className="text-[11px] font-[var(--font-weight-black)] text-[var(--color-text-primary)] uppercase tracking-widest">
                        {quote.desiredAt ? new Date(quote.desiredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sem data'}
                    </span>
                    <span className="text-[9px] font-bold text-[var(--color-text-tertiary)]">
                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </span>
                </div>
                {quote.type && (
                    <Badge
                        variant="surface"
                        size="sm"
                        className={`mt-1 font-[var(--font-weight-black)] text-[9px] uppercase tracking-wider ${quote.type === 'SPA' ? 'text-blue-500' : quote.type === 'TRANSPORTE' ? 'text-orange-500' : 'text-purple-500'}`}
                    >
                        {quote.type.replace('_', ' ')}
                    </Badge>
                )}
            </div>

            {/* Status */}
            <div className="flex justify-between md:justify-center items-center md:w-32 lg:w-40 mb-4 md:mb-0">
                <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest md:hidden">Status</span>
                {quote.status === 'AGENDADO' && quote.appointments && quote.appointments.length > 0 ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); onViewAppointment(quote); }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest ${getQuoteStatusColor(quote.status)} hover:ring-2 hover:ring-[var(--color-accent-primary-alpha)] transition-all cursor-pointer`}
                    >
                        {quote.status}
                    </button>
                ) : (
                    <Badge
                        variant="surface"
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest ${getQuoteStatusColor(quote.status)}`}
                    >
                        {quote.status}
                    </Badge>
                )}
            </div>

            {/* Total */}
            <div className="flex justify-between md:justify-end items-center md:w-32 lg:w-40 mb-4 md:mb-0">
                <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest md:hidden">Valor</span>
                <span className="font-[var(--font-weight-black)] text-[var(--color-text-primary)] text-lg">
                    R$ {(quote.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-1 md:w-48 lg:w-56" onClick={e => e.stopPropagation()}>
                {view === 'trash' ? (
                    <>
                        <IconButton icon={RefreshCcw} onClick={() => onRestore(quote.id)} variant="surface" size="sm" className="text-green-500" aria-label="Restaurar" />
                        <IconButton icon={Trash2} onClick={() => onPermanentDelete(quote.id)} variant="surface" size="sm" className="text-red-500" aria-label="Excluir Permanente" />
                    </>
                ) : view === 'history' ? (
                    <>
                        <IconButton icon={Copy} onClick={() => onDuplicate(quote.id)} variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 hidden md:flex" aria-label="Duplicar" />
                        <Button
                            onClick={() => onReactivate(quote.id)}
                            variant="surface"
                            size="sm"
                            className="text-green-600 font-[var(--font-weight-black)] text-[10px] py-1 px-3 h-9"
                            icon={RefreshCcw}
                        >
                            REATIVAR
                        </Button>
                        <IconButton icon={Edit} onClick={() => onViewDetails(quote.id)} variant="surface" size="sm" aria-label="Editar" />
                    </>
                ) : (
                    <>
                        <IconButton icon={Copy} onClick={() => onDuplicate(quote.id)} variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 hidden md:flex" aria-label="Duplicar" />
                        <IconButton icon={Share2} onClick={() => onShare(quote)} variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-green-600 hidden md:flex" aria-label="Compartilhar" />
                        <IconButton icon={Trash2} onClick={() => onDelete(quote.id)} variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-red-500 hidden md:flex" aria-label="Mover para Lixeira" />
                        <IconButton icon={Edit} onClick={() => onViewDetails(quote.id)} variant="surface" size="sm" aria-label="Editar" />
                        {quote.status === 'APROVADO' && (
                            <Button
                                onClick={(e) => { e.stopPropagation(); onSchedule(quote); }}
                                variant="primary"
                                size="sm"
                                className="h-9 px-3 font-[var(--font-weight-black)] text-[10px]"
                                icon={Calendar}
                            >
                                AGENDAR
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

QuoteTableRow.displayName = 'QuoteTableRow';

export default QuoteTableRow;
