import {
    Download,
    Search,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, Badge, IconButton } from '../../components/ui';

interface Invoice {
    id: string;
    amount: number;
    status: string;
    dueDate: string;
    createdAt: string;
    customer: { name: string };
    isPOS?: boolean;
}

interface MobileFinancialProps {
    invoices: Invoice[];
    isLoading: boolean;
    searchTerm: string;
    onSearch: (term: string) => void;
    currentTotal: number;
    totalRevenue: number;
    onOpenDetails: (inv: Invoice) => void;
}

export const MobileFinancial = ({
    invoices,
    isLoading,
    searchTerm,
    onSearch,
    currentTotal,
    totalRevenue,
    onOpenDetails
}: MobileFinancialProps) => {
    return (
        <MobileShell
            title="Financeiro"
            rightAction={<IconButton icon={Download} onClick={() => { }} variant="ghost" aria-label="Exportar" />}
        >
            <div className="space-y-6 pb-24">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="p-4 bg-emerald-600 text-white border-none">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Recebido</p>
                        <h3 className="text-lg font-black leading-none">R$ {totalRevenue.toLocaleString('pt-BR')}</h3>
                    </Card>
                    <Card className="p-4 bg-zinc-900 text-white border-none">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Pendente</p>
                        <h3 className="text-lg font-black leading-none">R$ {(currentTotal - totalRevenue).toLocaleString('pt-BR')}</h3>
                    </Card>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar fatura ou cliente..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest px-1">Últimas Transações</h3>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-4">
                            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sincronizando faturas...</p>
                        </div>
                    ) : (
                        invoices.map((inv) => (
                            <Card
                                key={inv.id}
                                className="!p-4 active:scale-[0.98] transition-transform"
                                onClick={() => onOpenDetails(inv)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase">#{inv.id.slice(0, 8)}</span>
                                            {inv.isPOS && <Badge variant="neutral" className="bg-primary/10 text-primary text-[8px] px-1 py-0 font-black leading-none h-auto">PDV</Badge>}
                                        </div>
                                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{inv.customer.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                            {new Date(inv.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-black text-gray-900 dark:text-white mb-1">R$ {inv.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                        <div className={`flex items-center justify-end gap-1 text-[9px] font-black uppercase ${inv.status === 'PAGO' ? 'text-emerald-500' : inv.status === 'ATRASADO' ? 'text-red-500' : 'text-amber-500'}`}>
                                            {inv.status === 'PAGO' ? <CheckCircle size={10} /> : inv.status === 'ATRASADO' ? <XCircle size={10} /> : <Clock size={10} />}
                                            {inv.status}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </MobileShell>
    );
};
