import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, TrendingUp, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../../../../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PayrollPreviewProps {
    staffId: string;
}

export const PayrollPreview: React.FC<PayrollPreviewProps> = ({ staffId }) => {
    const [period, setPeriod] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0] // Today
    });

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    const loadPreview = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/staff/${staffId}/payroll/preview`, {
                params: {
                    startDate: period.startDate,
                    endDate: period.endDate
                }
            });
            setData(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (staffId) loadPreview();
    }, [staffId, period]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    if (!data && loading) return <div className="p-8 text-center text-slate-400">Carregando prévia...</div>;
    if (!data) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-emerald-600" />
                        Extrato em Tempo Real
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Ganhos estimados para o período selecionado.</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <input
                        type="date"
                        value={period.startDate}
                        onChange={e => setPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                        className="p-2 text-xs font-bold text-slate-600 outline-none bg-transparent"
                    />
                    <span className="text-slate-300">-</span>
                    <input
                        type="date"
                        value={period.endDate}
                        onChange={e => setPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                        className="p-2 text-xs font-bold text-slate-600 outline-none bg-transparent"
                    />
                </div>
            </div>

            <div className="p-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Total a Receber</div>
                        <div className="text-2xl font-black text-indigo-900 tracking-tight">{formatCurrency(data.totalDue)}</div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diárias/Fixo</div>
                        <div className="text-lg font-bold text-slate-700">
                            {formatCurrency((data.earnings.daily?.total || 0) + (data.earnings.fixed?.total || 0))}
                        </div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transportes</div>
                        <div className="text-lg font-bold text-slate-700">{formatCurrency(data.earnings.legs?.total)}</div>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Comissões</div>
                        <div className="text-lg font-bold text-slate-700">{formatCurrency(data.earnings.commissions?.total)}</div>
                    </div>
                </div>

                {/* Detailed List */}
                <div className="space-y-4">
                    {/* Daily */}
                    {(data.earnings.daily?.count > 0) && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('daily')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    <Calendar size={16} className="text-slate-400" />
                                    Diárias ({data.earnings.daily.count})
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-800">{formatCurrency(data.earnings.daily.total)}</span>
                                    {expandedSection === 'daily' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {expandedSection === 'daily' && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden bg-white"
                                    >
                                        <div className="p-0">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                                    <tr>
                                                        <th className="p-3 font-semibold">Data</th>
                                                        <th className="p-3 font-semibold">Tipo</th>
                                                        <th className="p-3 font-semibold text-right">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.earnings.daily.details.map((item: any, i: number) => (
                                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                                            <td className="p-3 text-slate-600 font-medium">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                                            <td className="p-3 text-slate-500">{item.type}</td>
                                                            <td className="p-3 text-slate-800 font-bold text-right">{formatCurrency(item.value)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Legs */}
                    {(data.earnings.legs?.count > 0) && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('legs')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    <TrendingUp size={16} className="text-slate-400" />
                                    Transportes ({data.earnings.legs.count})
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-800">{formatCurrency(data.earnings.legs.total)}</span>
                                    {expandedSection === 'legs' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {expandedSection === 'legs' && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden bg-white"
                                    >
                                        <div className="p-0">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                                    <tr>
                                                        <th className="p-3 font-semibold">Data</th>
                                                        <th className="p-3 font-semibold">Tipo</th>
                                                        <th className="p-3 font-semibold">Obs</th>
                                                        <th className="p-3 font-semibold text-right">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.earnings.legs.details.map((item: any, i: number) => (
                                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                                            <td className="p-3 text-slate-600 font-medium">{format(new Date(item.date), 'dd/MM/yyyy HH:mm')}</td>
                                                            <td className="p-3 text-slate-500">{item.type}</td>
                                                            <td className="p-3 text-slate-400 italic max-w-[200px] truncate">{item.notes || '-'}</td>
                                                            <td className="p-3 text-slate-800 font-bold text-right">{formatCurrency(item.value)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Commissions */}
                    {(data.earnings.commissions?.count > 0) && (
                        <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <button
                                onClick={() => toggleSection('commissions')}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                    <DollarSign size={16} className="text-slate-400" />
                                    Comissões ({data.earnings.commissions.count})
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-slate-800">{formatCurrency(data.earnings.commissions.total)}</span>
                                    {expandedSection === 'commissions' ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {expandedSection === 'commissions' && (
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: 'auto' }}
                                        exit={{ height: 0 }}
                                        className="overflow-hidden bg-white"
                                    >
                                        <div className="p-0">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                                    <tr>
                                                        <th className="p-3 font-semibold">Data</th>
                                                        <th className="p-3 font-semibold">Serviço</th>
                                                        <th className="p-3 font-semibold text-right">Valor</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.earnings.commissions.details.map((item: any, i: number) => (
                                                        <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                                            <td className="p-3 text-slate-600 font-medium">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                                            <td className="p-3 text-slate-500">{item.service}</td>
                                                            <td className="p-3 text-slate-800 font-bold text-right">{formatCurrency(item.value)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
