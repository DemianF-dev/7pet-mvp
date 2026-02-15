import {
    DollarSign,
    Users,
    AlertCircle,
    Activity,
    RefreshCw,
    Clock,
    TrendingUp
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, Badge, IconButton } from '../../components/ui';

interface MobileManagementProps {
    kpis: any;
    isLoading: boolean;
    onRefresh: () => void;
}

export const MobileManagement = ({ kpis, isLoading, onRefresh }: MobileManagementProps) => {
    return (
        <MobileShell
            title="Gestão"
            rightAction={
                <IconButton
                    icon={RefreshCw}
                    onClick={onRefresh}
                    className={isLoading ? 'animate-spin' : ''}
                    variant="ghost"
                    aria-label="Atualizar"
                />
            }
        >
            <div className="space-y-6 pb-24">
                {/* Primary KPIs */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Receita</p>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">
                                R$ {(kpis?.revenue?.current || 0).toLocaleString('pt-BR')}
                            </h3>
                        </div>
                    </Card>

                    <Card className="p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Activity size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Ticket Médio</p>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">
                                R$ {(kpis?.ticketMedio || 0).toLocaleString('pt-BR')}
                            </h3>
                        </div>
                    </Card>

                    <Card className="p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">No-Show</p>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">
                                {(kpis?.noShowRate || 0)}%
                            </h3>
                        </div>
                    </Card>

                    <Card className="p-4 flex flex-col gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Pendente</p>
                            <h3 className="text-lg font-bold text-gray-900 leading-none">
                                R$ {(kpis?.pendingBalance || 0).toLocaleString('pt-BR')}
                            </h3>
                        </div>
                    </Card>
                </div>

                {/* Growth Section */}
                <Card className="p-6 bg-zinc-900 text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={20} className="text-blue-500" />
                            <h4 className="text-xs font-bold uppercase tracking-widest">Crescimento Mensal</h4>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{kpis?.revenue?.growth?.toFixed(1) || '0.0'}%</span>
                            <span className="text-xs font-bold text-gray-400 uppercase">vs mês ant.</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-4 leading-relaxed font-medium">
                            Seu desempenho financeiro está {kpis?.revenue?.growth >= 0 ? 'acima' : 'abaixo'} da média do período anterior.
                        </p>
                    </div>
                    <TrendingUp size={140} className="absolute -right-8 -bottom-8 text-white opacity-5" />
                </Card>

                {/* Popular Services - Simplified List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Serviços Populares</h3>
                    <Card className="p-2">
                        {(kpis?.services || []).slice(0, 5).map((s: any, idx: number) => (
                            <div key={idx} className={`flex items-center justify-between p-3 ${idx !== 4 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        #{idx + 1}
                                    </div>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate uppercase">{s.name}</span>
                                </div>
                                <Badge variant="neutral" className="font-bold">{s.count}</Badge>
                            </div>
                        ))}
                    </Card>
                </div>

                {/* Top Customers */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Top Clientes</h3>
                    <div className="space-y-2">
                        {(kpis?.topCustomers || []).map((c: any, idx: number) => (
                            <Card key={idx} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
                                        {c.name.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">{c.name}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cliente Premium</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-blue-600">
                                        R$ {c.totalSpent.toLocaleString('pt-BR')}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </MobileShell>
    );
};
