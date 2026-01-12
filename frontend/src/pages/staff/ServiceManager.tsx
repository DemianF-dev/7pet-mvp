import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Tag,
    Copy,
    Upload,
    Cat,
    Dog,
    Search,
    CheckSquare,
    Square,
    RefreshCcw,
    Clock,
    LayoutGrid,
    List,
    RotateCcw,
    X,
    Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';

interface Service {
    id: string;
    seqId?: number;
    name: string;
    description: string;
    basePrice: number;
    duration: number;
    category: string;
    subcategory?: string;
    type?: string;
    coatType?: string;
    unit?: string;
    sizeLabel?: string;
    species: string;
    responsibleId?: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

type TabType = 'active' | 'trash';

export default function ServiceManager() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [speciesFilter, setSpeciesFilter] = useState<'Canino' | 'Felino'>('Canino');
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [users, setUsers] = useState<User[]>([]);
    const [tab, setTab] = useState<TabType>('active');

    // Advanced Filters
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [subcategoryFilter, setSubcategoryFilter] = useState<string>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [sizeFilter, setSizeFilter] = useState<string>('ALL');
    const [coatFilter, setCoatFilter] = useState<string>('ALL');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredServices.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredServices.map(s => s.id));
        }
    };


    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: 0,
        duration: 30,
        category: 'Banho',
        species: 'Canino',
        responsibleId: ''
    });

    useEffect(() => {
        fetchServices();
        fetchUsers();
    }, [tab]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/management/users');
            setUsers(response.data.filter((u: any) => ['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER'].includes(u.role)));
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const endpoint = tab === 'trash' ? '/services/trash' : '/services';
            const response = await api.get(endpoint);
            setServices(response.data);
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (service?: Service) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || '',
                basePrice: service.basePrice,
                duration: service.duration,
                category: service.category || 'Banho',
                species: service.species || 'Canino',
                responsibleId: service.responsibleId || ''
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                duration: 30,
                category: 'Banho',
                species: speciesFilter, // Default to current tab
                responsibleId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = editingService ? 'Deseja salvar as alterações neste serviço?' : 'Deseja cadastrar este novo serviço?';
        if (!window.confirm(msg)) return;
        try {
            if (editingService) {
                await api.patch(`/services/${editingService.id}`, formData);
            } else {
                await api.post('/services', formData);
            }
            fetchServices();
            setIsModalOpen(false);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id: string) => {
        const msg = tab === 'trash'
            ? 'ATENÇÃO: Esta ação não pode ser desfeita. Deseja excluir PERMANENTEMENTE este serviço?'
            : 'ATENÇÃO: Deseja mover este serviço para a lixeira?';

        if (!window.confirm(msg)) return;

        try {
            if (tab === 'trash') {
                await api.delete(`/services/${id}/permanent`);
            } else {
                await api.delete(`/services/${id}`);
            }
            fetchServices();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir serviço');
        }
    };

    const handleRestore = async (id: string) => {
        if (!window.confirm('Deseja restaurar este serviço?')) return;
        try {
            await api.patch(`/services/${id}/restore`);
            fetchServices();
        } catch (error) {
            alert('Erro ao restaurar serviço');
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        const action = tab === 'trash' ? 'excluir PERMANENTEMENTE' : 'mover para a lixeira';
        if (!window.confirm(`ATENÇÃO: Deseja realmente ${action} os ${selectedIds.length} serviços selecionados?`)) return;
        try {
            if (tab === 'trash') {
                for (const id of selectedIds) {
                    await api.delete(`/services/${id}/permanent`);
                }
            } else {
                await api.post('/services/bulk-delete', { ids: selectedIds });
            }
            fetchServices();
            setSelectedIds([]);
            setIsBulkMode(false);
        } catch (error) {
            alert('Erro ao processar serviços');
        }
    };

    const handleBulkRestore = async () => {
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} serviços da lixeira?`)) return;
        try {
            await api.post('/services/bulk-restore', { ids: selectedIds });
            fetchServices();
            setSelectedIds([]);
            setIsBulkMode(false);
        } catch (error) {
            alert('Erro ao restaurar serviços');
        }
    };

    const handleDuplicate = (service: Service) => {
        if (!window.confirm(`Deseja duplicar o serviço "${service.name}"?`)) return;
        setEditingService(null);
        setFormData({
            name: `${service.name} (Cópia)`,
            description: service.description,
            basePrice: service.basePrice,
            duration: service.duration,
            category: service.category,
            species: service.species,
            responsibleId: service.responsibleId || ''
        });
        setIsModalOpen(true);
    };

    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!window.confirm('Deseja realmente processar esta importação em massa?')) return;
        try {
            const lines = importText.split('\n').filter(l => l.trim().length > 0);
            const servicesToImport = lines.map(line => {
                const [name, description, price, duration, category] = line.split(';').map(s => s.trim());
                return {
                    name,
                    description: description || '',
                    basePrice: parseFloat(price.replace(',', '.')) || 0,
                    duration: parseInt(duration) || 30,
                    category: category || 'Geral',
                    species: speciesFilter // Import into current species tab
                };
            });

            if (servicesToImport.length === 0) {
                alert('Nenhum serviço identificado. Verifique o formato.');
                return;
            }

            const response = await api.post('/services/bulk', servicesToImport);
            alert(response.data.message);
            setIsImportModalOpen(false);
            setImportText('');
            fetchServices();
        } catch (error: any) {
            alert('Erro ao processar importação. Verifique o formato.');
        }
    };

    // Extract unique values for filters
    const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));
    const uniqueSubcategories = Array.from(new Set(services.map(s => s.subcategory).filter(Boolean)));
    const uniqueTypes = Array.from(new Set(services.map(s => s.type).filter(Boolean)));
    const uniqueSizes = Array.from(new Set(services.map(s => s.sizeLabel).filter(Boolean)));
    const uniqueCoats = Array.from(new Set(services.map(s => s.coatType).filter(Boolean)));

    const filteredServices = services.filter(s => {
        const matchesSpecies = s.species === speciesFilter;
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.description?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
        const matchesSubcategory = subcategoryFilter === 'ALL' || s.subcategory === subcategoryFilter;
        const matchesType = typeFilter === 'ALL' || s.type === typeFilter;
        const matchesSize = sizeFilter === 'ALL' || s.sizeLabel === sizeFilter;
        const matchesCoat = coatFilter === 'ALL' || s.coatType === coatFilter;

        return matchesSpecies && matchesSearch && matchesCategory && matchesSubcategory &&
            matchesType && matchesSize && matchesCoat;
    });

    const sortedServices = [...filteredServices];

    // Count active filters
    const activeFiltersCount = [
        categoryFilter !== 'ALL',
        subcategoryFilter !== 'ALL',
        typeFilter !== 'ALL',
        sizeFilter !== 'ALL',
        coatFilter !== 'ALL'
    ].filter(Boolean).length;


    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-4 md:p-10 pb-32">
                <header className="mb-10">
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                                <div className="h-[2px] w-6 bg-primary"></div>
                                CONFIGURAÇÕES DE SERVIÇOS
                            </div>
                            <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 w-fit">
                                <button
                                    onClick={() => { setSpeciesFilter('Canino'); setSelectedIds([]); }}
                                    className={`px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${speciesFilter === 'Canino' ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    <Dog size={16} /> Cães
                                </button>
                                <button
                                    onClick={() => { setSpeciesFilter('Felino'); setSelectedIds([]); }}
                                    className={`px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${speciesFilter === 'Felino' ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    <Cat size={16} /> Gatos
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => setIsBulkMode(!isBulkMode)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${isBulkMode ? 'bg-secondary text-white shadow-xl' : 'bg-white text-gray-400 hover:text-secondary shadow-sm'}`}
                            >
                                <CheckSquare size={14} strokeWidth={isBulkMode ? 3 : 2} />
                                <span className="uppercase tracking-[0.15em]">{isBulkMode ? 'Sair da Seleção' : 'Ações em Massa'}</span>
                            </button>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar serviço..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all font-bold"
                                />
                            </div>

                            {/* Advanced Filters Toggle */}
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all relative ${showAdvancedFilters ? 'bg-primary text-white shadow-xl' : 'bg-white text-gray-400 hover:text-primary shadow-sm'}`}
                            >
                                <Filter size={14} strokeWidth={showAdvancedFilters ? 3 : 2} />
                                <span className="uppercase tracking-[0.15em]">Filtros Avançados</span>
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => fetchServices()}
                                    className="p-3 bg-white rounded-2xl hover:bg-gray-50 text-secondary transition-all shadow-sm border border-gray-100"
                                    title="Atualizar Lista"
                                >
                                    <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
                                </button>

                                <button
                                    onClick={() => {
                                        setTab(tab === 'active' ? 'trash' : 'active');
                                        setSelectedIds([]);
                                    }}
                                    className={`p-3 rounded-2xl transition-all shadow-sm border border-gray-100 flex items-center gap-2 ${tab === 'trash' ? 'bg-red-50 text-red-500 border-red-100 ring-2 ring-red-100' : 'bg-white text-gray-400 hover:text-red-400'}`}
                                    title={tab === 'active' ? 'Ver Lixeira' : 'Voltar aos Serviços Ativos'}
                                >
                                    <Trash2 size={18} />
                                    {tab === 'trash' && <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Lixeira</span>}
                                </button>

                                {/* View Toggle */}
                                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                        title="Visualização em Lista"
                                    >
                                        <List size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('cards')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'cards' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                        title="Visualização em Cards"
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                </div>

                                <button onClick={() => setIsImportModalOpen(true)} className="bg-white hover:bg-gray-50 text-secondary px-6 py-3 rounded-2xl font-black border border-gray-100 flex items-center gap-2 text-xs tracking-widest transition-all">
                                    <Upload size={18} /> Importar
                                </button>
                                <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 uppercase text-xs tracking-widest transition-all">
                                    <Plus size={20} /> Novo Serviço
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                <AnimatePresence>
                    {(selectedIds.length > 0 || isBulkMode) && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-10 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleSelectAll}
                                    className="bg-white/10 hover:bg-white/20 text-[10px] font-black px-5 py-2 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    {selectedIds.length === filteredServices.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
                                </button>
                                <p className="text-sm font-black flex items-center gap-3 border-l border-white/10 pl-4">
                                    <span className="bg-primary px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary/20">{selectedIds.length}</span>
                                    itens no total
                                </p>
                            </div>
                            <div className="h-10 w-px bg-white/10 ml-auto"></div>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => { setSelectedIds([]); setIsBulkMode(false); }}
                                    className="text-[10px] font-black hover:text-gray-300 transition-colors uppercase tracking-[0.2em]"
                                >
                                    Cancelar
                                </button>
                                {tab === 'trash' ? (
                                    <>
                                        <button
                                            onClick={handleBulkRestore}
                                            disabled={selectedIds.length === 0}
                                            className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95 transition-all"
                                        >
                                            <RotateCcw size={18} /> Restaurar
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={selectedIds.length === 0}
                                            className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-95 transition-all"
                                        >
                                            <Trash2 size={18} /> Excluir Definitivamente
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleBulkDelete}
                                        disabled={selectedIds.length === 0}
                                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <Trash2 size={18} /> Apagar Agora
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Advanced Filters Panel */}
                <AnimatePresence>
                    {showAdvancedFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <Filter size={14} />
                                        Filtros Avançados
                                    </h3>
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={() => {
                                                setCategoryFilter('ALL');
                                                setSubcategoryFilter('ALL');
                                                setTypeFilter('ALL');
                                                setSizeFilter('ALL');
                                                setCoatFilter('ALL');
                                            }}
                                            className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-2 transition-colors"
                                        >
                                            <RotateCcw size={12} />
                                            Limpar Filtros
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {/* Category Filter */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            Categoria
                                        </label>
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="ALL">Todas</option>
                                            {uniqueCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Subcategory Filter */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            Subcategoria
                                        </label>
                                        <select
                                            value={subcategoryFilter}
                                            onChange={(e) => setSubcategoryFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="ALL">Todas</option>
                                            {uniqueSubcategories.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Type Filter */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            Tipo
                                        </label>
                                        <select
                                            value={typeFilter}
                                            onChange={(e) => setTypeFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="ALL">Todos</option>
                                            {uniqueTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Size Filter */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            Porte
                                        </label>
                                        <select
                                            value={sizeFilter}
                                            onChange={(e) => setSizeFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="ALL">Todos</option>
                                            {uniqueSizes.map(size => (
                                                <option key={size} value={size}>{size}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Coat Type Filter */}
                                    <div>
                                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                            Pelo
                                        </label>
                                        <select
                                            value={coatFilter}
                                            onChange={(e) => setCoatFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="ALL">Todos</option>
                                            {uniqueCoats.map(coat => (
                                                <option key={coat} value={coat}>{coat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Active Filters Display */}
                                {activeFiltersCount > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 mb-3">Filtros Ativos:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryFilter !== 'ALL' && (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                                                    Categoria: {categoryFilter}
                                                    <button onClick={() => setCategoryFilter('ALL')} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            )}
                                            {subcategoryFilter !== 'ALL' && (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                                                    Subcategoria: {subcategoryFilter}
                                                    <button onClick={() => setSubcategoryFilter('ALL')} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            )}
                                            {typeFilter !== 'ALL' && (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                                                    Tipo: {typeFilter}
                                                    <button onClick={() => setTypeFilter('ALL')} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            )}
                                            {sizeFilter !== 'ALL' && (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                                                    Porte: {sizeFilter}
                                                    <button onClick={() => setSizeFilter('ALL')} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            )}
                                            {coatFilter !== 'ALL' && (
                                                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black">
                                                    Pelo: {coatFilter}
                                                    <button onClick={() => setCoatFilter('ALL')} className="hover:text-red-500 transition-colors">
                                                        <X size={12} />
                                                    </button>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content - Table or Cards View */}
                {viewMode === 'table' ? (
                    <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-sm border border-gray-100 overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 md:px-8 py-4 md:py-6 w-12 text-center md:text-left">
                                        {(isBulkMode || selectedIds.length > 0) && (
                                            <button
                                                onClick={handleSelectAll}
                                                className="text-gray-300 hover:text-primary transition-colors"
                                            >
                                                {selectedIds.length > 0 && selectedIds.length === sortedServices.length ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                            </button>
                                        )}
                                    </th>
                                    <th className="px-3 md:px-8 py-4 md:py-6">Serviço</th>
                                    <th className="px-3 md:px-8 py-4 md:py-6">Categoria</th>
                                    <th className="px-3 md:px-8 py-4 md:py-6 text-center">Espécie</th>
                                    <th className="px-3 md:px-8 py-4 md:py-6 text-center">Duração</th>
                                    <th className="px-3 md:px-8 py-4 md:py-6 text-right">Preço</th>
                                    <th className="px-3 md:px-8 py-4 md:py-6 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <RefreshCcw className="animate-spin text-primary mx-auto" size={48} />
                                        </td>
                                    </tr>
                                ) : sortedServices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <div className="bg-gray-50 rounded-[40px] p-20 border-2 border-dashed border-gray-100">
                                                <Tag className="mx-auto text-gray-200 mb-4" size={64} />
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Nenhum serviço encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : sortedServices.map(service => (
                                    <tr
                                        key={service.id}
                                        className={`hover:bg-gray-50/50 transition-all group ${selectedIds.includes(service.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        <td className="px-3 md:px-8 py-4 md:py-6" onClick={(e) => e.stopPropagation()}>
                                            {(isBulkMode || selectedIds.includes(service.id)) && (
                                                <button
                                                    onClick={(e) => toggleSelect(service.id, e)}
                                                    className={`transition-all ${selectedIds.includes(service.id) ? 'text-primary' : 'text-gray-200 group-hover:text-gray-400'}`}
                                                >
                                                    {selectedIds.includes(service.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-3 md:px-8 py-4 md:py-6">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center text-primary shrink-0">
                                                    <Tag size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                                                        <h3 className="font-black text-secondary uppercase text-[11px] md:text-sm truncate max-w-[120px] md:max-w-none">{service.name}</h3>
                                                        <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-md uppercase tracking-widest w-fit">
                                                            SR-{String((service.seqId || 0) + 999).padStart(4, '0')}
                                                        </span>
                                                    </div>
                                                    {service.description && (
                                                        <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1 hidden sm:block">{service.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-8 py-4 md:py-6">
                                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                                {service.category}
                                            </span>
                                        </td>
                                        <td className="px-3 md:px-8 py-4 md:py-6 text-center">
                                            <div className="flex justify-center">
                                                {service.species === 'Canino' ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] md:text-[10px] font-black">
                                                        <Dog size={10} /> <span className="hidden md:inline">Canino</span>
                                                    </span>
                                                ) : service.species === 'Felino' ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-[9px] md:text-[10px] font-black">
                                                        <Cat size={10} /> <span className="hidden md:inline">Felino</span>
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-lg text-[9px] md:text-[10px] font-black">
                                                        <span className="hidden md:inline">Ambos</span><span className="md:hidden">A</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-8 py-4 md:py-6 text-center">
                                            <div className="flex items-center justify-center gap-1 text-gray-600">
                                                <Clock size={12} />
                                                <span className="font-bold text-[10px] md:text-sm">{service.duration}<span className="hidden md:inline"> min</span><span className="md:hidden">m</span></span>
                                            </div>
                                        </td>
                                        <td className="px-3 md:px-8 py-4 md:py-6 text-right">
                                            <span className="text-sm md:text-lg font-black text-primary whitespace-nowrap">
                                                R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-3 md:px-8 py-4 md:py-6 text-right">
                                            <div className="flex justify-end gap-1">
                                                {tab === 'trash' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRestore(service.id)}
                                                            className="p-2 hover:bg-orange-50 rounded-xl transition-colors"
                                                            title="Restaurar"
                                                        >
                                                            <RotateCcw size={16} className="text-orange-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(service.id)}
                                                            className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                                                            title="Excluir Permanentemente"
                                                        >
                                                            <Trash2 size={16} className="text-red-600" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenModal(service)}
                                                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 size={16} className="text-gray-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDuplicate(service)}
                                                            className="p-2 hover:bg-blue-50 rounded-xl transition-colors"
                                                            title="Duplicar"
                                                        >
                                                            <Copy size={16} className="text-blue-400" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(service.id)}
                                                            className="p-2 hover:bg-red-50 rounded-xl transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} className="text-red-400" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isLoading ? (
                            <div className="col-span-full py-20 text-center">
                                <RefreshCcw className="animate-spin text-primary mx-auto" size={48} />
                            </div>
                        ) : sortedServices.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px] bg-white">
                                <Tag className="mx-auto text-gray-200 mb-4" size={64} />
                                <p className="text-gray-400 font-bold">Nenhum serviço encontrado.</p>
                            </div>
                        ) : sortedServices.map(service => (
                            <motion.div
                                layout
                                key={service.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] shadow-sm border border-gray-100 hover:border-primary/20 transition-all relative overflow-hidden ${selectedIds.includes(service.id) ? 'ring-2 ring-primary' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Tag size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        {(isBulkMode || selectedIds.includes(service.id)) && (
                                            <button
                                                onClick={(e) => toggleSelect(service.id, e)}
                                                className={`p-2 rounded-xl transition-all shadow-md border ${selectedIds.includes(service.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100 hover:text-primary'}`}
                                            >
                                                {selectedIds.includes(service.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                            </button>
                                        )}
                                        {tab === 'trash' ? (
                                            <>
                                                <button onClick={() => handleRestore(service.id)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors" title="Restaurar">
                                                    <RotateCcw size={16} className="text-orange-400" />
                                                </button>
                                                <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors" title="Excluir Permanentemente">
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => handleOpenModal(service)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Editar">
                                                    <Edit2 size={16} className="text-gray-400" />
                                                </button>
                                                <button onClick={() => handleDuplicate(service)} className="p-2 hover:bg-blue-50 rounded-xl transition-colors" title="Duplicar">
                                                    <Copy size={16} className="text-blue-400" />
                                                </button>
                                                <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors" title="Excluir">
                                                    <Trash2 size={16} className="text-red-400" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-sm md:text-lg font-black text-secondary mb-1 uppercase truncate">{service.name}</h3>
                                <p className="text-[10px] font-black text-primary mb-1">SR-{String((service.seqId || 0) + 999).padStart(4, '0')}</p>
                                <p className="text-gray-400 text-[10px] md:text-xs font-bold mb-4 line-clamp-2 h-8">{service.description || 'Sem descrição'}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                        <Clock size={12} />
                                        <span>{service.duration} min</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-primary">R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Service Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-secondary/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-8 w-full max-w-lg relative z-10 shadow-2xl"
                        >
                            <h2 className="text-3xl font-black text-secondary mb-8">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Serviço</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Ex: Banho & Tosa M"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                                        placeholder="Detalhes do que inclui o serviço..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço Base</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.basePrice}
                                                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                                                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duração (min)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Espécie</label>
                                    <div className="flex gap-4 p-2 bg-gray-50 rounded-2xl">
                                        <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                                            <input
                                                type="radio"
                                                name="species"
                                                value="Canino"
                                                checked={formData.species === 'Canino'}
                                                onChange={() => setFormData({ ...formData, species: 'Canino' })}
                                                className="hidden"
                                            />
                                            <Dog size={16} className={formData.species === 'Canino' ? 'text-blue-500' : 'text-gray-300'} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.species === 'Canino' ? 'text-secondary' : 'text-gray-300'}`}>Canino</span>
                                        </label>
                                        <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all has-[:checked]:bg-white has-[:checked]:shadow-sm">
                                            <input
                                                type="radio"
                                                name="species"
                                                value="Felino"
                                                checked={formData.species === 'Felino'}
                                                onChange={() => setFormData({ ...formData, species: 'Felino' })}
                                                className="hidden"
                                            />
                                            <Cat size={16} className={formData.species === 'Felino' ? 'text-purple-500' : 'text-gray-300'} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.species === 'Felino' ? 'text-secondary' : 'text-gray-300'}`}>Felino</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional Responsável (Padrão)</label>
                                    <select
                                        value={formData.responsibleId}
                                        onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    >
                                        <option value="">Nenhum (Rotativo)</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 italic px-1">Este profissional será o responsável padrão ao selecionar este serviço nos orçamentos.</p>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">Salvar Serviço</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Import Modal */}
                {
                    isImportModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/60 backdrop-blur-md" onClick={() => setIsImportModalOpen(false)}></div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white rounded-[40px] p-8 w-full max-w-2xl relative z-10 shadow-2xl"
                            >
                                <h2 className="text-3xl font-black text-secondary mb-2">Importação em Massa</h2>
                                <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">Cole os serviços abaixo, um por linha. Formato: <br />
                                    <code className="bg-gray-100 px-3 py-1 rounded-lg text-primary mt-2 block lowercase font-mono">Nome; Descrição; Preço; Duração(min); Categoria</code>
                                </p>

                                <form onSubmit={handleBulkImport} className="space-y-6">
                                    <textarea
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-3xl px-8 py-6 text-xs font-mono min-h-[250px] focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder={`Banho Simples; Banho tradicional; 50.00; 45; Banho\nTosa Higiênica; Corte íntimo e patinhas; 30.00; 20; Tosa`}
                                    />
                                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                                        <button type="button" onClick={() => setIsImportModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                                        <button type="submit" className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">Processar Importação</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }
            </main >
        </div >
    );
}
