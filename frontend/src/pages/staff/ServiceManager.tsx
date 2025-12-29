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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';

interface Service {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    duration: number;
    category: string;
    species: string;
}

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
        species: 'Canino'
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/services');
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
                species: service.species || 'Canino'
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                basePrice: 0,
                duration: 30,
                category: 'Banho',
                species: speciesFilter // Default to current tab
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        if (!window.confirm('ATENÇÃO: Deseja realmente excluir este serviço?')) return;
        try {
            await api.delete(`/services/${id}`);
            fetchServices();
        } catch (error) {
            alert('Erro ao excluir serviço');
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir PERMANENTEMENTE os ${selectedIds.length} serviços selecionados?`)) return;
        try {
            await api.post('/services/bulk-delete', { ids: selectedIds });
            fetchServices();
            setSelectedIds([]);
        } catch (error) {
            alert('Erro ao excluir serviços');
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
            species: service.species
        });
        setIsModalOpen(true);
    };

    const handleBulkImport = async (e: React.FormEvent) => {
        e.preventDefault();
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

    const filteredServices = services.filter(s => {
        const matchesSpecies = s.species === speciesFilter;
        const matchesGlobal = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.description?.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSpecies && matchesGlobal;
    });

    const sortedServices = [...filteredServices];


    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
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

                            <div className="flex gap-2">
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
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <Trash2 size={18} /> Apagar Agora
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                            className={`group bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:border-primary/20 transition-all relative overflow-hidden ${selectedIds.includes(service.id) ? 'ring-2 ring-primary' : ''}`}
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
                                    <button onClick={() => handleOpenModal(service)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title="Editar">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button>
                                    <button onClick={() => handleDuplicate(service)} className="p-2 hover:bg-blue-50 rounded-xl transition-colors" title="Duplicar">
                                        <Copy size={16} className="text-blue-400" />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors" title="Excluir">
                                        <Trash2 size={16} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-secondary mb-1 uppercase truncate">{service.name}</h3>
                            <p className="text-gray-400 text-xs font-bold mb-4 line-clamp-2 h-8">{service.description || 'Sem descrição'}</p>

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
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.basePrice}
                                                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                                                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all font-mono"
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
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">Salvar Serviço</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Import Modal */}
                {isImportModalOpen && (
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
                )}
            </main>
        </div >
    );
}
