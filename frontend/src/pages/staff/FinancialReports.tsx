import { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Filter,
    Search,
    ChevronRight,
    Calendar as CalendarIcon,
    CheckCircle,
    Clock,
    XCircle,
    X
} from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import ResponsiveTable, { Column } from '../../components/system/ResponsiveTable';
import { Stack } from '../../components/layout/LayoutHelpers';
import Badge from '../../components/ui/Badge';
import OrderDetailsModal from '../../components/staff/OrderDetailsModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import QuoteEditor from './QuoteEditor';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileFinancial } from './MobileFinancial';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

interface Invoice {
    id: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    customerId: string;
    customer: {
        id: string;
        name: string;
    };
    appointment?: any;
    quotes?: { id: string }[];
    isPOS?: boolean;
}

export default function FinancialReports() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [source, setSource] = useState('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });

    // Selection States
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
    const [selectedAppointmentData, setSelectedAppointmentData] = useState<any>(null);
    const { isMobile } = useIsMobile();

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (dateRange.start) query.append('start', dateRange.start);
            if (dateRange.end) query.append('end', dateRange.end);
            if (source !== 'all') query.append('source', source);

            const response = await api.get(`/management/reports?${query.toString()}`);
            setInvoices(response.data);
        } catch (err) {
            console.error('Erro ao buscar relatórios:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange.start, dateRange.end, source]);

    const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => {
        const matchesGlobal = inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesGlobal;
    }) : [];

    const sortedInvoices = [...filteredInvoices].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let valA: any = (a as any)[key];
        let valB: any = (b as any)[key];

        if (key === 'customer') {
            valA = a.customer.name;
            valB = b.customer.name;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const currentTotal = filteredInvoices.reduce((acc, curr) => acc + curr.amount, 0);

    const totalRevenue = filteredInvoices
        .filter(inv => inv.status === 'PAGO')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const handleOpenDetails = (inv: Invoice) => {
        if (inv.isPOS) {
            setSelectedOrderId(inv.id);
        } else if (inv.appointment) {
            setSelectedAppointmentData(inv.appointment);
        } else if (inv.quotes && inv.quotes.length > 0) {
            setSelectedQuoteId(inv.quotes[0].id);
        }
    };

    const columns: Column<Invoice>[] = [
        {
            header: 'Fatura/Venda',
            key: 'id',
            render: (inv) => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-400 text-xs">#{inv.id.slice(0, 8)}</span>
                    {inv.isPOS && <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-full w-fit mt-1">PDV</span>}
                </div>
            )
        },
        {
            header: 'Cliente',
            key: 'customer',
            render: (inv) => (
                <div className="flex flex-col">
                    <span className="font-black text-secondary text-sm">{inv.customer.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">
                        {inv.appointment?.services?.map((s: any) => s.name).join(', ') || 'Sem serviços vinculados'}
                    </span>
                </div>
            )
        },
        {
            header: 'Data',
            key: 'createdAt',
            sortable: true,
            render: (inv) => <span className="text-xs font-bold text-gray-500">{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
        },
        {
            header: 'Valor',
            key: 'amount',
            sortable: true,
            render: (inv) => <span className="text-sm font-black text-secondary">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        },
        {
            header: 'Status',
            key: 'status',
            render: (inv) => {
                const Icon = inv.status === 'PAGO' ? CheckCircle : inv.status === 'ATRASADO' ? XCircle : Clock;
                return (
                    <Badge variant={inv.status === 'PAGO' ? 'success' : inv.status === 'ATRASADO' ? 'error' : 'warning'}>
                        <Icon size={12} />
                        {inv.status}
                    </Badge>
                );
            }
        },
        {
            header: '',
            key: 'actions',
            className: 'text-right',
            render: (inv) => (
                <button
                    className="text-gray-300 hover:text-primary transition-colors"
                    onClick={() => handleOpenDetails(inv)}
                >
                    <ChevronRight size={20} />
                </button>
            )
        }
    ];

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    if (isMobile) {
        return (
            <>
                <MobileFinancial
                    invoices={sortedInvoices}
                    isLoading={isLoading}
                    searchTerm={searchTerm}
                    onSearch={setSearchTerm}
                    currentTotal={currentTotal}
                    totalRevenue={totalRevenue}
                    onOpenDetails={handleOpenDetails}
                />

                {/* Modals are still needed for mobile details */}
                <AnimatePresence>
                    {selectedOrderId && (
                        <OrderDetailsModal
                            isOpen={!!selectedOrderId}
                            onClose={() => setSelectedOrderId(null)}
                            orderId={selectedOrderId}
                            onActionCompleted={fetchReports}
                        />
                    )}
                    {selectedAppointmentData && (
                        <AppointmentDetailsModal
                            isOpen={!!selectedAppointmentData}
                            onClose={() => setSelectedAppointmentData(null)}
                            appointment={selectedAppointmentData}
                            onSuccess={fetchReports}
                            onModify={() => { }}
                            onCopy={() => { }}
                        />
                    )}
                    {selectedQuoteId && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                onClick={() => setSelectedQuoteId(null)}
                            />
                            <motion.div
                                initial={{ y: '100%', opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: '100%', opacity: 0 }}
                                className="bg-white dark:bg-gray-800 rounded-t-[40px] w-full h-[90vh] overflow-y-auto relative z-10 shadow-2xl border-t border-gray-100 dark:border-gray-700 p-6 self-end"
                            >
                                <button
                                    onClick={() => setSelectedQuoteId(null)}
                                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all text-gray-400 z-[110]"
                                >
                                    <X size={24} />
                                </button>
                                <QuoteEditor
                                    quoteId={selectedQuoteId}
                                    onClose={() => setSelectedQuoteId(null)}
                                    onUpdate={fetchReports}
                                />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="w-full max-w-7xl">
            <Stack gap={10} className="py-10">
                <header>
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Relatórios <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Financeiros</span></h1>
                            <p className="text-gray-500 mt-3 font-medium">Controle de faturamento, cobranças e histórico de pagamentos.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                                <select
                                    className="text-xs font-bold border-none bg-transparent focus:ring-0 cursor-pointer uppercase tracking-widest text-[#5E4C4C]/60"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                >
                                    <option value="all">TODAS AÇÕES</option>
                                    <option value="invoice">FATURAS</option>
                                    <option value="pos">PDV (PEDIDOS)</option>
                                </select>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="text-xs font-bold border-none focus:ring-0 bg-transparent p-0"
                                    />
                                </div>
                                <span className="text-gray-300">|</span>
                                <div className="flex items-center gap-2">
                                    <CalendarIcon size={16} className="text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="text-xs font-bold border-none focus:ring-0 bg-transparent p-0"
                                    />
                                </div>
                                <button
                                    onClick={fetchReports}
                                    className="bg-primary/10 text-primary p-2 rounded-xl hover:bg-primary/20 transition-all"
                                >
                                    <Filter size={18} />
                                </button>
                            </div>

                            <button className="bg-secondary text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm">
                                <Download size={18} /> Exportar CSV
                            </button>
                        </div>
                    </div>
                </header>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                >
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Faturamento Filtrado (Pago)</p>
                        <h3 className="text-3xl font-black text-secondary">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </motion.div>
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cobranças Pendentes</p>
                        <h3 className="text-3xl font-black text-orange-500">
                            {filteredInvoices.filter(i => i.status === 'PENDENTE').length} faturas
                        </h3>
                    </motion.div>
                    <motion.div variants={itemVariants} className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Média por Serviço</p>
                        <h3 className="text-3xl font-black text-primary">
                            R$ {(totalRevenue / (filteredInvoices.length || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </h3>
                    </motion.div>
                </motion.div>

                <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
                        <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Transações
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar fatura ou cliente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 pr-4 py-3 bg-white border border-transparent rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-full md:w-80 transition-all font-medium"
                            />
                        </div>
                    </div>

                    <div className="p-8">
                        <ResponsiveTable
                            columns={columns}
                            data={sortedInvoices}
                            isLoading={isLoading}
                            keyExtractor={(inv) => inv.id}
                            emptyMessage="Nenhuma transação encontrada no filtro."
                            sortConfig={sortConfig}
                            onSort={handleSort}
                            onRowClick={handleOpenDetails}
                        />
                    </div>

                    {filteredInvoices.length > 0 && (
                        <div className="p-8 bg-secondary text-white flex items-center justify-between rounded-b-[40px]">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Selecionado em Tela</span>
                            <span className="text-xl font-black">R$ {currentTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                </div>
            </Stack>

            {/* Modal Components */}
            <AnimatePresence>
                {/* 1. POS Order Details */}
                {selectedOrderId && (
                    <OrderDetailsModal
                        isOpen={!!selectedOrderId}
                        onClose={() => setSelectedOrderId(null)}
                        orderId={selectedOrderId}
                        onActionCompleted={fetchReports}
                    />
                )}

                {/* 2. Appointment Details */}
                {selectedAppointmentData && (
                    <AppointmentDetailsModal
                        isOpen={!!selectedAppointmentData}
                        onClose={() => setSelectedAppointmentData(null)}
                        appointment={selectedAppointmentData}
                        onSuccess={fetchReports}
                        onModify={() => { }}
                        onCopy={() => { }}
                    />
                )}

                {/* 3. Quote Editor (Modal Mode) */}
                {selectedQuoteId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setSelectedQuoteId(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl border border-gray-100 dark:border-gray-700 p-8"
                        >
                            <button
                                onClick={() => setSelectedQuoteId(null)}
                                className="absolute top-8 right-8 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all text-gray-400 z-[110]"
                            >
                                <X size={24} />
                            </button>
                            <QuoteEditor
                                quoteId={selectedQuoteId}
                                onClose={() => setSelectedQuoteId(null)}
                                onUpdate={fetchReports}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
