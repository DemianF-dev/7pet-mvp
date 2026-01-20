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
    XCircle
} from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';
import BackButton from '../../components/BackButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import ResponsiveTable, { Column } from '../../components/system/ResponsiveTable';
import { Container, Stack } from '../../components/layout/LayoutHelpers';
import Badge from '../../components/ui/Badge';
import { IconButton } from '../../components/ui/IconButton';
import Card from '../../components/ui/Card';

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
    customer: {
        name: string;
    };
    appointment?: {
        services: { name: string }[];
    };
}

export default function FinancialReports() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [columnFilters, setColumnFilters] = useState({
        id: '',
        customer: '',
        date: '',
        amount: '',
        status: ''
    });

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const query = new URLSearchParams();
            if (dateRange.start) query.append('start', dateRange.start);
            if (dateRange.end) query.append('end', dateRange.end);

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
    }, []);

    const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => {
        const matchesGlobal = inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesId = !columnFilters.id || inv.id.toLowerCase().includes(columnFilters.id.toLowerCase());
        const matchesCustomer = !columnFilters.customer || inv.customer.name.toLowerCase().includes(columnFilters.customer.toLowerCase());
        const matchesDate = !columnFilters.date || new Date(inv.createdAt).toLocaleDateString('pt-BR').includes(columnFilters.date);
        const matchesAmount = !columnFilters.amount || inv.amount.toString().includes(columnFilters.amount);
        const matchesStatus = !columnFilters.status || inv.status.toLowerCase().includes(columnFilters.status.toLowerCase());

        return matchesGlobal && matchesId && matchesCustomer && matchesDate && matchesAmount && matchesStatus;
    }) : [];

    const currentTotal = filteredInvoices.reduce((acc, curr) => acc + curr.amount, 0);

    const totalRevenue = filteredInvoices
        .filter(inv => inv.status === 'PAGO')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const columns: Column<Invoice>[] = [
        {
            header: 'Fatura',
            key: 'id',
            render: (inv) => <span className="font-bold text-gray-400 text-xs">#{inv.id.slice(0, 8)}</span>
        },
        {
            header: 'Cliente',
            key: 'customer',
            render: (inv) => (
                <div className="flex flex-col">
                    <span className="font-black text-secondary text-sm">{inv.customer.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[200px]">
                        {inv.appointment?.services.map(s => s.name).join(', ') || 'Sem serviços vinculados'}
                    </span>
                </div>
            )
        },
        {
            header: 'Data',
            key: 'createdAt',
            render: (inv) => <span className="text-xs font-bold text-gray-500">{new Date(inv.createdAt).toLocaleDateString('pt-BR')}</span>
        },
        {
            header: 'Valor',
            key: 'amount',
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
            render: () => (
                <button className="text-gray-300 hover:text-primary transition-colors">
                    <ChevronRight size={20} />
                </button>
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
                            <h1 className="text-4xl font-extrabold text-secondary tracking-tight">Relatórios <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Financeiros</span></h1>
                            <p className="text-gray-500 mt-3 font-medium">Controle de faturamento, cobranças e histórico de pagamentos.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
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
                            data={filteredInvoices}
                            isLoading={isLoading}
                            keyExtractor={(inv) => inv.id}
                            emptyMessage="Nenhuma transação encontrada no filtro."
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
        </Container>
    );
}
