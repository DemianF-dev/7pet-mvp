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
    StickyNote,
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';

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
}

export default function CustomerManager() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
        try {
            await api.post('/customers', {
                ...formData,
                type: formData.type || 'AVULSO'
            });
            setIsCreateModalOpen(false);
            setFormData({});
            fetchCustomers();
            alert('Cliente cadastrado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao criar cliente:', error);
            alert(error.response?.data?.error || 'Erro ao criar cliente');
        }
    };

    const handleUpdateWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;
        try {
            const response = await api.patch(`/customers/${selectedCustomer.id}`, formData);
            setSelectedCustomer({ ...selectedCustomer, ...response.data });
            setIsEditMode(false);
            fetchCustomers(); // Refresh list to update scalar fields in list view if needed
            alert('Dados atualizados!');
        } catch (error: any) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar dados.');
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

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Gestão de <span className="text-primary">Clientes</span></h1>
                        <p className="text-gray-500">Visualize perfis, histórico e gerencie restrições de acesso.</p>
                    </div>
                    <button
                        onClick={() => { setFormData({}); setIsCreateModalOpen(true); }}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus size={20} /> Novo Cliente
                    </button>
                </header>

                <div className="flex gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none rounded-2xl pl-12 pr-4 py-4 text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
                        />
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
                                                        <div className="space-y-2">
                                                            <label className="label">Tipo de Cliente</label>
                                                            <select
                                                                className="input-field"
                                                                value={formData.type}
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
                                                        {formData.type === 'RECORRENTE' && (
                                                            <div className="col-span-2 grid grid-cols-2 gap-4 bg-purple-50 p-6 rounded-3xl border border-purple-100 animate-in zoom-in-95 duration-200">
                                                                <div className="space-y-2">
                                                                    <label className="label text-purple-700">Frequência Desejada</label>
                                                                    <select
                                                                        className="input-field bg-white border-purple-200"
                                                                        value={formData.recurringFrequency}
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
                                                                    <label className="label text-purple-700">Desconto Aplicado (%)</label>
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

                                                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                                                        <button type="button" onClick={() => setIsEditMode(false)} className="btn-secondary">Cancelar</button>
                                                        <button type="submit" className="btn-primary flex items-center gap-2"><Save size={18} /> Salvar Alterações</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        <div className="p-4 bg-gray-50 rounded-2xl">
                                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Telefone</p>
                                                            <div className="flex items-center gap-2 text-secondary font-bold">
                                                                <Phone size={16} className="text-primary" /> {selectedCustomer.phone || '-'}
                                                            </div>
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
                                                            <div className="col-span-1 md:col-span-2 lg:col-span-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                                                                        <TrendingDown size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">Plano de Recorrência</p>
                                                                        <p className="text-secondary font-black">{selectedCustomer.recurringFrequency || 'NÃO DEFINIDO'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest leading-none">Desconto Fixo</p>
                                                                    <p className="text-2xl font-black text-purple-600">{selectedCustomer.discountPercentage || 0}%</p>
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
                                            <h3 className="font-bold text-secondary text-lg mb-4 flex items-center gap-2">
                                                <FileText className="text-primary" /> Histórico de Orçamentos
                                            </h3>
                                            {isLoadingHistory ? (
                                                <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div></div>
                                            ) : historyData?.quotes?.length > 0 ? (
                                                historyData.quotes.map((quote: any) => (
                                                    <div key={quote.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-secondary">#{quote.id.substring(0, 8).toUpperCase()}</p>
                                                            <p className="text-xs text-gray-400">{new Date(quote.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-primary">R$ {quote.totalAmount.toFixed(2)}</p>
                                                            <span className="text-[10px] uppercase font-bold text-gray-400">{quote.status}</span>
                                                        </div>
                                                    </div>
                                                ))
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
                                        <input className="input-field" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
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

                                    {formData.type === 'RECORRENTE' && (
                                        <div className="space-y-4 bg-purple-50 p-4 rounded-2xl border border-purple-100 transition-all animate-in slide-in-from-top-2 duration-300">
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
                                                {formData.recurringFrequency === 'SEMANAL' && "Min. 4 banhos/mês. Desconto aplicado em todo o pacote."}
                                                {formData.recurringFrequency === 'QUINZENAL' && "Min. 2 banhos/mês. Desconto sobre o valor total."}
                                                {formData.recurringFrequency === 'MENSAL' && "1 banho/mês. Requer pagamento de 2 meses adiantados."}
                                            </div>
                                        </div>
                                    )}
                                    <div className="pt-4 flex justify-end gap-3">
                                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary">Cancelar</button>
                                        <button type="submit" className="btn-primary">Criar Cadastro</button>
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
                                        <button type="submit" className="btn-primary">Salvar Alterações</button>
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
