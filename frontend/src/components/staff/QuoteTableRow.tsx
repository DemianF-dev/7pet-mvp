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
        <tr className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-all group ${isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
            <td className="px-8 py-6">
                {(isBulkMode || isSelected) && (
                    <button
                        onClick={(e) => onToggleSelect(quote.id, e)}
                        className={`transition-all ${isSelected ? 'text-primary' : 'text-gray-200 group-hover:text-gray-400'}`}
                    >
                        {isSelected ? <CheckSquare size={20} strokeWidth={3} /> : <Square size={20} strokeWidth={3} />}
                    </button>
                )}
            </td>
            <td className="px-8 py-6">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewCustomer(quote.customerId); }}
                            className="font-black text-secondary dark:text-white uppercase tracking-tighter text-lg hover:text-primary transition-colors text-left"
                        >
                            {quote.customer?.name || 'Cliente'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onViewDetails(quote.id); }}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest hover:bg-secondary dark:hover:bg-gray-600 hover:text-white transition-colors"
                        >
                            OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                        </button>
                    </div>
                    {quote.pet && (
                        <span className="text-[10px] font-black text-primary bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-full w-fit mt-1 uppercase tracking-widest">
                            Pet: {quote.pet.name || 'Desconhecido'}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-8 py-6 text-center">
                <div className="flex flex-col gap-1 items-center">
                    <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black text-secondary dark:text-white uppercase tracking-widest">
                            {quote.desiredAt ? new Date(quote.desiredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Sem data'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">Criado em {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('pt-BR') : '-'}</span>
                    </div>
                    {quote.type && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] ${quote.type === 'SPA' ? 'bg-blue-100 text-blue-600' : quote.type === 'TRANSPORTE' ? 'bg-orange-100 text-orange-600' : 'bg-purple-100 text-purple-600'}`}>
                            {quote.type.replace('_', ' ')}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-8 py-6 text-center">
                {quote.status === 'AGENDADO' && quote.appointments && quote.appointments.length > 0 ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewAppointment(quote);
                        }}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${getQuoteStatusColor(quote.status)} hover:ring-2 hover:ring-offset-2 hover:ring-green-500 transition-all cursor-pointer`}
                    >
                        {quote.status}
                    </button>
                ) : (
                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${getQuoteStatusColor(quote.status)}`}>
                        {quote.status}
                    </span>
                )}
            </td>
            <td className="px-8 py-6 text-right font-black text-secondary dark:text-white text-lg">
                R$ {(quote.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </td>
            <td className="px-8 py-6 text-right">
                <div className="flex justify-end gap-2">
                    {view === 'trash' ? (
                        <>
                            <button
                                onClick={() => onRestore(quote.id)}
                                className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-500 rounded-xl transition-all"
                                title="Restaurar"
                            >
                                <RefreshCcw size={18} />
                            </button>
                            <button onClick={() => onPermanentDelete(quote.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all" title="Excluir Permanente"><Trash2 size={18} /></button>
                        </>
                    ) : view === 'history' ? (
                        <>
                            <button onClick={() => onDuplicate(quote.id)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Duplicar Orçamento"><Copy size={18} /></button>
                            <button
                                onClick={() => onReactivate(quote.id)}
                                className="px-3 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-2"
                                title="Reativar Orçamento"
                            >
                                <RefreshCcw size={14} /> Reativar
                            </button>
                            <button onClick={() => onViewDetails(quote.id)} className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-secondary dark:text-white rounded-xl transition-all" title="Ver Detalhes"><Edit size={18} /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => onDuplicate(quote.id)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Duplicar"><Copy size={18} /></button>
                            <button onClick={() => onShare(quote)} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Compartilhar no WhatsApp"><Share2 size={18} /></button>
                            <button onClick={() => onDelete(quote.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100" title="Mover para Lixeira"><Trash2 size={18} /></button>
                            <button onClick={() => onViewDetails(quote.id)} className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-secondary dark:text-white rounded-xl transition-all" title="Ver Detalhes"><Edit size={18} /></button>
                            {quote.status === 'APROVADO' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSchedule(quote); }}
                                    className="px-4 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
                                    title="Agendar Agora"
                                >
                                    <Calendar size={14} /> Agendar
                                </button>
                            )}
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
});

QuoteTableRow.displayName = 'QuoteTableRow';

export default QuoteTableRow;
