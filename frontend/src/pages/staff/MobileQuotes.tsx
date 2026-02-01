import {
    Search,
    Plus,
    Filter,
    Share2,
    Calendar,
    ChevronRight,
    Sparkles,
    Copy,
    Download,
    MoreVertical,
    CheckSquare,
    Square,
    X,
    Trash2,
    DollarSign
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, Badge, Button } from '../../components/ui';
import { getQuoteStatusColor } from '../../utils/statusColors';
import { useState, useEffect } from 'react';
import { MobileFilters } from '../../components/mobile/MobileFilters';
import { DataImportExport } from '../../components/mobile/DataImportExport';

interface MobileQuotesProps {
    quotes: any[];
    isLoading: boolean;
    searchTerm: string;
    onSearch: (term: string) => void;
    view: 'active' | 'trash' | 'history';
    onViewChange: (view: any) => void;
    onNewQuote: () => void;
    onOpenDetails: (quoteId: string) => void;
    onBulkDelete?: (ids: string[]) => void;
    onBulkRestore?: (ids: string[]) => void;
    onBatchBill?: () => void;
    onBulkDuplicate?: (ids: string[]) => void;
    onShare?: (quote: any) => void;
    onDuplicate?: (id: string) => void;
}

export const MobileQuotes = ({
    quotes,
    isLoading,
    searchTerm,
    onSearch,
    view,
    onViewChange,
    onNewQuote,
    onOpenDetails,
    onBulkDelete,
    onBulkRestore,
    onBatchBill,
    onBulkDuplicate,
    onShare,
    onDuplicate
}: MobileQuotesProps) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showDataImportExport, setShowDataImportExport] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        dateRange: { start: '', end: '' },
        valueRange: { min: 0, max: 0 },
        status: '',
        searchTerm: ''
    });

    const statuses = ['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'AGENDAR', 'AGENDADO', 'ENCERRADO', 'FATURAR'];

    // Reset selection when view changes
    useEffect(() => {
        setSelectedIds([]);
        setIsBulkMode(false);
    }, [view]);

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === quotes.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(quotes.map(q => q.id));
        }
    };

    const handleBulkDelete = () => {
        if (!onBulkDelete || selectedIds.length === 0) return;
        if (!window.confirm(`Deseja excluir ${selectedIds.length} orçamentos?`)) return;
        onBulkDelete(selectedIds);
        setSelectedIds([]);
    };

    const handleBulkRestore = () => {
        if (!onBulkRestore || selectedIds.length === 0) return;
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} orçamentos?`)) return;
        onBulkRestore(selectedIds);
        setSelectedIds([]);
    };

    const handleBulkDuplicate = () => {
        if (!onBulkDuplicate || selectedIds.length === 0) return;
        if (!window.confirm(`Deseja duplicar ${selectedIds.length} orçamentos?`)) return;
        onBulkDuplicate(selectedIds);
        setSelectedIds([]);
    };

    const handleShare = (quote: any) => {
        if (onShare) {
            onShare(quote);
        } else {
            // Default share implementation
            const text = `*ORÇAMENTO 7PET*\n\n` +
                `📄 *Ref:* OC-${String((quote.seqId || 0) + 1000).padStart(4, '0')}\n` +
                `👤 *Cliente:* ${quote.customer?.name || 'Cliente s/ nome'}\n` +
                `💰 *Total:* R$ ${quote.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
                `📊 *Status:* ${quote.status}\n\n` +
                `_Enviado via Sistema 7Pet_`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    };

    const handleCardClick = (quoteId: string) => {
        if (isBulkMode) {
            toggleSelect(quoteId);
        } else {
            onOpenDetails(quoteId);
        }
    };

    const handleDuplicate = (quote: any) => {
        if (onDuplicate) {
            onDuplicate(quote.id);
        }
    };

    const handleExport = (quote: any) => {
        const exportData = {
            id: quote.id,
            reference: `OC-${String((quote.seqId || 0) + 1000).padStart(4, '0')}`,
            customer: quote.customer?.name || 'Cliente s/ nome',
            title: quote.title,
            total: quote.totalAmount,
            status: quote.status,
            createdAt: quote.createdAt,
            items: quote.items?.length || 0,
            pet: quote.pet?.name || '-',
            services: quote.items?.map((item: any) => item.description || item.service?.name).join(', ') || '-'
        };

        const csvContent = [
            ['Referência', 'Cliente', 'Título', 'Pet', 'Total', 'Status', 'Criação', 'Serviços', 'Qtd Itens'],
            [
                exportData.reference,
                exportData.customer,
                exportData.title,
                exportData.pet,
                `R$ ${exportData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                exportData.status,
                new Date(exportData.createdAt).toLocaleDateString('pt-BR'),
                exportData.services,
                exportData.items.toString()
            ]
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orcamento-${exportData.reference}-${exportData.customer.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    return (
        <MobileShell title={isBulkMode ? `${selectedIds.length} selecionados` : "Orçamentos"}>
            {/* Header Actions - Now in body for visibility */}
            <div className="flex items-center justify-between gap-3 px-1 mb-4">
                {isBulkMode ? (
                    <div className="flex items-center gap-2 w-full">
                        <Button
                            onClick={toggleSelectAll}
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-10 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-gray-100 dark:bg-zinc-800"
                            icon={selectedIds.length === quotes.length ? Square : CheckSquare}
                        >
                            {selectedIds.length === quotes.length ? 'DESMARCAR' : 'MARCAR TODOS'}
                        </Button>
                        <Button
                            onClick={() => {
                                setIsBulkMode(false);
                                setSelectedIds([]);
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl bg-gray-100 dark:bg-zinc-800"
                            icon={X}
                        >
                            VOLTAR
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 w-full">
                        <Button
                            onClick={() => setIsBulkMode(true)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-10 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-gray-100 dark:bg-zinc-800"
                            icon={CheckSquare}
                        >
                            SELECIONAR
                        </Button>
                        <Button
                            onClick={onNewQuote}
                            variant="primary"
                            size="sm"
                            className="flex-1 h-10 px-3 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20"
                            icon={Plus}
                        >
                            NOVO ORÇAMENTO
                        </Button>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            {isBulkMode && selectedIds.length > 0 && (
                <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-4 z-40">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selecionados
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {view !== 'trash' && (
                            <Button
                                onClick={handleBulkDelete}
                                variant="destructive"
                                size="sm"
                                icon={Trash2}
                                className="text-[10px] font-black uppercase tracking-widest"
                            >
                                EXCLUIR
                            </Button>
                        )}
                        {view === 'trash' && (
                            <Button
                                onClick={handleBulkRestore}
                                variant="primary"
                                size="sm"
                                className="text-[10px] font-black uppercase tracking-widest"
                            >
                                RESTAURAR
                            </Button>
                        )}
                        {view === 'active' && (
                            <Button
                                onClick={() => onBatchBill?.()}
                                variant="secondary"
                                size="sm"
                                icon={DollarSign}
                                className="text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                            >
                                FATURAR
                            </Button>
                        )}
                        <Button
                            onClick={handleBulkDuplicate}
                            variant="secondary"
                            size="sm"
                            icon={Copy}
                            className="text-[10px] font-black uppercase tracking-widest"
                        >
                            DUPLICAR
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-6 pb-32">
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
                        className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-32 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                            onClick={() => setShowFilters(true)}
                            className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Filter size={14} />
                        </button>
                        <button
                            onClick={() => setShowDataImportExport(true)}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <Download size={14} />
                        </button>
                    </div>
                </div>

                {/* Active Filters Indicator */}
                {(advancedFilters.dateRange.start || advancedFilters.dateRange.end || advancedFilters.status || advancedFilters.valueRange.min > 0 || advancedFilters.valueRange.max > 0) && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600 font-medium">Filtros ativos</span>
                        <button
                            onClick={() => {
                                setAdvancedFilters({
                                    dateRange: { start: '', end: '' },
                                    valueRange: { min: 0, max: 0 },
                                    status: '',
                                    searchTerm: ''
                                });
                            }}
                            className="text-red-500 font-medium"
                        >
                            Limpar
                        </button>
                    </div>
                )}

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
                        quotes.map((quote) => {
                            const isSelected = selectedIds.includes(quote.id);
                            return (
                                <Card
                                    key={quote.id}
                                    className={`!p-5 active:scale-[0.98] transition-all ${isBulkMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                    onClick={() => handleCardClick(quote.id)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {isBulkMode && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelect(quote.id);
                                                    }}
                                                    className="mt-1 flex-shrink-0"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                                                        OC-{String((quote.seqId || 0) + 1000).padStart(4, '0')}
                                                    </span>
                                                    <Badge
                                                        variant="neutral"
                                                        className={`text-[8px] px-1.5 py-0 font-black uppercase h-auto ${getQuoteStatusColor(quote.status)}`}
                                                    >
                                                        {quote.status}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">
                                                    {quote.customer?.name || 'Cliente s/ nome'}
                                                </h3>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase truncate mt-0.5">{quote.title}</p>
                                            </div>
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
                                        {!isBulkMode && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleShare(quote);
                                                    }}
                                                    className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-500 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                >
                                                    <Share2 size={12} />
                                                </button>
                                                {onDuplicate && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDuplicate(quote);
                                                        }}
                                                        className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                    >
                                                        <Copy size={12} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExport(quote);
                                                    }}
                                                    className="flex items-center gap-1.5 px-2 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors hover:bg-green-100 dark:hover:bg-green-900/50"
                                                >
                                                    <Download size={12} />
                                                </button>
                                            </div>
                                        )}
                                        {!isBulkMode && <ChevronRight size={18} className="text-gray-300" />}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Filters Modal */}
            <MobileFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={(filters) => {
                    setAdvancedFilters(filters);
                    // Apply filters to parent component
                    onSearch(filters.searchTerm);
                    // You may need to add additional props for handling advanced filters
                }}
                onReset={() => {
                    setAdvancedFilters({
                        dateRange: { start: '', end: '' },
                        valueRange: { min: 0, max: 0 },
                        status: '',
                        searchTerm: ''
                    });
                    onSearch('');
                }}
                filters={advancedFilters}
                title="Filtrar Orçamentos"
                statuses={statuses}
            />

            {/* Data Import/Export Modal */}
            <DataImportExport
                isOpen={showDataImportExport}
                onClose={() => setShowDataImportExport(false)}
                exportType="quotes"
                data={quotes}
                onImport={(file) => {
                    // Handle import logic here
                    console.log('Importing file:', file);
                }}
            />
        </MobileShell>
    );
};
