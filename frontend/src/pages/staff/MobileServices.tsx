import { useState, useMemo } from 'react';
import {
    Tag, Search, Plus, Filter,
    MoreHorizontal, Edit2, Copy,
    Trash2, RotateCcw, Clock,
    ChevronRight, Dog, Cat,
    RefreshCcw, Grid, List
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';

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

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpecies = s.species === speciesFilter;
            return matchesSearch && matchesSpecies;
        });
    }, [services, searchTerm, speciesFilter]);

    return (
        <MobileShell
            title="Catálogo de Serviços"
            rightAction={
                <button
                    onClick={onNew}
                    className="p-2 text-blue-600 active:scale-90 transition-transform"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            }
        >
            <div className="space-y-6 pb-24">
                {/* Species Toggle */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-[20px] shadow-inner">
                    <button
                        onClick={() => setSpeciesFilter('Canino')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${speciesFilter === 'Canino'
                                ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm'
                                : 'text-gray-400'
                            }`}
                    >
                        <Dog size={18} /> Cães
                    </button>
                    <button
                        onClick={() => setSpeciesFilter('Felino')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${speciesFilter === 'Felino'
                                ? 'bg-white dark:bg-zinc-700 text-purple-600 shadow-sm'
                                : 'text-gray-400'
                            }`}
                    >
                        <Cat size={18} /> Gatos
                    </button>
                </div>

                {/* Search & Refresh */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="search"
                            placeholder="Buscar serviço..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium shadow-sm"
                        />
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
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Atualizando Catálogo...</p>
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
                        filteredServices.map((s) => (
                            <div
                                key={s.id}
                                className="mobile-card !p-4 flex flex-col gap-4 active:scale-[0.98] transition-transform"
                                onClick={() => onEdit(s)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-400 rounded text-[8px] font-black uppercase tracking-tighter">
                                                ID: {String((s.seqId || 0) + 999).padStart(4, '0')}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-[8px] font-black uppercase tracking-widest">
                                                {s.category || 'ESTÉTICA'}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase truncate">
                                            {s.name}
                                        </h3>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-lg font-black text-blue-600 leading-none">
                                            <span className="text-[10px] font-bold mr-0.5">R$</span>
                                            {s.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                            <Clock size={10} />
                                            {s.duration} min
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                    <div className="flex gap-2">
                                        {tab === 'active' ? (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                                >
                                                    <Edit2 size={14} /> Editar
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDuplicate(s); }}
                                                    className="flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-xl active:scale-95 transition-all"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                                                    className="flex items-center justify-center p-2 bg-red-50 text-red-500 rounded-xl active:scale-95 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRestore(s.id); }}
                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all w-full justify-center"
                                            >
                                                <RotateCcw size={14} /> Restaurar Serviço
                                            </button>
                                        )}
                                    </div>

                                    <ChevronRight size={18} className="text-gray-300" />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Catalog Meta */}
                <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-[32px] text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Tag size={16} />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest">Status do Catálogo</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">Total Ativos</p>
                            <p className="text-xl font-black">{services.length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter">Espécie Focada</p>
                            <p className="text-xl font-black">{speciesFilter === 'Canino' ? 'Cães' : 'Gatos'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </MobileShell>
    );
};
