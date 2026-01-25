
import { Search as SearchIcon, RotateCcw, ArrowUpDown, Filter } from 'lucide-react';
import { DIVISIONS, DIVISION_LABELS, getDivisionBgClass, getDivisionTextClass } from '../../../../constants/divisions';

interface UserFiltersProps {
    searchTerm: string;
    filterDivision: string;
    sortBy: 'name' | 'date' | 'id';
    sortOrder: 'asc' | 'desc';
    itemsPerPage: number;
    isLoading: boolean;
    onSearchChange: (term: string) => void;
    onFilterChange: (division: string) => void;
    onSortByChange: (sortBy: 'name' | 'date' | 'id') => void;
    onSortOrderChange: (order: 'asc' | 'desc') => void;
    onItemsPerPageChange: (items: number) => void;
    onRefresh: () => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
    searchTerm,
    filterDivision,
    sortBy,
    sortOrder,
    itemsPerPage,
    isLoading,
    onSearchChange,
    onFilterChange,
    onSortByChange,
    onSortOrderChange,
    onItemsPerPageChange,
    onRefresh
}) => {
    return (
        <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Buscar colaboradores..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-white border border-transparent rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all font-medium"
                />
            </div>

            <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 overflow-x-auto no-scrollbar flex-1 min-w-0">
                {[
                    { division: 'ALL', label: 'Todos', color: 'bg-gray-200 text-gray-700' },
                    { division: DIVISIONS.SPA, label: DIVISION_LABELS.SPA, color: getDivisionBgClass(DIVISIONS.SPA) + ' ' + getDivisionTextClass(DIVISIONS.SPA) },
                    { division: DIVISIONS.COMERCIAL, label: DIVISION_LABELS.COMERCIAL, color: getDivisionBgClass(DIVISIONS.COMERCIAL) + ' ' + getDivisionTextClass(DIVISIONS.COMERCIAL) },
                    { division: DIVISIONS.LOGISTICA, label: DIVISION_LABELS.LOGISTICA, color: getDivisionBgClass(DIVISIONS.LOGISTICA) + ' ' + getDivisionTextClass(DIVISIONS.LOGISTICA) },
                    { division: DIVISIONS.GERENCIA, label: DIVISION_LABELS.GERENCIA, color: getDivisionBgClass(DIVISIONS.GERENCIA) + ' ' + getDivisionTextClass(DIVISIONS.GERENCIA) },
                    { division: DIVISIONS.DIRETORIA, label: DIVISION_LABELS.DIRETORIA, color: getDivisionBgClass(DIVISIONS.DIRETORIA) + ' ' + getDivisionTextClass(DIVISIONS.DIRETORIA) },
                    { division: DIVISIONS.ADMIN, label: DIVISION_LABELS.ADMIN, color: getDivisionBgClass(DIVISIONS.ADMIN) + ' ' + getDivisionTextClass(DIVISIONS.ADMIN) },
                ].map(filter => (
                    <button
                        key={filter.division}
                        onClick={() => onFilterChange(filter.division)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterDivision === filter.division
                            ? filter.color + ' shadow-md'
                            : 'text-gray-400 hover:text-secondary hover:bg-gray-50'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onRefresh}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all shadow-sm group active:rotate-180 duration-500"
                    title="Recarregar Lista"
                >
                    <RotateCcw size={16} className={isLoading ? 'animate-spin text-primary' : ''} />
                </button>

                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        onItemsPerPageChange(Number(e.target.value));
                    }}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-gray-600 hover:border-primary transition-colors shadow-sm text-xs font-bold cursor-pointer"
                >
                    <option value={30}>30 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                    <option value={200}>200 por página</option>
                </select>

                <button
                    onClick={() => onSortByChange(sortBy === 'name' ? 'date' : sortBy === 'date' ? 'id' : 'name')}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-secondary transition-colors shadow-sm flex items-center gap-2"
                >
                    <ArrowUpDown size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{sortBy === 'name' ? 'Nome' : sortBy === 'date' ? 'Data' : 'ID'}</span>
                </button>

                <button
                    onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-secondary transition-colors shadow-sm"
                >
                    <Filter size={16} className={sortOrder === 'desc' ? 'rotate-180' : ''} />
                </button>
            </div>
        </div>
    );
};