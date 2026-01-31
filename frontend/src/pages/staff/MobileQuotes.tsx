import {
    Search,
    Plus,
    Filter,
    Share2,
    Calendar,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, Badge, IconButton } from '../../components/ui';
import { getQuoteStatusColor } from '../../utils/statusColors';

interface MobileQuotesProps {
    quotes: any[];
    isLoading: boolean;
    searchTerm: string;
    onSearch: (term: string) => void;
    view: 'active' | 'trash' | 'history';
    onViewChange: (view: any) => void;
    onNewQuote: () => void;
    onOpenDetails: (quoteId: string) => void;
}

export const MobileQuotes = ({
    quotes,
    isLoading,
    searchTerm,
    onSearch,
    view,
    onViewChange,
    onNewQuote,
    onOpenDetails
}: MobileQuotesProps) => {
    return (
        <MobileShell
            title="Orçamentos"
            rightAction={<IconButton icon={Plus} onClick={onNewQuote} variant="ghost" aria-label="Novo Orçamento" />}
        >
            <div className="space-y-6 pb-24">
                {/* View Tabs */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl">
                    <button
                        onClick={() => onViewChange('active')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'active' ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-gray-400'}`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => onViewChange('history')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'history' ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' : 'text-gray-400'}`}
                    >
                        Histórico
                    </button>
                    <button
                        onClick={() => onViewChange('trash')}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'trash' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400'}`}
                    >
                        Lixeira
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou título..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando orçamentos...</p>
                        </div>
                    ) : quotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-10">
                            <Filter size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-bold text-gray-600">Nenhum orçamento</p>
                            <p className="text-xs mt-1">Nenhum registro encontrado para esta vista.</p>
                        </div>
                    ) : (
                        quotes.map((quote) => (
                            <Card
                                key={quote.id}
                                className="!p-5 active:scale-[0.98] transition-all"
                                onClick={() => onOpenDetails(quote.id)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">#{quote.id.slice(0, 6)}</span>
                                            <Badge
                                                variant="neutral"
                                                className="text-[8px] px-1.5 py-0 font-black uppercase h-auto"
                                                style={{
                                                    backgroundColor: `${getQuoteStatusColor(quote.status)}20`,
                                                    color: getQuoteStatusColor(quote.status)
                                                }}
                                            >
                                                {quote.status}
                                            </Badge>
                                        </div>
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">
                                            {quote.customer?.name || 'Cliente s/ nome'}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate mt-0.5">{quote.title}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-primary">
                                            R$ {quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-50 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                                        <Calendar size={12} />
                                        {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 justify-end">
                                        <Sparkles size={12} />
                                        {quote.items?.length || 0} itens
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <button className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <Share2 size={14} /> Compartilhar
                                    </button>
                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </MobileShell>
    );
};
