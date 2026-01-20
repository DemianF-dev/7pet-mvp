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
    Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import toast from 'react-hot-toast';
import ResponsiveTable, { Column } from '../../components/system/ResponsiveTable';
import { Container, Stack } from '../../components/layout/LayoutHelpers';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import IconButton from '../../components/ui/IconButton';


interface Service {
    id: string;
    seqId?: number;
    name: string;
    description: string;
    basePrice: number;
    duration: number;
    category: string;
    subcategory?: string;
    type?: 'Banho' | 'Tosa' | 'Outros';
    bathCategory?: 'Tradicional' | 'Hidratante';
    groomingType?: string;
    coatType?: string;
    unit?: string;
    sizeLabel?: string;
    species: string;
    responsibleId?: string;
    notes?: string;
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
    const [isCopying, setIsCopying] = useState(false);
    const [autoGenerateName, setAutoGenerateName] = useState(true);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkEditData, setBulkEditData] = useState({
        basePrice: '',
        duration: '',
        category: '',
    });

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
        basePrice: 0 as number | '',
        duration: 30 as number | '',
        category: 'Estética',
        type: 'Banho' as 'Banho' | 'Tosa' | 'Outros',
        bathCategory: 'Tradicional' as 'Tradicional' | 'Hidratante',
        groomingType: 'Higiênica',
        species: 'Canino',
        sizeLabel: 'Médio',
        coatType: 'Curto',
        notes: '',
        responsibleId: ''
    });

    useEffect(() => {
        fetchServices();
        fetchUsers();
    }, [tab]);

    // Auto-generate name from fields
    useEffect(() => {
        if (autoGenerateName && isModalOpen && !editingService && !isCopying) {
            const speciesText = formData.species === 'Canino' ? 'Cão' : 'Gato';
            let name = '';

            if (formData.type === 'Banho') {
                name = `Banho ${formData.bathCategory} ${speciesText} ${formData.sizeLabel} - Pelagem ${formData.coatType}`;
            } else if (formData.type === 'Tosa') {
                name = `Tosa ${formData.groomingType} ${speciesText} ${formData.sizeLabel}`;
            } else {
                name = `Serviço ${speciesText} Personalizado`;
            }

            setFormData(prev => ({ ...prev, name }));
        }
    }, [formData.type, formData.bathCategory, formData.groomingType, formData.species, formData.sizeLabel, formData.coatType, autoGenerateName, isModalOpen, editingService, isCopying]);

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
            setIsLoading(false);
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (service?: Service) => {
        setIsCopying(false);
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || '',
                basePrice: service.basePrice,
                duration: service.duration,
                category: service.category || 'Estética',
                type: (service.type as any) || 'Banho',
                bathCategory: (service.bathCategory as any) || 'Tradicional',
                groomingType: service.groomingType || 'Higiênica',
                species: service.species || 'Canino',
                sizeLabel: service.sizeLabel || 'Médio',
                coatType: service.coatType || 'Curto',
                notes: service.notes || '',
                responsibleId: service.responsibleId || ''
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                duration: 30,
                category: 'Estética',
                type: 'Banho',
                bathCategory: 'Tradicional',
                groomingType: 'Higiênica',
                species: speciesFilter, // Default to current tab
                sizeLabel: 'Médio',
                coatType: 'Curto',
                notes: '',
                responsibleId: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        console.log('[ServiceManager] Submitting form...', formData);

        // Manual validation
        if (!formData.name) {
            toast.error('O nome do serviço é obrigatório');
            return;
        }

        const payload = {
            ...formData,
            basePrice: formData.basePrice === '' ? 0 : formData.basePrice,
            duration: formData.duration === '' ? 0 : formData.duration
        };

        const savePromise = (async () => {
            if (editingService) {
                await api.patch(`/services/${editingService.id}`, payload);
            } else {
                await api.post('/services', payload);
            }
            fetchServices();
            setIsModalOpen(false);
        })();

        toast.promise(savePromise, {
            loading: 'Salvando serviço...',
            success: 'Serviço salvo com sucesso!',
            error: (err) => {
                console.error('[ServiceManager] Save error:', err);
                return `Erro ao salvar: ${err.response?.data?.error || err.message || 'Erro desconhecido'}`;
            }
        });
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
            toast.success(tab === 'trash' ? 'Serviço excluído permanentemente.' : 'Serviço movido para a lixeira.');
        } catch (error: any) {
            console.error('Erro ao excluir:', error);
            toast.error(error.response?.data?.error || 'Erro ao excluir serviço');
        }
    };

    const handleRestore = async (id: string) => {
        if (!window.confirm('Deseja restaurar este serviço?')) return;
        try {
            await api.patch(`/services/${id}/restore`);
            fetchServices();
            toast.success('Serviço restaurado!');
        } catch (error) {
            toast.error('Erro ao restaurar serviço');
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIds.length === 0) return;

        try {
            const data: any = {};
            if (bulkEditData.basePrice) data.basePrice = parseFloat(bulkEditData.basePrice);
            if (bulkEditData.duration) data.duration = parseInt(bulkEditData.duration);
            if (bulkEditData.category) data.category = bulkEditData.category;

            if (Object.keys(data).length === 0) {
                alert('Preencha ao menos um campo para atualizar.');
                return;
            }

            await api.post('/services/bulk-update', {
                ids: selectedIds,
                data
            });

            toast.success(`${selectedIds.length} serviços atualizados com sucesso!`);
            setIsBulkEditModalOpen(false);
            setBulkEditData({ basePrice: '', duration: '', category: '' });
            setSelectedIds([]);
            setIsBulkMode(false);
            fetchServices();
        } catch (error) {
            toast.error('Erro ao atualizar serviços em massa.');
        }
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
            toast.success('Ação em massa concluída.');
        } catch (error) {
            toast.error('Erro ao processar serviço(s)');
        }
    };

    const handleBulkRestore = async () => {
        if (!window.confirm(`Deseja restaurar ${selectedIds.length} serviços da lixeira?`)) return;
        try {
            await api.post('/services/bulk-restore', { ids: selectedIds });
            fetchServices();
            setSelectedIds([]);
            setIsBulkMode(false);
            toast.success('Serviços restaurados.');
        } catch (error) {
            toast.error('Erro ao restaurar serviços');
        }
    };

    const handleDuplicate = (service: Service) => {
        // Removed blocking confirm to allow editing first
        setEditingService(null);
        setIsCopying(true);
        setFormData({
            name: `${service.name} (Cópia)`,
            description: service.description,
            basePrice: service.basePrice,
            duration: service.duration,
            category: service.category,
            type: service.type as any,
            bathCategory: service.bathCategory as any,
            groomingType: service.groomingType,
            species: service.species,
            sizeLabel: service.sizeLabel || 'Médio',
            coatType: service.coatType || 'Curto',
            notes: service.notes || '',
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
                const parts = line.split(';').map(s => s.trim());
                if (parts.length >= 3) {
                    const [name, price, duration, type, size, extra, bathCat, category, description] = parts;

                    const serviceType = (type || 'Banho') as 'Banho' | 'Tosa' | 'Outros';

                    return {
                        name: (name === '-' || !name) ? 'AUTOMATICO' : name,
                        description: description || '',
                        basePrice: parseFloat(price.replace(',', '.')) || 0,
                        duration: parseInt(duration) || 30,
                        type: serviceType,
                        bathCategory: (bathCat || 'Tradicional') as any,
                        species: speciesFilter,
                        sizeLabel: size || 'Médio',
                        coatType: serviceType === 'Banho' ? (extra || 'Curto') : 'Curto',
                        groomingType: serviceType === 'Tosa' ? (extra || 'Higiênica') : 'Higiênica',
                        category: serviceType === 'Outros' ? (category || 'Geral') : 'Estética'
                    };
                }
                return null;
            }).filter(Boolean);

            if (servicesToImport.length === 0) {
                alert('Nenhum serviço identificado. Verifique o formato indicado no cabeçalho.');
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
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            s.name.toLowerCase().includes(searchLower) ||
            s.description?.toLowerCase().includes(searchLower) ||
            s.category?.toLowerCase().includes(searchLower) ||
            s.sizeLabel?.toLowerCase().includes(searchLower) ||
            s.coatType?.toLowerCase().includes(searchLower) ||
            s.species.toLowerCase().includes(searchLower);

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

    const columns: Column<Service>[] = [
        {
            header: '',
            key: 'selection',
            className: 'w-12',
            render: (service) => (
                (isBulkMode || selectedIds.includes(service.id)) && (
                    <button
                        onClick={(e) => toggleSelect(service.id, e)}
                        className={`transition-all ${selectedIds.includes(service.id) ? 'text-primary' : 'text-gray-200 hover:text-gray-400'}`}
                    >
                        {selectedIds.includes(service.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                    </button>
                )
            )
        },
        {
            header: 'Serviço',
            key: 'name',
            render: (service) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <Tag size={16} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-1">
                            <h3 className="font-black text-secondary uppercase text-[11px] md:text-sm truncate">{service.name}</h3>
                            <span className="text-[9px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-md uppercase tracking-widest w-fit">
                                SR-{String((service.seqId || 0) + 999).padStart(4, '0')}
                            </span>
                        </div>
                        {service.description && (
                            <p className="text-[10px] md:text-xs text-gray-400 line-clamp-1 hidden sm:block">{service.description}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            header: 'Categoria',
            key: 'category',
            render: (service) => (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {service.category}
                </span>
            )
        },
        {
            header: 'Espécie',
            key: 'species',
            className: 'text-center',
            render: (service) => (
                <div className="flex justify-center">
                    {service.species === 'Canino' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black">
                            <Dog size={10} /> <span className="hidden md:inline">Canino</span>
                        </span>
                    ) : service.species === 'Felino' ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-black">
                            <Cat size={10} /> <span className="hidden md:inline">Felino</span>
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-black">
                            <span className="hidden md:inline">Ambos</span><span className="md:hidden">A</span>
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Duração',
            key: 'duration',
            className: 'text-center',
            render: (service) => (
                <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Clock size={12} />
                    <span className="font-bold text-sm">{service.duration}<span className="hidden md:inline"> min</span></span>
                </div>
            )
        },
        {
            header: 'Preço',
            key: 'basePrice',
            className: 'text-right',
            render: (service) => (
                <span className="text-lg font-black text-primary whitespace-nowrap">
                    R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            header: 'Ações',
            key: 'actions',
            className: 'text-right',
            render: (service) => (
                <div className="flex justify-end gap-1">
                    {tab === 'trash' ? (
                        <>
                            <button onClick={() => handleRestore(service.id)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors" title="Restaurar"><RotateCcw size={16} className="text-orange-400" /></button>
                            <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors" title="Excluir Permanentemente"><Trash2 size={16} className="text-red-600" /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleOpenModal(service)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Editar"><Edit2 size={16} className="text-gray-400" /></button>
                            <button onClick={() => handleDuplicate(service)} className="p-2 hover:bg-blue-50 rounded-xl transition-colors" title="Duplicar"><Copy size={16} className="text-blue-400" /></button>
                            <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors" title="Excluir"><Trash2 size={16} className="text-red-400" /></button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <Container>
            <Stack gap={10} className="py-10">
                <header>
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
                                    <>
                                        <button
                                            onClick={() => setIsBulkEditModalOpen(true)}
                                            disabled={selectedIds.length === 0}
                                            className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl bg-primary hover:bg-primary-dark text-white shadow-primary/20 active:scale-95 transition-all"
                                        >
                                            <Settings size={18} /> Editar em Massa
                                        </button>
                                        <button
                                            onClick={handleBulkDelete}
                                            disabled={selectedIds.length === 0}
                                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            <Trash2 size={18} /> Apagar Agora
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Modal de Edição em Massa */}
                <AnimatePresence>
                    {isBulkEditModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsBulkEditModalOpen(false)}
                                className="absolute inset-0 bg-secondary/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="bg-white rounded-[40px] p-8 w-full max-w-lg relative z-10 shadow-2xl"
                            >
                                <h2 className="text-2xl font-black text-secondary mb-2 uppercase tracking-tighter">Edição em Massa</h2>
                                <p className="text-gray-400 text-xs font-bold mb-8 uppercase tracking-widest">
                                    Alterando <span className="text-primary">{selectedIds.length}</span> serviços selecionados. <br />
                                    <span className="text-[10px] italic">Preencha apenas o que deseja alterar.</span>
                                </p>

                                <form onSubmit={handleBulkUpdate} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Novo Preço (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={bulkEditData.basePrice}
                                            onChange={(e) => setBulkEditData({ ...bulkEditData, basePrice: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Deixe vazio para não alterar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Duração (min)</label>
                                        <input
                                            type="number"
                                            value={bulkEditData.duration}
                                            onChange={(e) => setBulkEditData({ ...bulkEditData, duration: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Deixe vazio para não alterar"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nova Categoria</label>
                                        <input
                                            value={bulkEditData.category}
                                            onChange={(e) => setBulkEditData({ ...bulkEditData, category: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Ex: Premium, Promocional..."
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-6 border-t border-gray-100">
                                        <button type="button" onClick={() => setIsBulkEditModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                                        <button type="submit" className="flex-1 px-8 py-4 rounded-2xl font-black text-white bg-primary uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Salvar Alterações</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
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
                    <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden p-4 md:p-8">
                        <ResponsiveTable
                            columns={columns}
                            data={sortedServices}
                            isLoading={isLoading}
                            keyExtractor={(s) => s.id}
                            onRowClick={tab === 'active' ? handleOpenModal : undefined}
                            selectable={isBulkMode}
                            selectedIds={selectedIds}
                            onSelectRow={toggleSelect}
                            onSelectAll={handleSelectAll}
                            emptyMessage="Nenhum serviço encontrado para estes filtros."
                            renderMobileCard={(service) => (
                                <Card
                                    variant="glass"
                                    className={`p-4 md:p-6 rounded-[32px] border transition-all relative overflow-hidden ${selectedIds.includes(service.id) ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                            <Tag size={24} />
                                        </div>
                                        <div className="flex gap-2">
                                            {(isBulkMode || selectedIds.includes(service.id)) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleSelect(service.id, e); }}
                                                    className={`p-2 rounded-xl transition-all shadow-sm border ${selectedIds.includes(service.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100'}`}
                                                >
                                                    {selectedIds.includes(service.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                                </button>
                                            )}
                                            {tab === 'trash' ? (
                                                <button onClick={(e) => { e.stopPropagation(); handleRestore(service.id); }} className="p-2 hover:bg-orange-50 rounded-xl transition-colors"><RotateCcw size={16} className="text-orange-400" /></button>
                                            ) : (
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenModal(service); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Edit2 size={16} className="text-gray-400" /></button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-sm md:text-lg font-black text-secondary mb-1 uppercase truncate">{service.name}</h3>
                                    <p className="text-[10px] font-black text-primary mb-1">SR-{String((service.seqId || 0) + 999).padStart(4, '0')}</p>

                                    <div className="flex items-center gap-2 mt-4 mb-4">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${service.species === 'Canino' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                            {service.species === 'Canino' ? '🐶 Cão' : '🐱 Gato'}
                                        </span>
                                        {service.sizeLabel && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">📏 {service.sizeLabel}</span>}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase">
                                            <Clock size={12} />
                                            <span>{service.duration} min</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-black text-primary">R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedServices.map(service => (
                            <Card
                                key={service.id}
                                variant="glass"
                                className={`p-6 rounded-[32px] border transition-all hover:scale-[1.02] ${selectedIds.includes(service.id) ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                                onClick={() => tab === 'active' && handleOpenModal(service)}
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-primary/10 rounded-[20px] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Tag size={28} />
                                    </div>
                                    <div className="flex gap-2">
                                        {(isBulkMode || selectedIds.includes(service.id)) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleSelect(service.id, e); }}
                                                className={`p-2 rounded-xl transition-all shadow-sm border ${selectedIds.includes(service.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100'}`}
                                            >
                                                {selectedIds.includes(service.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                            </button>
                                        )}
                                        <div className="flex gap-1">
                                            {tab === 'trash' ? (
                                                <IconButton icon={RotateCcw} variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRestore(service.id); }} aria-label="Restaurar" />
                                            ) : (
                                                <IconButton icon={Edit2} variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenModal(service); }} aria-label="Editar" />
                                            )}
                                            <IconButton icon={Trash2} variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(service.id); }} aria-label="Excluir" />
                                        </div>
                                    </div>
                                </div>
                                <h3 className="text-xl font-black text-secondary leading-tight mb-1 uppercase">{service.name}</h3>
                                <p className="text-[10px] font-black text-primary mb-4 tracking-widest">SR-{String((service.seqId || 0) + 999).padStart(4, '0')}</p>

                                <div className="flex items-center gap-2 mb-6">
                                    <Badge variant={service.species === 'Canino' ? 'info' : 'warning'} size="sm">
                                        {service.species === 'Canino' ? '🐶 Cão' : '🐱 Gato'}
                                    </Badge>
                                    <Badge variant="neutral" size="sm">{service.sizeLabel}</Badge>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border-subtle)]">
                                    <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase">
                                        <Clock size={14} />
                                        <span>{service.duration} min</span>
                                    </div>
                                    <span className="text-2xl font-black text-primary">R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Service Modal */}
                {
                    isModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="bg-white rounded-[40px] p-8 w-full max-w-lg relative z-10 shadow-2xl"
                            >
                                <h2 className="text-3xl font-black text-secondary mb-8">{editingService ? 'Editar Serviço' : (isCopying ? 'Duplicar Serviço' : 'Novo Serviço')}</h2>
                                <form onSubmit={(e) => e.preventDefault()} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Espécie</label>
                                            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, species: 'Canino' })}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl transition-all ${formData.species === 'Canino' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-400 opacity-50'}`}
                                                >
                                                    <Dog size={16} className={formData.species === 'Canino' ? 'text-blue-500' : ''} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Cão</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, species: 'Felino' })}
                                                    className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl transition-all ${formData.species === 'Felino' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'text-gray-400 opacity-50'}`}
                                                >
                                                    <Cat size={16} className={formData.species === 'Felino' ? 'text-purple-500' : ''} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Gato</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Serviço</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            >
                                                <option value="Banho">🛁 Banho</option>
                                                <option value="Tosa">✂️ Tosa</option>
                                                <option value="Outros">🌟 Outros Serviços</option>
                                            </select>
                                        </div>
                                    </div>


                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Porte</label>
                                            <select
                                                value={formData.sizeLabel}
                                                onChange={(e) => setFormData({ ...formData, sizeLabel: e.target.value })}
                                                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                            >
                                                {formData.type === 'Outros' && (
                                                    <option value="Todos">✨ Todos os Portes</option>
                                                )}
                                                <option value="Mini">Mini (Toy)</option>
                                                <option value="Pequeno">Pequeno</option>
                                                <option value="Médio">Médio</option>
                                                <option value="Grande">Grande</option>
                                                <option value="Gigante">Gigante</option>
                                                <option value="XGigante">XGigante (Acima de 50kg)</option>
                                                <option value="Especial">Especial / Por Peso</option>
                                            </select>
                                        </div>

                                        {formData.type === 'Banho' && (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria do Banho</label>
                                                    <select
                                                        value={formData.bathCategory}
                                                        onChange={(e) => setFormData({ ...formData, bathCategory: e.target.value as any })}
                                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                                    >
                                                        <option value="Tradicional">Tradicional</option>
                                                        <option value="Hidratante">Hidratante</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pelagem</label>
                                                    <select
                                                        value={formData.coatType}
                                                        onChange={(e) => setFormData({ ...formData, coatType: e.target.value })}
                                                        className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                                    >
                                                        <option value="Curto">Curto</option>
                                                        <option value="Médio">Médio</option>
                                                        <option value="Longo">Longo</option>
                                                        <option value="Densa">Densa / Com Subpelo</option>
                                                        <option value="Primitiva">Primitiva (Ex: Husky)</option>
                                                        <option value="Enrolada">Enrolada (Ex: Poodle)</option>
                                                    </select>
                                                </div>
                                            </>
                                        )}

                                        {formData.type === 'Tosa' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipo de Tosa</label>
                                                <select
                                                    value={formData.groomingType}
                                                    onChange={(e) => setFormData({ ...formData, groomingType: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                                >
                                                    <option value="Higiênica">Higiênica</option>
                                                    <option value="Estetica Geral">Estética Geral</option>
                                                    <option value="Raça">Padrão da Raça</option>
                                                    <option value="Bebê">Tosa Bebê</option>
                                                </select>
                                            </div>
                                        )}

                                        {formData.type === 'Outros' && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria Personalizada</label>
                                                <input
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                                    placeholder="Ex: SPA, Táxi Dog..."
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome de Exibição / Sugestão</label>
                                            <button
                                                type="button"
                                                onClick={() => setAutoGenerateName(!autoGenerateName)}
                                                className={`text-[9px] font-black uppercase px-2 py-1 rounded-md transition-all ${autoGenerateName ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}
                                            >
                                                {autoGenerateName ? 'Auto-Gerar ON' : 'Manual'}
                                            </button>
                                        </div>
                                        <input
                                            value={formData.name}
                                            onChange={(e) => {
                                                setFormData({ ...formData, name: e.target.value });
                                                if (autoGenerateName) setAutoGenerateName(false);
                                            }}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                            placeholder="Ex: Banho Completo G"
                                        />
                                        <p className="text-[9px] text-gray-400 italic px-1">Este é o nome que aparecerá no orçamento e nota fiscal.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Valor</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.basePrice ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setFormData({ ...formData, basePrice: val === '' ? '' : parseFloat(val) });
                                                    }}
                                                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duração (min)</label>
                                            <input
                                                type="number"
                                                value={formData.duration ?? ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setFormData({ ...formData, duration: val === '' ? '' : parseInt(val) });
                                                }}
                                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição Comercial</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]"
                                            placeholder="O que o cliente vê..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Observações Internas</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]"
                                            placeholder="Dicas para o profissional ou notas de custos..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional Responsável (Padrão)</label>
                                        <select
                                            value={formData.responsibleId}
                                            onChange={(e) => setFormData({ ...formData, responsibleId: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        >
                                            <option value="">Selecione um profissional...</option>
                                            {users.filter(u => u.role !== 'CLIENTE').map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all border border-gray-100">Cancelar</button>
                                        <button type="button" onClick={() => handleSubmit()} className="flex-[2] bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">Salvar Serviço</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

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
                                <p className="text-gray-400 text-[10px] font-bold mb-8 uppercase tracking-[0.1em] leading-relaxed">
                                    Cole os serviços abaixo, um por linha. Os campos devem ser separados por ponto e vírgula (;). <br />
                                    <span className="text-primary font-black">FORMATO: Nome; Preço; Duração; Tipo (Banho/Tosa/Outros); Porte; Detalhe (Pelagem ou Tosa); Categoria Banho (Tradicional/Hidratante); Categoria Geral; Descrição</span> <br />
                                    <span className="text-secondary opacity-60">DICA: Use "-" no Nome para gerar o nome automaticamente seguindo o padrão do sistema.</span>
                                </p>

                                <form onSubmit={handleBulkImport} className="space-y-6">
                                    <textarea
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-3xl px-8 py-6 text-[11px] font-mono min-h-[250px] focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                                        placeholder={`Banho Simples; 55.00; 45; Banho; Médio; Curto; Tradicional; Estética; Banho relaxante\nBanho Spa; 95.00; 60; Banho; Grande; Longo; Hidratante; Estética; Banho com máscara\nTosa Bob; 80.00; 90; Tosa; Pequeno; Bebê; -; Estética; Tosa completa`}
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
            </Stack>
        </Container>
    );
}
