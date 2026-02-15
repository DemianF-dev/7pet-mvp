import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
    History,
    Search,
    ChevronLeft,
    ChevronRight,
    Calendar,
    ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PeriodSummaryList = () => {
    const navigate = useNavigate();
    const [period, setPeriod] = useState(new Date());
    const [summaries, setSummaries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/recurrence/period-summary`, {
                params: {
                    year: period.getFullYear(),
                    month: period.getMonth() + 1
                }
            });
            setSummaries(response.data);
        } catch (error) {
            console.error('Error fetching period summary:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [period]);

    const changeMonth = (delta: number) => {
        setPeriod(prev => delta > 0 ? addMonths(prev, delta) : subMonths(prev, Math.abs(delta)));
    };

    const filtered = summaries.filter(s =>
        s.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-bg-surface p-4 rounded-2xl border border-border shadow-sm">
                {/* Period Selector */}
                <div className="flex items-center gap-4 bg-bg-page px-4 py-2 rounded-xl border border-border">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:text-accent transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 min-w-[180px] justify-center font-bold text-heading">
                        <Calendar size={18} className="text-accent" />
                        <span className="capitalize">
                            {format(period, 'MMMM yyyy', { locale: ptBR })}
                        </span>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:text-accent transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bg-page focus:ring-2 focus:ring-accent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-bg-surface border border-dashed border-border rounded-2xl">
                    <History className="mx-auto text-body-secondary mb-4 opacity-20" size={48} />
                    <p className="text-body-secondary">Nenhum cliente com atividade recorrente neste período.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map(item => (
                        <div
                            key={item.customerId}
                            onClick={() => navigate(`/staff/recurrence/detail/${item.customerId}?year=${period.getFullYear()}&month=${period.getMonth() + 1}`)}
                            className="bg-bg-surface border border-border p-4 rounded-xl hover:border-accent transition-all cursor-pointer flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${item.status === 'FECHADA' ? 'bg-success' : 'bg-accent'
                                    }`}>
                                    {item.customerName.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-heading">{item.customerName}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === 'FECHADA' || item.status === 'EMITIDA'
                                            ? 'bg-success/10 text-success'
                                            : item.status === 'ABERTA'
                                                ? 'bg-accent/10 text-accent'
                                                : 'bg-body-secondary/10 text-body-secondary'
                                            }`}>
                                            {item.status || 'PENDENTE'}
                                        </span>
                                        {item.hasFormalContract && (
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                                                CONTRATO
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right hidden md:block">
                                    <span className="block text-xs text-body-secondary">Valor do Período</span>
                                    <span className="block font-bold text-heading">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                                    </span>
                                </div>
                                <ArrowRight className="text-body-secondary group-hover:text-accent transition-colors" size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

import RecurrencePeriodDetail from './RecurrencePeriodDetail';
import NewRecurrenceContract from './NewRecurrenceContract';
import PackageInvoiceDetails from './PackageInvoiceDetails';

export default function RecurrencePage() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <Routes>
                <Route index element={
                    <>
                        <header className="mb-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-accent/10 text-accent rounded-xl">
                                    <History size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-heading uppercase tracking-tight">Fechamento Mensal</h1>
                                    <p className="text-body-secondary text-sm font-medium">Gestão de faturamento de contratos e pacotes</p>
                                </div>
                            </div>
                        </header>
                        <main>
                            <PeriodSummaryList />
                        </main>
                    </>
                } />
                <Route path="detail/:customerId" element={<RecurrencePeriodDetail />} />
                <Route path="new-contract" element={<NewRecurrenceContract />} />
                <Route path="invoices/:id" element={<PackageInvoiceDetails />} />
            </Routes>
        </div>
    );
}
