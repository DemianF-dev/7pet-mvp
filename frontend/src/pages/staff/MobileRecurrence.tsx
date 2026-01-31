import {
    History,
    Search,
    Plus,
    Truck,
    Sparkles,
    ChevronRight,
    User as UserIcon
} from 'lucide-react';
import { MobileShell } from '../../layouts/MobileShell';
import { Card, Badge, IconButton } from '../../components/ui';

interface Contract {
    id: string;
    customerId: string;
    customer?: { name: string };
    title: string;
    frequency: string;
    status: string;
}

interface MobileRecurrenceProps {
    contracts: Contract[];
    isLoading: boolean;
    activeTab: 'SPA' | 'TRANSPORTE';
    onTabChange: (tab: 'SPA' | 'TRANSPORTE') => void;
    searchTerm: string;
    onSearch: (term: string) => void;
    onNewContract: () => void;
    onOpenWizard: (customerId: string, contractId?: string) => void;
    onViewCustomer: (id: string) => void;
}

export const MobileRecurrence = ({
    contracts,
    isLoading,
    activeTab,
    onTabChange,
    searchTerm,
    onSearch,
    onNewContract,
    onOpenWizard,
    onViewCustomer
}: MobileRecurrenceProps) => {
    return (
        <MobileShell
            title="Recorrentes"
            rightAction={<IconButton icon={Plus} onClick={onNewContract} variant="ghost" aria-label="Novo Contrato" />}
        >
            <div className="space-y-6 pb-24">
                {/* Type Toggle */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1.5 rounded-[20px]">
                    <button
                        onClick={() => onTabChange('SPA')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'SPA'
                            ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm'
                            : 'text-gray-400'
                            }`}
                    >
                        <Sparkles size={18} /> SPA
                    </button>
                    <button
                        onClick={() => onTabChange('TRANSPORTE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'TRANSPORTE'
                            ? 'bg-white dark:bg-zinc-700 text-orange-600 shadow-sm'
                            : 'text-gray-400'
                            }`}
                    >
                        <Truck size={18} /> Logística
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente ou contrato..."
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                {/* Contracts List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sincronizando contratos...</p>
                        </div>
                    ) : contracts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-10">
                            <History size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-bold text-gray-600">Nenhum contrato recorrente</p>
                            <p className="text-xs mt-1">Crie um novo contrato para este tipo de serviço.</p>
                        </div>
                    ) : (
                        contracts.map((contract) => (
                            <Card key={contract.id} className="!p-4" onClick={() => onViewCustomer(contract.customerId)}>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                                        <UserIcon size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{contract.customer?.name}</h3>
                                            <Badge variant={contract.status === 'ATIVO' ? 'success' : 'warning'} className="text-[8px] px-1.5 py-0 font-black leading-none h-auto">
                                                {contract.status}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{contract.title}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl mb-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequência</span>
                                    <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">{contract.frequency}</span>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenWizard(contract.customerId, contract.id); }}
                                    className="w-full h-12 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    Gerar Novo Pacote <ChevronRight size={16} />
                                </button>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </MobileShell>
    );
};
