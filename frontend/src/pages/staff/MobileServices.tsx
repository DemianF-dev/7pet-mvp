import { useState, useMemo } from 'react';
import {
    Tag, Search, Plus, Filter,
    MoreHorizontal, Edit2, Copy,
    Trash2, RotateCcw, Clock,
    ChevronRight, Dog, Cat,
    RefreshCcw, Grid, List,
    CheckSquare, Square, X, Download
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { MobileFilters } from '../../components/mobile/MobileFilters';
import { DataImportExport } from '../../components/mobile/DataImportExport';

interface Service {
    id: string;
    seqId?: number;
    name: string;
    description: string;
    basePrice: number;
    duration: number;
    category: string;
    species: string;
    status?: string;
}

interface MobileServicesProps {
    services: Service[];
    isLoading: boolean;
    onEdit: (service: Service) => void;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onDuplicate: (service: Service) => void;
    onNew: () => void;
    onRefresh: () => void;
    tab: 'active' | 'trash';
}

export const MobileServices = ({
    services,
    isLoading,
    onEdit,
    onDelete,
    onRestore,
    onDuplicate,
    onNew,
    onRefresh,
    tab
}: MobileServicesProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState<'Canino' | 'Felino'>('Canino');
    const [showFilters, setShowFilters] = useState(false);
    const [showDataImportExport, setShowDataImportExport] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        dateRange: { start: '', end: '' },
        valueRange: { min: 0, max: 0 },
        status: '',
        searchTerm: ''
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpecies = s.species === speciesFilter;
            return matchesSearch && matchesSpecies;
        });
    }, [services, searchTerm, speciesFilter]);

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredServices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredServices.map(s => s.id));
        }
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Deseja excluir ${selectedIds.length} serviços?`)) return;
        selectedIds.forEach(id => onDelete(id));
        setSelectedIds([]);
    };

    const handleBulkRestore = () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} serviços?`)) return;
        selectedIds.forEach(id => onRestore(id));
        setSelectedIds([]);
    };

    const handleBulkDuplicate = () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Deseja duplicar ${selectedIds.length} serviços?`)) return;
        const serviceToDuplicate = filteredServices.find(s => s.id === selectedIds[0]);
        if (serviceToDuplicate) {
            onDuplicate(serviceToDuplicate);
        }
        setSelectedIds([]);
    };

    return (
        <MobileShell
            title={isBulkMode ? `${selectedIds.length} selecionados` : "Catálogo de Serviços"}
            rightAction={
                isBulkMode ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSelectAll}
                            className="p-2 text-gray-600 active:scale-95 transition-transform"
                        >
                            {selectedIds.length === filteredServices.length ? <Square size={20} /> : <CheckSquare size={20} />}
                        </button>
                        <button
                            onClick={() => {
                                setIsBulkMode(false);
                                setSelectedIds([]);
                            }}
                            className="p-2 text-red-600 active:scale-95 transition-transform"
                        >
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsBulkMode(true)}
                            className="p-2 text-gray-600 active:scale-95 transition-transform"
                        >
                            <CheckSquare size={20} />
                        </button>
                        <button
                            onClick={onNew}
                            className="p-2 text-blue-600 active:scale-90 transition-transform"
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </button>
                    </div>
                )
            }
        >
            <div className="space-y-6 pb-24">
                {/* Species Toggle */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-[20px] shadow-inner">
                    <button
                        onClick={() => setSpeciesFilter('Canino')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-bold uppercase tracking-widest transition-all ${speciesFilter === 'Canino'
                                ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm'
                                : 'text-gray-400'
                            }`}
                    >
                        <Dog size={18} /> Cães
                    </button>
                    <button
                        onClick={() => setSpeciesFilter('Felino')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-bold uppercase tracking-widest transition-all ${speciesFilter === 'Felino'
                                ? 'bg-white dark:bg-zinc-700 text-purple-600 shadow-sm'
                                : 'text-gray-400'
                            }`}
                    >
                        <Cat size={18} /> Gatos
                    </button>
                </div>

                {/* Bulk Actions Bar */}
                {isBulkMode && selectedIds.length > 0 && (
                    <div className="fixed bottom-20 left-4 right-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 p-4 z-40">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                {selectedIds.length} serviço{selectedIds.length !== 1 ? 's' : ''} selecionados
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {tab !== 'trash' && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-4 py-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    EXCLUIR
                                </button>
                            )}
                            {tab === 'trash' && (
                                <button
                                    onClick={handleBulkRestore}
                                    className="px-4 py-3 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    RESTAURAR
                                </button>
                            )}
                            <button
                                onClick={handleBulkDuplicate}
                                className="px-4 py-3 bg-gray-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2"
                            >
                                <Copy size={16} />
                                DUPLICAR
                            </button>
                        </div>
                    </div>
                )}

                {/* Search & Refresh */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="search"
                            placeholder="Buscar serviço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl pl-11 pr-16 py-3.5 text-sm font-medium shadow-sm"
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
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-400 rounded-2xl active:scale-95 transition-all disabled:opacity-50"
                    >
                        <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Services List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Atualizando Catálogo...</p>
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-10">
                            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
                                <Tag size={40} className="opacity-10" />
                            </div>
                            <p className="font-bold text-gray-600 dark:text-gray-300">Nenhum serviço encontrado</p>
                            <p className="text-xs mt-1">Busque por outro nome ou verifique os filtros.</p>
                        </div>
                    ) : (
                        filteredServices.map((s) => {
                            const isSelected = selectedIds.includes(s.id);
                            return (
                                <div
                                    key={s.id}
                                    className={`mobile-card !p-4 flex flex-col gap-4 active:scale-[0.98] transition-transform ${isBulkMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                                    onClick={() => isBulkMode ? toggleSelect(s.id) : onEdit(s)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            {isBulkMode && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelect(s.id);
                                                    }}
                                                    className="mt-1 flex-shrink-0"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-5 h-5 text-blue-500" />
                                                    ) : (
                                                        <Square className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </button>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-400 rounded text-[8px] font-bold uppercase tracking-tighter">
                                                        ID: {String((s.seqId || 0) + 999).padStart(4, '0')}
                                                    </span>
                                                    <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[8px] font-bold uppercase tracking-widest">
                                                        {s.category || 'ESTÉTICA'}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase truncate">
                                                    {s.name}
                                                </h3>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-lg font-bold text-blue-600 leading-none">
                                                <span className="text-[10px] font-bold mr-0.5">R$</span>
                                                {s.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                <Clock size={10} />
                                                {s.duration} min
                                            </div>
                                        </div>
                                    </div>

                                    {!isBulkMode && (
                                        <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                            <div className="flex gap-2">
                                                {tab === 'active' ? (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDuplicate(s); }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
                                                        >
                                                            <Copy size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Export service data as CSV
                                                                const exportData = {
                                                                    id: s.id,
                                                                    codigo: `SRV-${String((s.seqId || 0) + 999).padStart(4, '0')}`,
                                                                    nome: s.name,
                                                                    categoria: s.category || 'ESTÉTICA',
                                                                    especie: s.species || 'Canino',
                                                                    preco: s.basePrice,
                                                                    duracao: s.duration,
                                                                    status: s.status || 'ATIVO'
                                                                };

                                                                const csvContent = [
                                                                    ['Código', 'Nome', 'Categoria', 'Espécie', 'Preço', 'Duração', 'Status'],
                                                                    [
                                                                        exportData.codigo,
                                                                        exportData.nome,
                                                                        exportData.categoria,
                                                                        exportData.especie,
                                                                        `R$ ${exportData.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                                                                        `${exportData.duracao} min`,
                                                                        exportData.status
                                                                    ]
                                                                ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

                                                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                                                const link = document.createElement('a');
                                                                const url = URL.createObjectURL(blob);
                                                                link.setAttribute('href', url);
                                                                link.setAttribute('download', `servico-${exportData.codigo}-${exportData.nome.replace(/\s+/g, '_')}.csv`);
                                                                link.style.visibility = 'hidden';
                                                                document.body.appendChild(link);
                                                                link.click();
                                                                document.body.removeChild(link);
                                                            }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-green-100 dark:hover:bg-green-900/50"
                                                        >
                                                            <Download size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                                                            className="flex items-center gap-1.5 px-2 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors hover:bg-red-100 dark:hover:bg-red-900/50"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onRestore(s.id); }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all w-full justify-center"
                                                    >
                                                        <RotateCcw size={14} /> Restaurar Serviço
                                                    </button>
                                                )}
                                            </div>
                                            <ChevronRight size={18} className="text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Catalog Meta */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[32px] text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Tag size={16} />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-widest">Status do Catálogo</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Total Ativos</p>
                            <p className="text-xl font-bold">{services.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">Espécie Focada</p>
                            <p className="text-xl font-bold">{speciesFilter === 'Canino' ? 'Cães' : 'Gatos'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Modal */}
            <MobileFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={(filters) => {
                    setAdvancedFilters(filters);
                    setSearchTerm(filters.searchTerm);
                }}
                onReset={() => {
                    setAdvancedFilters({
                        dateRange: { start: '', end: '' },
                        valueRange: { min: 0, max: 0 },
                        status: '',
                        searchTerm: ''
                    });
                    setSearchTerm('');
                }}
                filters={advancedFilters}
                title="Filtrar Serviços"
                statuses={['ATIVO', 'INATIVO']}
            />

            {/* Data Import/Export Modal */}
            <DataImportExport
                isOpen={showDataImportExport}
                onClose={() => setShowDataImportExport(false)}
                exportType="services"
                data={services}
                onImport={(file) => {
                    console.log('Importing services file:', file);
                }}
            />
        </MobileShell>
    );
};
