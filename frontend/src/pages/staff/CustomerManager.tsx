import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    User,
    Phone,
    MapPin,
    CheckSquare,
    Square,
    RefreshCcw,
    Edit2,
    Trash2,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    type: 'AVULSO' | 'RECORRENTE';
    _count: {
        appointments: number;
        quotes: number;
    };
}

export default function CustomerManager() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredCustomers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredCustomers.map(c => c.id));
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir os ${selectedIds.length} clientes selecionados e seus pets?`)) return;
        try {
            await api.post('/customers/bulk-delete', { ids: selectedIds });
            fetchCustomers();
            setSelectedIds([]);
        } catch (error) {
            alert('Erro ao excluir clientes');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                                GESTÃO DE RELACIONAMENTO
                            </div>
                            <h1 className="text-4xl font-black text-secondary tracking-tight">Clientes</h1>
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
                                    placeholder="Buscar cliente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-80 transition-all font-bold"
                                />
                            </div>

                            <button className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 uppercase text-xs tracking-widest transition-all">
                                <Plus size={20} /> Novo Cliente
                            </button>
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
                                    {selectedIds.length === filteredCustomers.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">
                            <RefreshCcw className="animate-spin text-primary mx-auto" size={48} />
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px] bg-white">
                            <User className="mx-auto text-gray-200 mb-4" size={64} />
                            <p className="text-gray-400 font-bold">Nenhum cliente encontrado.</p>
                        </div>
                    ) : filteredCustomers.map(customer => (
                        <motion.div
                            layout
                            key={customer.id}
                            className={`group bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:border-primary/20 transition-all relative overflow-hidden ${selectedIds.includes(customer.id) ? 'ring-2 ring-primary' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-secondary uppercase tracking-tight leading-tight">{customer.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${customer.type === 'RECORRENTE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {customer.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {(isBulkMode || selectedIds.includes(customer.id)) && (
                                        <button
                                            onClick={(e) => toggleSelect(customer.id, e)}
                                            className={`p-2 rounded-xl transition-all shadow-md border ${selectedIds.includes(customer.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100 hover:text-primary'}`}
                                        >
                                            {selectedIds.includes(customer.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                        </button>
                                    )}
                                    <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <Phone size={14} className="text-primary" />
                                    <span className="text-sm font-bold">{customer.phone || 'Sem telefone'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <MapPin size={14} className="text-primary" />
                                    <span className="text-sm font-bold truncate">{customer.address || 'Endereço não informado'}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-50 mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Agendamentos</p>
                                    <p className="text-xl font-black text-secondary">{customer._count.appointments}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Orçamentos</p>
                                    <p className="text-xl font-black text-secondary">{customer._count.quotes}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/staff/customers/${customer.id}`)}
                                className="w-full py-4 bg-gray-50 hover:bg-primary hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest text-secondary transition-all flex items-center justify-center gap-2 group/btn"
                            >
                                Ver Ficha Completa
                                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
