import { useState, useEffect } from 'react';
import {
    Search,
    User,
    Dog,
    Calendar,
    ShieldAlert,
    ChevronRight,
    MapPin,
    Phone,
    Plus,
    Edit,
    Trash2,
    FileText,
    Save,
    X,
    Clock,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    MessageCircle,
    RefreshCcw,
    Printer,
    StickyNote,
    Wallet,
    Filter,
    ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import LoadingButton from '../../components/LoadingButton';

interface Pet {
    id: string;
    name: string;
    species: string;
    breed?: string;
    weight?: number;
    observations?: string;
    coatType?: string;
    healthIssues?: string;
    allergies?: string;
    temperament?: string;
    usesPerfume?: boolean;
    usesOrnaments?: boolean;
    age?: string;
    hasKnots?: boolean;
    hasMattedFur?: boolean;
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    type: 'AVULSO' | 'RECORRENTE';
    internalNotes?: string;
    isBlocked: boolean;
    requiresPrepayment: boolean;
    noShowCount: number;
    pets: Pet[];
    user: { email: string };
    balance?: number;
    recurringFrequency?: 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
    discountPercentage?: number;
    _count?: {
        appointments: number;
        quotes: number;
    };
    createdAt?: string;
}

export default function CustomerManager() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Filters & Sorting
    const [filterType, setFilterType] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Customer; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

    // Modal & Form States
    // Modal & Form States
    const [isEditMode, setIsEditMode] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Customer & { email?: string }>>({});
    const [activeTab, setActiveTab] = useState<'details' | 'history' | 'quotes' | 'pets' | 'financial'>('details');

    // Pet Edit State
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [isPetModalOpen, setIsPetModalOpen] = useState(false);
    const [petFormData, setPetFormData] = useState<Partial<Pet>>({});

    // History Data
    const [historyData, setHistoryData] = useState<any>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const statuses = ['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'AGENDAR', 'ENCERRADO'];

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (selectedCustomer && activeTab !== 'details') {
            fetchCustomerHistory(selectedCustomer.id);
        }
    }, [selectedCustomer, activeTab]);

    const fetchCustomers = async () => {
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCustomerHistory = async (id: string) => {
        setIsLoadingHistory(true);
        try {
            const response = await api.get(`/customers/${id}`);
            setHistoryData(response.data);
        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleCreateWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = { ...formData, type: formData.type || 'AVULSO' } as any;
            if (payload.recurringFrequency === '') {
                delete payload.recurringFrequency;
            }
            await api.post('/customers', payload);
            setIsCreateModalOpen(false);
            setFormData({});
            fetchCustomers();
            alert('Cliente cadastrado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao criar cliente:', error);
            alert(error.response?.data?.error || 'Erro ao criar cliente');
        } finally {
            setIsSaving(false);
        }
    };

    const refreshAll = async () => {
        setIsLoading(true);
        await fetchCustomers();
        if (selectedCustomer) {
            await fetchCustomerHistory(selectedCustomer.id);
        }
        setIsLoading(false);
    };

    const updateQuoteStatus = async (id: string, newStatus: string) => {
        try {
            await api.patch(`/quotes/${id}/status`, { status: newStatus });
            if (selectedCustomer) fetchCustomerHistory(selectedCustomer.id);
            if (selectedQuote?.id === id) setSelectedQuote({ ...selectedQuote, status: newStatus });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const handleQuoteWhatsApp = (quote: any) => {
        const url = `https://wa.me/${selectedCustomer?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
            `Olá, ${selectedCustomer?.name}! Aqui está o seu orçamento da 7Pet (Orçamento #${quote.id.substring(0, 8).toUpperCase()}):\n\n` +
            quote.items.map((i: any) => `- ${i.description}: ${i.quantity}x R$ ${i.price.toFixed(2)}`).join('\n') +
            `\n\nTotal: R$ ${quote.totalAmount.toFixed(2)}\n\nPor favor, retorne para aprovação.`
        )}`;
        window.open(url, '_blank');
    };

    const handlePrintQuote = (quote: any) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
            <html>
                <head>
                    <title>Orçamento - 7Pet</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; color: #333; }
                        .header { border-bottom: 2px solid #ed64a6; padding-bottom: 20px; margin-bottom: 20px; }
                        h1 { color: #ed64a6; margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
                        th { background: #f9f9f9; font-weight: bold; }
                        .total { text-align: right; font-size: 24px; font-weight: bold; margin-top: 30px; color: #ed64a6; }
                        .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>7Pet - Orçamento #${quote.id.substring(0, 8).toUpperCase()}</h1>
                        <p><strong>Cliente:</strong> ${selectedCustomer?.name}</p>
                        <p><strong>Data:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qtd</th>
                                <th>Preço Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${quote.items.map((item: any) => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td>${item.quantity}</td>
                                    <td>R$ ${item.price.toFixed(2)}</td>
                                    <td>R$ ${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="total">Total: R$ ${quote.totalAmount.toFixed(2)}</div>
                    <div class="footer">Este orçamento é válido por 15 dias. Sujeito a alteração após avaliação presencial.</div>
                </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    const getQuoteStatusColor = (status: string) => {
        switch (status) {
            case 'SOLICITADO': return 'bg-blue-100 text-blue-700';
            case 'EM_PRODUCAO': return 'bg-yellow-100 text-yellow-700';
            case 'CALCULADO': return 'bg-emerald-100 text-emerald-700';
            case 'ENVIADO': return 'bg-purple-100 text-purple-700';
            case 'APROVADO': return 'bg-green-100 text-green-700';
            case 'REJEITADO': return 'bg-red-100 text-red-700';
            case 'AGENDAR': return 'bg-indigo-100 text-indigo-700';
            case 'ENCERRADO': return 'bg-gray-200 text-gray-500 line-through';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleUpdateWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        setIsSaving(true);
        try {
            const payload = { ...formData } as any;
            if (payload.recurringFrequency === '') {
                delete payload.recurringFrequency;
            }
            const response = await api.patch(`/customers/${selectedCustomer.id}`, payload);
            setSelectedCustomer({ ...selectedCustomer, ...response.data });
            setIsEditMode(false);
            fetchCustomers();
            alert('Dados atualizados!');
        } catch (error: any) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar dados.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedCustomer || !confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) return;
        try {
            await api.delete(`/customers/${selectedCustomer.id}`);
            setSelectedCustomer(null);
            fetchCustomers();
            alert('Cliente removido.');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir cliente.');
        }
    };

    const startEdit = () => {
        setFormData({
            name: selectedCustomer?.name,
            phone: selectedCustomer?.phone,
            address: selectedCustomer?.address,
            type: selectedCustomer?.type,
            recurringFrequency: selectedCustomer?.recurringFrequency,
            discountPercentage: selectedCustomer?.discountPercentage,
            internalNotes: selectedCustomer?.internalNotes,
            isBlocked: selectedCustomer?.isBlocked,
            requiresPrepayment: selectedCustomer?.requiresPrepayment
        });
        setIsEditMode(true);
    };

    const handlePetUpdateWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (selectedPet) {
                // UPDATE
                const response = await api.patch(`/pets/${selectedPet.id}`, petFormData);
                if (selectedCustomer) {
                    const updatedPets = selectedCustomer.pets.map(p => p.id === selectedPet.id ? response.data : p);
                    setSelectedCustomer({ ...selectedCustomer, pets: updatedPets });
                }
                alert('Pet atualizado com sucesso!');
            } else {
                // CREATE
                if (!selectedCustomer) return;
                const response = await api.post(`/customers/${selectedCustomer.id}/pets`, petFormData);
                if (selectedCustomer) {
                    setSelectedCustomer({ ...selectedCustomer, pets: [...selectedCustomer.pets, response.data] });
                }
                alert('Pet adicionado com sucesso!');
            }
            setIsPetModalOpen(false);
        } catch (error: any) {
            console.error('Erro ao salvar pet:', error);
            alert('Erro ao salvar pet.');
        } finally {
            setIsSaving(false);
        }
    };

    const startPetEdit = (pet: Pet) => {
        setSelectedPet(pet);
        setPetFormData({
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            weight: pet.weight,
            observations: pet.observations,
            coatType: pet.coatType,
            healthIssues: pet.healthIssues,
            allergies: pet.allergies,
            temperament: pet.temperament,
            usesPerfume: pet.usesPerfume || false,
            usesOrnaments: pet.usesOrnaments || false,
            age: pet.age,
            hasKnots: pet.hasKnots || false,
            hasMattedFur: pet.hasMattedFur || false
        });
        setIsPetModalOpen(true);
    };

    const startPetCreate = () => {
        setSelectedPet(null);
        setPetFormData({
            species: 'Cachorro',
            usesPerfume: false,
            usesOrnaments: false,
            hasKnots: false,
            hasMattedFur: false
        });
        setIsPetModalOpen(true);
    };

    const handleSort = (key: keyof Customer) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const filteredCustomers = customers
        .filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'ALL' || c.type === filterType;
            const matchesStatus = filterStatus === 'ALL'
                ? true
                : filterStatus === 'BLOCKED' ? c.isBlocked
                    : !c.isBlocked;

            return matchesSearch && matchesType && matchesStatus;
        })
        .sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            // Handle undefined/null values
            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10 mt-[-1rem]">
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-secondary">Gestão de <span className="text-primary">Clientes</span></h1>
                            <p className="text-gray-500">Visualize perfis, histórico e gerencie restrições de acesso.</p>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={refreshAll}
                                disabled={isLoading}
                                className="p-3 bg-white text-gray-400 hover:text-primary rounded-2xl shadow-sm border border-gray-100 transition-all active:scale-95 disabled:opacity-50"
                                title="Recarregar dados"
                            >
                                <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
                            </button>
                            <button
                                onClick={() => { setFormData({}); setIsCreateModalOpen(true); }}
                                className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <Plus size={20} /> Novo Cliente
                            </button>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col gap-4 mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Type Filter */}
                        <div className="bg-white py-2 px-4 rounded-2xl border border-gray-100 flex items-center gap-2 shadow-sm">
                            <Filter size={14} className="text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-secondary focus:ring-0 cursor-pointer outline-none"
                            >
                                <option value="ALL">Todos os Tipos</option>
                                <option value="AVULSO">Avulso</option>
                                <option value="RECORRENTE">Recorrente</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="bg-white py-2 px-4 rounded-2xl border border-gray-100 flex items-center gap-2 shadow-sm">
                            <ShieldAlert size={14} className="text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-secondary focus:ring-0 cursor-pointer outline-none"
                            >
                                <option value="ALL">Todos os Status</option>
                                <option value="ACTIVE">Ativos</option>
                                <option value="BLOCKED">Bloqueados</option>
                            </select>
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

                        {/* Sort Controls */}
                        <button
                            onClick={() => handleSort('createdAt')}
                            className={`px-4 py-2 rounded-2xl font-bold text-xs border transition-all flex items-center gap-2 ${sortConfig.key === 'createdAt' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                        >
                            {sortConfig.key === 'createdAt' && sortConfig.direction === 'desc' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            Data de Cadastro
                        </button>
                        <button
                            onClick={() => handleSort('name')}
                            className={`px-4 py-2 rounded-2xl font-bold text-xs border transition-all flex items-center gap-2 ${sortConfig.key === 'name' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}
                        >
                            <ArrowUpDown size={14} />
                            Nome (A-Z)
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* List */}
                    <div className="lg:col-span-4 space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex justify-center p-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredCustomers.map(customer => (
                            <motion.div
                                key={customer.id}
                                layoutId={customer.id}
                                onClick={() => { setSelectedCustomer(customer); setIsEditMode(false); setActiveTab('details'); }}
                                className={`p-4 rounded-3xl cursor-pointer transition-all border group ${selectedCustomer?.id === customer.id ? 'bg-white border-primary shadow-lg ring-4 ring-primary/5' : 'bg-white/60 border-gray-100 hover:bg-white hover:shadow-md'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${customer.isBlocked ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-secondary truncate">{customer.name}</h3>
                                        <p className="text-xs text-gray-400 truncate">{customer.user?.email}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${customer.type === 'RECORRENTE' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {customer.type}
                                            </span>
                                            {customer.isBlocked && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600">
                                                    BLOQUEADO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className={`transition-transform ${selectedCustomer?.id === customer.id ? 'text-primary translate-x-1' : 'text-gray-300'}`} />
                                    {(customer.balance || 0) < 0 && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white" title="Possui Débitos"></div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Details Panel */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {selectedCustomer ? (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 sticky top-10"
                                >
                                    {/* Panel Header */}
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                                        <div>
                                            <h2 className="text-3xl font-black text-secondary">{selectedCustomer.name}</h2>
                                            <p className="text-gray-400 font-medium">{selectedCustomer.user?.email}</p>
                                        </div>
                                        {(selectedCustomer.balance !== undefined && selectedCustomer.balance !== 0) && (
                                            <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border ${selectedCustomer.balance > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                {selectedCustomer.balance > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                                <div>
                                                    <p className="text-xs font-bold uppercase opacity-70">{selectedCustomer.balance > 0 ? 'Crédito Disponível' : 'Débito em Aberto'}</p>
                                                    <p className="text-2xl font-black">R$ {Math.abs(selectedCustomer.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'details' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}>Perfil</button>
                                                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}>Agendamentos</button>
                                                <button onClick={() => setActiveTab('quotes')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'quotes' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}>Orçamentos</button>
                                                <button onClick={() => setActiveTab('pets')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pets' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}>Pets</button>
                                                <button onClick={() => setActiveTab('financial')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'financial' ? 'bg-white shadow-sm text-secondary' : 'text-gray-400'}`}>
                                                    <Wallet size={14} /> Financeiro
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content based on Tab */}
                                    {activeTab === 'details' && (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            {isEditMode ? (
                                                <form onSubmit={handleUpdateWrapper} className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="label">Nome Completo</label>
                                                            <input className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="label">Telefone</label>
                                                            <input className="input-field" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                                        </div>
                                                        <div className="col-span-2 space-y-2">
                                                            <label className="label">Endereço</label>
                                                            <input className="input-field" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                                        </div>
                                                        <div className="col-span-2 space-y-2">
                                                            <label className="label">E-mail para Acesso (Obrigatório)</label>
                                                            <input
                                                                type="email"
                                                                className="input-field"
                                                                value={formData.email || ''}
                                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                                placeholder="cliente@email.com"
                                                                required
                                                            />
                                                            <p className="text-[10px] text-gray-400 font-medium">Este e-mail será usado para o login do cliente no app.</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="label">Tipo de Cliente</label>
                                                            <select
                                                                className="input-field"
                                                                value={formData.type || 'AVULSO'}
                                                                onChange={e => {
                                                                    const newType = e.target.value as any;
                                                                    setFormData({
                                                                        ...formData,
                                                                        type: newType,
                                                                        recurringFrequency: newType === 'AVULSO' ? undefined : formData.recurringFrequency,
                                                                        discountPercentage: newType === 'AVULSO' ? 0 : formData.discountPercentage
                                                                    });
                                                                }}
                                                            >
                                                                <option value="AVULSO">Avulso (Eventual)</option>
                                                                <option value="RECORRENTE">Recorrente (Fiel)</option>
                                                            </select>
                                                        </div>
                                                        {String(formData.type).toUpperCase() === 'RECORRENTE' && (
                                                            <div className="col-span-2 grid grid-cols-2 gap-4 bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-inner">
                                                                <div className="space-y-2">
                                                                    <label className="label text-purple-700 font-bold">Frequência Desejada</label>
                                                                    <select
                                                                        className="input-field bg-white border-purple-200"
                                                                        value={formData.recurringFrequency || ''}
                                                                        onChange={e => {
                                                                            const freq = e.target.value as any;
                                                                            let discount = 0;
                                                                            if (freq === 'SEMANAL') discount = 10;
                                                                            if (freq === 'QUINZENAL') discount = 7;
                                                                            if (freq === 'MENSAL') discount = 5;
                                                                            setFormData({ ...formData, recurringFrequency: freq, discountPercentage: discount });
                                                                        }}
                                                                    >
                                                                        <option value="">Selecione a frequência...</option>
                                                                        <option value="SEMANAL">Semanal (Mín. 4 banhos/mês)</option>
                                                                        <option value="QUINZENAL">Quinzenal (Mín. 2 banhos/mês)</option>
                                                                        <option value="MENSAL">Mensal (1 banho/mês)</option>
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="label text-purple-700 font-bold">Desconto Aplicado (%)</label>
                                                                    <div className="input-field bg-white border-purple-200 flex items-center justify-between font-black text-purple-600">
                                                                        <span>{formData.discountPercentage || 0}%</span>
                                                                        <span className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded-lg uppercase tracking-wider">Automático</span>
                                                                    </div>
                                                                </div>
                                                                <div className="col-span-2 text-xs text-purple-600 italic font-medium">
                                                                    {formData.recurringFrequency === 'SEMANAL' && "* Desconto de 10% sobre o pacote do mês todo e todos os serviços adicionais."}
                                                                    {formData.recurringFrequency === 'QUINZENAL' && "* Desconto de 7% aplicado sobre o valor total mensal."}
                                                                    {formData.recurringFrequency === 'MENSAL' && "* Desconto de 5%. Observação: Este plano exige pagamento de dois meses adiantados."}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="col-span-2 space-y-2">
                                                            <label className="label">Observações Internas (Visível apenas para Staff)</label>
                                                            <textarea
                                                                className="input-field min-h-[100px]"
                                                                value={formData.internalNotes || ''}
                                                                onChange={e => setFormData({ ...formData, internalNotes: e.target.value })}
                                                                placeholder="Alertas, preferências especiais, histórico de problemas..."
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                                        <h4 className="text-red-800 font-bold mb-2 flex items-center gap-2"><ShieldAlert size={18} /> Área de Risco</h4>
                                                        <div className="flex gap-6">
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" checked={formData.isBlocked} onChange={e => setFormData({ ...formData, isBlocked: e.target.checked })} className="accent-red-500 w-5 h-5" />
                                                                <span className="text-sm font-bold text-red-700">Bloquear Cliente</span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer">
                                                                <input type="checkbox" checked={formData.requiresPrepayment} onChange={e => setFormData({ ...formData, requiresPrepayment: e.target.checked })} className="accent-orange-500 w-5 h-5" />
                                                                <span className="text-sm font-bold text-orange-700">Exige Pagamento Antecipado</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {/* Secondary Guardian Section */}
                                                    <div className="pt-6 border-t border-gray-100">
                                                        <h4 className="text-sm font-bold text-secondary mb-4">Segundo Responsável (Opcional)</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="label">Nome Completo</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.secondaryGuardianName || ''}
                                                                    onChange={(e) => setFormData({ ...formData, secondaryGuardianName: e.target.value })}
                                                                    className="input-field"
                                                                    placeholder="Nome do segundo tutor"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="label">Telefone</label>
                                                                <input
                                                                    type="tel"
                                                                    value={formData.secondaryGuardianPhone || ''}
                                                                    onChange={(e) => setFormData({ ...formData, secondaryGuardianPhone: e.target.value })}
                                                                    className="input-field"
                                                                    placeholder="(00) 00000-0000"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="label">E-mail</label>
                                                                <input
                                                                    type="email"
                                                                    value={formData.secondaryGuardianEmail || ''}
                                                                    onChange={(e) => setFormData({ ...formData, secondaryGuardianEmail: e.target.value })}
                                                                    className="input-field"
                                                                    placeholder="email@exemplo.com"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="label">Endereço</label>
                                                                <input
                                                                    type="text"
                                                                    value={formData.secondaryGuardianAddress || ''}
                                                                    onChange={(e) => setFormData({ ...formData, secondaryGuardianAddress: e.target.value })}
                                                                    className="input-field"
                                                                    placeholder="Endereço completo"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                                        <button type="button" onClick={() => setIsEditMode(false)} className="btn-secondary">Cancelar</button>
                                                        <LoadingButton
                                                            type="submit"
                                                            isLoading={isSaving}
                                                            loadingText="Salvando..."
                                                            leftIcon={<Save size={18} />}
                                                        >
                                                            Salvar Alterações
                                                        </LoadingButton>
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <div className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group">
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Telefone</p>
                                                                <div className="flex items-center gap-2 text-secondary font-bold">
                                                                    <Phone size={16} className="text-primary" /> {selectedCustomer.phone || '-'}
                                                                </div>
                                                            </div>
                                                            {selectedCustomer.phone && (
                                                                <a
                                                                    href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100 flex items-center gap-2 text-xs font-bold"
                                                                >
                                                                    <MessageCircle size={18} /> WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tipo</p>
                                                            <div className="flex items-center gap-2 text-secondary font-bold">
                                                                <User size={16} className="text-primary" /> {selectedCustomer.type}
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-gray-50 rounded-2xl md:col-span-2 lg:col-span-1">
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Endereço</p>
                                                            <div className="flex items-center gap-2 text-secondary font-bold">
                                                                <MapPin size={16} className="text-primary" /> {selectedCustomer.address || '-'}
                                                            </div>
                                                        </div>
                                                        {selectedCustomer.type === 'RECORRENTE' && (
                                                            <div className="col-span-1 md:col-span-2 lg:col-span-3 p-6 bg-purple-50 rounded-[30px] border border-purple-100 flex items-center justify-between shadow-sm">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                                                                        <TrendingDown size={24} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Frequência do Plano</p>
                                                                        <p className="text-secondary font-black text-lg">{selectedCustomer.recurringFrequency || 'Não informada'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Benefício Ativo</p>
                                                                    <p className="text-3xl font-black text-purple-600">{selectedCustomer.discountPercentage || 0}% OFF</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {selectedCustomer.internalNotes && (
                                                        <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100 relative overflow-hidden">
                                                            <StickyNote className="absolute -right-4 -top-4 text-yellow-200" size={120} />
                                                            <div className="relative z-10">
                                                                <p className="text-yellow-700 font-bold mb-2 flex items-center gap-2"><ShieldAlert size={16} /> Observações Internas</p>
                                                                <p className="text-yellow-800 text-sm italic">"{selectedCustomer.internalNotes}"</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
                                                            <Dog className="text-primary" /> Pets Cadastrados
                                                        </h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {selectedCustomer.pets.map(pet => (
                                                                <div key={pet.id} className="p-4 border border-gray-100 rounded-2xl flex items-center gap-3 bg-white shadow-sm">
                                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                                                        <Dog size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-secondary">{pet.name}</p>
                                                                        <p className="text-xs text-gray-400">{pet.breed || 'SRD'} • {pet.species}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {selectedCustomer.pets.length === 0 && <p className="text-gray-400 text-sm italic col-span-2">Nenhum pet cadastrado.</p>}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end gap-3 pt-8 border-t border-gray-100">
                                                        <button onClick={handleDelete} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-colors flex items-center gap-2">
                                                            <Trash2 size={18} /> Excluir Cliente
                                                        </button>
                                                        <button onClick={startEdit} className="btn-secondary flex items-center gap-2">
                                                            <Edit size={18} /> Editar Cadastro
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* HISTORY TAB */}
                                    {activeTab === 'history' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <h3 className="font-bold text-secondary text-lg mb-4 flex items-center gap-2">
                                                <Calendar className="text-primary" /> Histórico de Agendamentos
                                            </h3>
                                            {isLoadingHistory ? (
                                                <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
                                            ) : historyData?.appointments?.length > 0 ? (
                                                historyData.appointments.map((appt: any) => (
                                                    <div key={appt.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm font-bold text-xs flex-col">
                                                                <span>{new Date(appt.startAt).getDate()}</span>
                                                                <span className="text-[8px] uppercase">{new Date(appt.startAt).toLocaleString('pt-BR', { month: 'short' })}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-secondary text-sm">{new Date(appt.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {appt.pet?.name || 'Pet'}</p>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${appt.status === 'FINALIZADO' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{appt.status}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                    <Clock size={40} className="mx-auto mb-2 opacity-50" />
                                                    <p>Nenhum agendamento encontrado.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* QUOTES TAB */}
                                    {activeTab === 'quotes' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                                                    <FileText className="text-primary" /> Histórico de Orçamentos
                                                </h3>
                                                <button
                                                    onClick={() => selectedCustomer && fetchCustomerHistory(selectedCustomer.id)}
                                                    className="p-2 text-gray-400 hover:text-primary transition-all rounded-lg hover:bg-gray-100 flex items-center gap-1 text-xs font-bold"
                                                >
                                                    <RefreshCcw size={14} className={isLoadingHistory ? 'animate-spin' : ''} /> Atualizar
                                                </button>
                                            </div>
                                            {isLoadingHistory ? (
                                                <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
                                            ) : historyData?.quotes?.length > 0 ? (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {historyData.quotes.map((quote: any) => (
                                                        <div
                                                            key={quote.id}
                                                            onClick={() => { setSelectedQuote(quote); setIsQuoteModalOpen(true); }}
                                                            className="p-5 rounded-3xl border border-gray-100 bg-white hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <p className="font-black text-secondary">#{quote.id.substring(0, 8).toUpperCase()}</p>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${getQuoteStatusColor(quote.status)}`}>{quote.status}</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 font-bold flex items-center gap-1"><Calendar size={12} /> {new Date(quote.createdAt).toLocaleDateString()} às {new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-lg font-black text-primary">R$ {quote.totalAmount.toFixed(2)}</p>
                                                                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">Clique para ver detalhes</p>
                                                                </div>
                                                            </div>
                                                            <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ChevronRight size={16} className="text-primary" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                                    <FileText size={40} className="mx-auto mb-2 opacity-50" />
                                                    <p>Nenhum orçamento encontrado.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* PETS TAB */}
                                    {activeTab === 'pets' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <h3 className="font-bold text-secondary text-lg mb-4 flex items-center gap-2">
                                                <Dog className="text-primary" /> Gestão de Pets
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedCustomer.pets.map(pet => (
                                                    <div key={pet.id} className="p-4 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                                                <Dog size={24} />
                                                            </div>
                                                            <button onClick={() => startPetEdit(pet)} className="text-gray-300 hover:text-primary"><Edit size={16} /></button>
                                                        </div>
                                                        <h4 className="font-bold text-secondary text-lg">{pet.name}</h4>
                                                        <div className="flex flex-wrap gap-2 mb-3">
                                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">{pet.species}</span>
                                                            {pet.breed && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">{pet.breed}</span>}
                                                            {pet.age && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-lg font-bold">{pet.age}</span>}
                                                        </div>

                                                        <div className="space-y-3">
                                                            {(pet.healthIssues || pet.allergies) && (
                                                                <div className="flex gap-2">
                                                                    {pet.healthIssues && <span className="text-[10px] px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100 font-bold flex items-center gap-1"><ShieldAlert size={10} /> {pet.healthIssues}</span>}
                                                                    {pet.allergies && <span className="text-[10px] px-2 py-1 bg-orange-50 text-orange-600 rounded-lg border border-orange-100 font-bold flex items-center gap-1"><ShieldAlert size={10} /> Alergia: {pet.allergies}</span>}
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="text-xs bg-gray-50 p-2 rounded-lg">
                                                                    <span className="text-gray-400 font-bold block">Peso</span>
                                                                    <span className="font-bold text-secondary">{pet.weight ? pet.weight + ' kg' : '-'}</span>
                                                                </div>
                                                                <div className="text-xs bg-gray-50 p-2 rounded-lg">
                                                                    <span className="text-gray-400 font-bold block">Pelagem</span>
                                                                    <span className="font-bold text-secondary">{pet.coatType ? pet.coatType.charAt(0) + pet.coatType.slice(1).toLowerCase() : '-'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                {pet.hasKnots && <span className="text-[10px] px-2 py-1 bg-purple-50 text-purple-600 rounded-md font-bold">Tem Nós</span>}
                                                                {pet.hasMattedFur && <span className="text-[10px] px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-bold">Tem Embolos</span>}
                                                                {!pet.usesPerfume && <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-400 rounded-md decoration-slice line-through">Perfume</span>}
                                                                {!pet.usesOrnaments && <span className="text-[10px] px-2 py-1 bg-gray-100 text-gray-400 rounded-md line-through">Enfeites</span>}
                                                                {pet.temperament && <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-bold">{pet.temperament}</span>}
                                                            </div>

                                                            {pet.observations && (
                                                                <div className="text-xs bg-yellow-50 p-2 rounded-lg border border-yellow-100 text-yellow-800 italic mt-2">
                                                                    "{pet.observations}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button onClick={startPetCreate} className="p-4 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all min-h-[200px] gap-2">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-current">
                                                        <Plus size={20} />
                                                    </div>
                                                    <span className="font-bold text-sm">Adicionar Novo Pet</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* FINANCIAL TAB */}
                                    {activeTab === 'financial' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            {/* Balance Summary Card */}
                                            <div className={`p-8 rounded-3xl text-center border-2 ${(selectedCustomer.balance || 0) >= 0
                                                ? 'bg-gradient-to-br from-green-50 to-white border-green-100'
                                                : 'bg-gradient-to-br from-red-50 to-white border-red-100'
                                                }`}>
                                                <p className="text-gray-400 font-medium uppercase tracking-widest text-sm mb-2">Saldo Atual em Conta</p>
                                                <h3 className={`text-5xl font-black mb-4 ${(selectedCustomer.balance || 0) >= 0 ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                    R$ {Math.abs(selectedCustomer.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </h3>
                                                <p className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${(selectedCustomer.balance || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {(selectedCustomer.balance || 0) >= 0
                                                        ? <><CheckCircle size={16} /> Cliente com Crédito ou Quitado</>
                                                        : <><AlertCircle size={16} /> Cliente possui pendências financeiras</>
                                                    }
                                                </p>
                                            </div>

                                            <h3 className="text-xl font-bold text-secondary mt-8 mb-4">Histórico Financeiro</h3>

                                            {isLoadingHistory ? (
                                                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {(historyData?.invoices || []).length === 0 ? (
                                                        <div className="text-center p-10 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                                            <Wallet size={40} className="mx-auto mb-2 opacity-50" />
                                                            <p>Nenhuma fatura encontrada.</p>
                                                        </div>
                                                    ) : (
                                                        (historyData?.invoices || []).map((invoice: any) => (
                                                            <div key={invoice.id} className="bg-white border border-gray-100 p-5 rounded-2xl hover:shadow-md transition-shadow flex justify-between items-center group">
                                                                <div className="flex gap-4 items-center">
                                                                    <div className={`p-3 rounded-xl ${invoice.status === 'PAGO' ? 'bg-green-100 text-green-600' :
                                                                        invoice.status === 'VENCIDO' ? 'bg-red-100 text-red-600' :
                                                                            'bg-yellow-100 text-yellow-600'
                                                                        }`}>
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-secondary text-lg">R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                        <p className="text-xs text-gray-400">Vencimento: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${invoice.status === 'PAGO' ? 'bg-green-100 text-green-700' :
                                                                        invoice.status === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                                                                            'bg-yellow-100 text-yellow-700'
                                                                        }`}>
                                                                        {invoice.status}
                                                                    </span>
                                                                    <p className="text-[10px] text-gray-400 mt-1">{new Date(invoice.createdAt).toLocaleDateString()} (Emissão)</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </motion.div>
                            ) : (
                                <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-gray-100 text-gray-300">
                                    <User size={64} className="mb-4 opacity-20" />
                                    <p className="font-medium">Selecione um cliente para ver detalhes completos</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* CREATE MODAL */}
                {
                    isCreateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}></div>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Novo Cliente</h2>
                                <form onSubmit={handleCreateWrapper} className="space-y-4">
                                    <div>
                                        <label className="label">Email (Login)</label>
                                        <input type="email" required className="input-field" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Nome Completo</label>
                                        <input required className="input-field" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Telefone</label>
                                        <input className="input-field" placeholder="Ex: 11999999999" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="label">Tipo</label>
                                        <select
                                            className="input-field"
                                            value={formData.type || 'AVULSO'}
                                            onChange={e => {
                                                const newType = e.target.value as any;
                                                setFormData({
                                                    ...formData,
                                                    type: newType,
                                                    recurringFrequency: newType === 'AVULSO' ? undefined : formData.recurringFrequency,
                                                    discountPercentage: newType === 'AVULSO' ? 0 : formData.discountPercentage
                                                });
                                            }}
                                        >
                                            <option value="AVULSO">Avulso</option>
                                            <option value="RECORRENTE">Recorrente</option>
                                        </select>
                                    </div>

                                    {String(formData.type).toUpperCase() === 'RECORRENTE' && (
                                        <div className="space-y-4 bg-purple-50 p-4 rounded-2xl border border-purple-100 transition-all shadow-inner">
                                            <div>
                                                <label className="label text-purple-700">Frequência</label>
                                                <select
                                                    className="input-field bg-white border-purple-200"
                                                    value={formData.recurringFrequency || ''}
                                                    onChange={e => {
                                                        const freq = e.target.value as any;
                                                        let discount = 0;
                                                        if (freq === 'SEMANAL') discount = 10;
                                                        if (freq === 'QUINZENAL') discount = 7;
                                                        if (freq === 'MENSAL') discount = 5;
                                                        setFormData({ ...formData, recurringFrequency: freq, discountPercentage: discount });
                                                    }}
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option value="SEMANAL">Semanal (10% desc)</option>
                                                    <option value="QUINZENAL">Quinzenal (7% desc)</option>
                                                    <option value="MENSAL">Mensal (5% desc)</option>
                                                </select>
                                            </div>
                                            <div className="text-[10px] text-purple-600 font-bold bg-white/50 p-2 rounded-lg italic">
                                                {String(formData.recurringFrequency).toUpperCase() === 'SEMANAL' && "Min. 4 banhos/mês. Desconto aplicado em todo o pacote."}
                                                {String(formData.recurringFrequency).toUpperCase() === 'QUINZENAL' && "Min. 2 banhos/mês. Desconto sobre o valor total."}
                                                {String(formData.recurringFrequency).toUpperCase() === 'MENSAL' && "1 banho/mês. Requer pagamento de 2 meses adiantados."}
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                                        <LoadingButton
                                            type="submit"
                                            isLoading={isSaving}
                                            loadingText="Criando..."
                                        >
                                            Criar Cadastro
                                        </LoadingButton>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

                {/* PET EDIT/CREATE MODAL */}
                {
                    isPetModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setIsPetModalOpen(false)}></div>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-lg relative z-10 shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-secondary flex items-center gap-2"><Dog className="text-primary" /> {selectedPet ? 'Editar Pet' : 'Novo Pet'}</h2>
                                    <button onClick={() => setIsPetModalOpen(false)} className="text-gray-300 hover:text-red-500"><X size={24} /></button>
                                </div>
                                <form onSubmit={handlePetUpdateWrapper} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="label">Nome do Pet</label>
                                            <input required className="input-field" value={petFormData.name || ''} onChange={e => setPetFormData({ ...petFormData, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Espécie</label>
                                            <select className="input-field" value={petFormData.species || 'Cachorro'} onChange={e => setPetFormData({ ...petFormData, species: e.target.value })}>
                                                <option value="Cachorro">Cachorro</option>
                                                <option value="Gato">Gato</option>
                                                <option value="Outro">Outro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Raça</label>
                                            <input className="input-field" value={petFormData.breed || ''} onChange={e => setPetFormData({ ...petFormData, breed: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Peso (kg)</label>
                                            <input type="number" step="0.1" className="input-field" value={petFormData.weight || ''} onChange={e => setPetFormData({ ...petFormData, weight: parseFloat(e.target.value) })} />
                                        </div>
                                        <div>
                                            <label className="label">Idade</label>
                                            <input className="input-field" placeholder="Ex: 2 anos" value={petFormData.age || ''} onChange={e => setPetFormData({ ...petFormData, age: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Pelagem</label>
                                            <select className="input-field" value={petFormData.coatType || ''} onChange={e => setPetFormData({ ...petFormData, coatType: e.target.value })}>
                                                <option value="">Selecione...</option>
                                                <option value="CURTO">Curta</option>
                                                <option value="MEDIO">Média</option>
                                                <option value="LONGO">Longa</option>
                                                <option value="DUPLO">Dupla</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Temperamento</label>
                                            <select className="input-field" value={petFormData.temperament || ''} onChange={e => setPetFormData({ ...petFormData, temperament: e.target.value })}>
                                                <option value="">Selecione...</option>
                                                <option value="DOCIL">Dócil</option>
                                                <option value="AGITADO">Agitado</option>
                                                <option value="BRAVO">Bravo/Agressivo</option>
                                                <option value="MEDROSO">Medroso</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <h4 className="font-bold text-gray-400 text-xs uppercase mb-2">Saúde e Condições</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="label">Doenças / Condições</label>
                                                <input className="input-field" placeholder="Ex: Cardíaco, Displasia..." value={petFormData.healthIssues || ''} onChange={e => setPetFormData({ ...petFormData, healthIssues: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="label">Alergias</label>
                                                <input className="input-field" placeholder="Ex: Shampoo, Carne..." value={petFormData.allergies || ''} onChange={e => setPetFormData({ ...petFormData, allergies: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-200">
                                                <input type="checkbox" checked={petFormData.hasKnots || false} onChange={e => setPetFormData({ ...petFormData, hasKnots: e.target.checked })} className="accent-primary w-4 h-4" />
                                                <span className="text-sm text-secondary">Tem Nós</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-200">
                                                <input type="checkbox" checked={petFormData.hasMattedFur || false} onChange={e => setPetFormData({ ...petFormData, hasMattedFur: e.target.checked })} className="accent-primary w-4 h-4" />
                                                <span className="text-sm text-secondary">Tem Embolos</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <h4 className="font-bold text-gray-400 text-xs uppercase mb-2">Preferências</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-200">
                                                <input type="checkbox" checked={petFormData.usesPerfume || false} onChange={e => setPetFormData({ ...petFormData, usesPerfume: e.target.checked })} className="accent-primary w-4 h-4" />
                                                <span className="text-sm text-secondary">Pode usar Perfume</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-gray-200">
                                                <input type="checkbox" checked={petFormData.usesOrnaments || false} onChange={e => setPetFormData({ ...petFormData, usesOrnaments: e.target.checked })} className="accent-primary w-4 h-4" />
                                                <span className="text-sm text-secondary">Pode por Enfeites</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Observações Gerais</label>
                                        <textarea className="input-field h-24" placeholder="Outros detalhes importantes..." value={petFormData.observations || ''} onChange={e => setPetFormData({ ...petFormData, observations: e.target.value })} />
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                        <button type="button" onClick={() => setIsPetModalOpen(false)} className="btn-secondary">Cancelar</button>
                                        <LoadingButton
                                            type="submit"
                                            isLoading={isSaving}
                                            loadingText="Salvando..."
                                        >
                                            Salvar Alterações
                                        </LoadingButton>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }

                {/* QUOTE DETAILS MODAL */}
                <AnimatePresence>
                    {isQuoteModalOpen && selectedQuote && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-secondary/60 backdrop-blur-md"
                                onClick={() => setIsQuoteModalOpen(false)}
                            ></motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-3xl relative z-10 shadow-2xl overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-purple-500 to-primary"></div>

                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                                                <FileText size={24} />
                                            </div>
                                            <h2 className="text-3xl font-black text-secondary">Detalhes do Orçamento</h2>
                                        </div>
                                        <p className="text-gray-400 font-bold tracking-widest uppercase text-[10px]">Identificador: #{selectedQuote.id.toUpperCase()}</p>
                                    </div>
                                    <button onClick={() => setIsQuoteModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X size={24} className="text-gray-300" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Status e Ações</p>
                                            <div className="flex flex-wrap gap-2">
                                                {statuses.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => updateQuoteStatus(selectedQuote.id, s)}
                                                        className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${selectedQuote.status === s ? getQuoteStatusColor(s) + ' border-current' : 'bg-white text-gray-300 border-gray-100 hover:border-gray-200 hover:text-gray-400'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleQuoteWhatsApp(selectedQuote)}
                                                className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-200"
                                            >
                                                <MessageCircle size={18} /> WhatsApp
                                            </button>
                                            <button
                                                onClick={() => handlePrintQuote(selectedQuote)}
                                                className="flex-1 py-4 bg-gray-100 text-secondary rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                                            >
                                                <Printer size={18} /> Imprimir
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-secondary text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <FileText size={120} />
                                        </div>
                                        <div className="relative z-10 flex flex-col h-full justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Itens do Orçamento</p>
                                                <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                                                    {(selectedQuote.items || []).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center border-b border-white/10 pb-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold">{item.description}</span>
                                                                <span className="text-[10px] text-gray-400">{item.quantity}x R$ {item.price.toFixed(2)}</span>
                                                            </div>
                                                            <span className="font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pt-6 border-t border-white/20 mt-6">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-bold">Total</span>
                                                    <span className="text-3xl font-black text-primary">R$ {selectedQuote.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                                    7Pet MVP • Sistema de Gestão Inteligente
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main >
        </div >
    );
}
