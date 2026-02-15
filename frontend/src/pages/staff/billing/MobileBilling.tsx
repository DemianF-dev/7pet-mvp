import { useState, useEffect, useMemo } from 'react';
import {
    FileText, Search,
    ArrowUpRight, Clock, CheckCircle2, AlertTriangle,
    ChevronRight, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileShell } from '../../../layouts/MobileShell';
import api from '../../../services/api';
import InvoiceDetailsModal from '../../../components/staff/InvoiceDetailsModal';

export const MobileBilling = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

    const fetchInvoices = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/invoices');
            setInvoices(response.data);
        } catch (err) {
            console.error('Erro ao buscar faturas:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(i => {
            const matchesSearch = i.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
    }, [invoices, searchTerm, statusFilter]);

    const metrics = useMemo(() => {
        const pending = invoices.filter(i => i.status === 'PENDENTE').reduce((acc, i) => acc + i.amount, 0);
        const received = invoices.filter(i => i.status === 'PAGO').reduce((acc, i) => acc + i.amount, 0);
        return { pending, received };
    }, [invoices]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PAGO': return { label: 'Recebido', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 };
            case 'VENCIDO': return { label: 'Atrasado', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
            case 'FATURAR': return { label: 'A Faturar', color: 'text-orange-600 bg-orange-50', icon: Clock };
            default: return { label: 'Pendente', color: 'text-blue-600 bg-blue-50', icon: Clock };
        }
    };

    return (
        <MobileShell title="Financeiro">
            <div className="space-y-6 pb-20">
                {/* 1. Mini Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-900/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase opacity-70">Recebido</span>
                            <ArrowUpRight size={16} />
                        </div>
                        <p className="text-lg font-bold leading-none">R$ {metrics.received.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-900/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase opacity-70">Pendente</span>
                            <Clock size={16} />
                        </div>
                        <p className="text-lg font-bold leading-none">R$ {metrics.pending.toLocaleString('pt-BR')}</p>
                    </div>
                </div>

                {/* 2. Search & Filters */}
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="search"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm font-medium"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {['ALL', 'PENDENTE', 'PAGO', 'VENCIDO'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${statusFilter === s
                                    ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-gray-900 shadow-sm'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                    }`}
                            >
                                {s === 'ALL' ? 'TUDO' : s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. Invoices List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <FileText size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-medium">Nenhuma fatura encontrada.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredInvoices.map((inv) => {
                                const status = getStatusInfo(inv.status);
                                return (
                                    <motion.div
                                        key={inv.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mobile-card !p-4 active:scale-[0.98] transition-transform"
                                        onClick={() => setSelectedInvoiceId(inv.id)}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-col">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate max-w-[200px]">
                                                    {inv.customer.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                    <Calendar size={12} />
                                                    Vence {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${status.color}`}>
                                                <status.icon size={12} />
                                                {status.label}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</span>
                                                <span className="text-xl font-bold text-gray-900 dark:text-white">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <button className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-xl text-gray-400">
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedInvoiceId && (
                    <InvoiceDetailsModal
                        invoiceId={selectedInvoiceId}
                        onClose={() => setSelectedInvoiceId(null)}
                        onUpdate={fetchInvoices}
                    />
                )}
            </AnimatePresence>
        </MobileShell>
    );
};
