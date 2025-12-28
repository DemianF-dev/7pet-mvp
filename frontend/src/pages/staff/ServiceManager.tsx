import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Clock,
    Tag,
    Copy,
    ArrowUpDown,
    Upload,
    Cat,
    Dog
} from 'lucide-react';
import { motion } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';

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

    const [sortConfig, setSortConfig] = useState<{ key: keyof Service; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

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
            console.error('Erro ao salvar serviço:', error);
            alert(error.response?.data?.error || 'Erro ao salvar serviço');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este serviço?')) return;
        try {
            await api.delete(`/services/${id}`);
            fetchServices();
        } catch (error) {
            alert('Erro ao excluir serviço');
        }
    };

    const handleDuplicate = (service: Service) => {
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
            if (response.data.errors.length > 0) {
                console.warn('Erros na importação:', response.data.errors);
                alert(`Alguns itens falharam: \n${response.data.errors.join('\n')}`);
            }

            setIsImportModalOpen(false);
            setImportText('');
            fetchServices();
        } catch (error: any) {
            console.error('Erro na importação:', error);
            alert('Erro ao processar importação. Verifique o formato.');
        }
    };

    const filteredServices = services.filter(s => s.species === speciesFilter);

    const sortedServices = [...filteredServices].sort((a, b) => {
        if (sortConfig.key === 'basePrice' || sortConfig.key === 'duration') {
            return sortConfig.direction === 'asc'
                ? a[sortConfig.key] - b[sortConfig.key]
                : b[sortConfig.key] - a[sortConfig.key];
        }
        return sortConfig.direction === 'asc'
            ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
            : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
    });

    const handleSort = (key: keyof Service) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-4 md:mb-0">
                        <button
                            onClick={() => setSpeciesFilter('Canino')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${speciesFilter === 'Canino' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Dog size={16} /> Cães
                        </button>
                        <button
                            onClick={() => setSpeciesFilter('Felino')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${speciesFilter === 'Felino' ? 'bg-purple-50 text-purple-600' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            <Cat size={16} /> Gatos
                        </button>
                    </div>

                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                        <button
                            onClick={() => handleSort('name')}
                            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${sortConfig.key === 'name' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            Nome {sortConfig.key === 'name' && <ArrowUpDown size={14} />}
                        </button>
                        <button
                            onClick={() => handleSort('basePrice')}
                            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${sortConfig.key === 'basePrice' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            Valor {sortConfig.key === 'basePrice' && <ArrowUpDown size={14} />}
                        </button>
                        <button
                            onClick={() => handleSort('category')}
                            className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${sortConfig.key === 'category' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            Categoria {sortConfig.key === 'category' && <ArrowUpDown size={14} />}
                        </button>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary flex items-center gap-2">
                            <Upload size={20} /> Importar
                        </button>
                        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
                            <Plus size={20} /> Novo Serviço
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : sortedServices.map(service => (
                        <motion.div
                            layout
                            key={service.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-primary/20 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                    <Tag size={24} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(service)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button>
                                    <button onClick={() => handleDuplicate(service)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicar">
                                        <Copy size={16} className="text-blue-400" />
                                    </button>
                                    <button onClick={() => handleDelete(service.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                        <Trash2 size={16} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-secondary mb-1">{service.name}</h3>
                            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{service.description || 'Sem descrição'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-1 text-gray-500 text-sm">
                                    <Clock size={14} />
                                    <span>{service.duration} min</span>
                                </div>
                                <div className="flex items-center gap-1 text-primary font-bold">
                                    <span>R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {
                    isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl"
                            >
                                <h2 className="text-2xl font-bold text-secondary mb-6">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase">Nome do Serviço</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-field"
                                            placeholder="Ex: Banho & Tosa M"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase">Descrição</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="input-field min-h-[100px]"
                                            placeholder="Detalhes do que inclui o serviço..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-400 uppercase">Preço Base</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={formData.basePrice}
                                                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                                                    className="input-field pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-400 uppercase">Duração (min)</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-400 uppercase">Espécie</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="species"
                                                    value="Canino"
                                                    checked={formData.species === 'Canino'}
                                                    onChange={() => setFormData({ ...formData, species: 'Canino' })}
                                                    className="text-primary focus:ring-primary"
                                                />
                                                <span className="text-secondary font-medium">Canino</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="species"
                                                    value="Felino"
                                                    checked={formData.species === 'Felino'}
                                                    onChange={() => setFormData({ ...formData, species: 'Felino' })}
                                                    className="text-primary focus:ring-primary"
                                                />
                                                <span className="text-secondary font-medium">Felino</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                                        <button type="submit" className="btn-primary flex-1">Salvar</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }
                {
                    isImportModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-3xl p-8 w-full max-w-2xl relative z-10 shadow-2xl"
                            >
                                <h2 className="text-2xl font-bold text-secondary mb-2">Importação em Massa</h2>
                                <p className="text-gray-500 mb-6 text-sm">Cole os serviços abaixo, um por linha. Formato: <br />
                                    <code className="bg-gray-100 px-2 py-1 rounded text-primary font-bold mt-2 block">Nome; Descrição; Preço; Duração(min); Categoria</code>
                                </p>

                                <form onSubmit={handleBulkImport} className="space-y-4">
                                    <textarea
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        className="input-field h-64 font-mono text-xs"
                                        placeholder={`Banho Simples; Banho tradicional; 50.00; 45; Banho\nTosa Higiênica; Corte íntimo e patinhas; 30.00; 20; Tosa\nVacina V10; Aplicação anual; 120,50; 15; Veterinário`}
                                    />
                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                                        <button type="submit" className="btn-primary flex-1">Processar Importação</button>
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
