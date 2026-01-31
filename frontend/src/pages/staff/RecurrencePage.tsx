import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
    History,
    Search,
    Plus,
    Truck,
    Sparkles,
    ChevronRight,
    User
} from 'lucide-react';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import PackageCreationWizard from '../../components/PackageCreationWizard';
import PackageInvoiceDetails from './PackageInvoiceDetails';
import NewRecurrenceContract from './NewRecurrenceContract';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileRecurrence } from './MobileRecurrence';

// Helper component for the list of recurring clients
const RecurringList = ({
    type,
    onOpenWizard
}: {
    type: 'SPA' | 'TRANSPORTE',
    onTabChange: (type: 'SPA' | 'TRANSPORTE') => void,
    onOpenWizard: (customerId: string, contractId?: string) => void
}) => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchContracts = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/recurrence/contracts`, {
                    params: { type }
                });
                setContracts(response.data);
            } catch (error) {
                console.error('Error fetching contracts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContracts();
    }, [type]);

    const filtered = contracts.filter(c =>
        c.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const { isMobile } = useIsMobile();

    if (isMobile) {
        return (
            <MobileRecurrence
                contracts={filtered}
                isLoading={loading}
                activeTab={type}
                onTabChange={onTabChange}
                searchTerm={searchTerm}
                onSearch={setSearchTerm}
                onNewContract={() => navigate('/staff/recurrence/new-contract', { state: { type } })}
                onOpenWizard={onOpenWizard}
                onViewCustomer={(id) => navigate(`/staff/customers/${id}`)}
            />
        );
    }



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-body-secondary" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente ou contrato..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-bg-surface focus:ring-2 focus:ring-accent outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => navigate('/staff/recurrence/new-contract', { state: { type } })}
                    className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-lg"
                >
                    <Plus size={18} /> Novo Contrato
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-bg-surface border border-dashed border-border rounded-2xl">
                    <History className="mx-auto text-body-secondary mb-4 opacity-20" size={48} />
                    <p className="text-body-secondary mb-4">Nenhum cliente recorrente de {type} encontrado.</p>
                    <button
                        onClick={() => navigate('/staff/recurrence/new-contract', { state: { type } })}
                        className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl hover:opacity-90 transition-all shadow-lg font-bold"
                    >
                        <Plus size={18} /> Criar Primeiro Contrato
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(contract => (
                        <motion.div
                            key={contract.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-bg-surface border border-border p-5 rounded-2xl hover:border-accent transition-colors cursor-pointer group relative overflow-hidden"
                            onClick={() => navigate(`/staff/customers/${contract.customerId}`)}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                {type === 'SPA' ? <Sparkles size={40} /> : <Truck size={40} />}
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                    <User size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-heading truncate">{contract.customer?.name}</h3>
                                    <p className="text-xs text-body-secondary truncate">{contract.title}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-body-secondary">Frequência:</span>
                                    <span className="font-medium text-heading">{contract.frequency}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-body-secondary">Status:</span>
                                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${contract.status === 'ATIVO' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                        }`}>
                                        {contract.status}
                                    </span>
                                </div>
                            </div>

                            <button
                                className="w-full py-2 flex items-center justify-center gap-2 text-sm font-bold text-accent bg-accent/5 rounded-xl group-hover:bg-accent group-hover:text-white transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenWizard(contract.customerId, contract.id);
                                }}
                            >
                                Criar Pacote <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function RecurrencePage() {
    const [activeTab, setActiveTab] = useState<'SPA' | 'TRANSPORTE'>('SPA');
    const [wizardData, setWizardData] = useState<{ open: boolean, customerId?: string, contractId?: string } | null>(null);
    const navigate = useNavigate();
    const { isMobile } = useIsMobile();

    if (isMobile) {
        return (
            <>
                <main>
                    <Routes>
                        <Route index element={
                            <RecurringList
                                type={activeTab}
                                onTabChange={setActiveTab}
                                onOpenWizard={(customerId, contractId) => setWizardData({ open: true, customerId, contractId })}
                            />
                        } />
                        <Route path="new-contract" element={<NewRecurrenceContract />} />
                        <Route path="invoices/:id" element={<PackageInvoiceDetails />} />
                    </Routes>
                </main>

                <AnimatePresence>
                    {wizardData?.open && (
                        <PackageCreationWizard
                            customerId={wizardData.customerId!}
                            contractId={wizardData.contractId}
                            type={activeTab}
                            onClose={() => setWizardData(null)}
                            onSuccess={(invoice) => {
                                setWizardData(null);
                                navigate(`/staff/recurrence/invoices/${invoice.id}`);
                            }}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent/10 text-accent rounded-xl">
                        <History size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-heading uppercase tracking-tight">Recorrentes</h1>
                        <p className="text-body-secondary text-sm font-medium">Gestão de pacotes e contratos de assinatura</p>
                    </div>
                </div>
            </header>

            <nav className="flex items-center gap-2 p-1 bg-bg-surface border border-border rounded-2xl mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('SPA')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'SPA'
                        ? 'bg-accent text-white shadow-lg'
                        : 'text-body-secondary hover:bg-bg-subtle'
                        }`}
                >
                    <Sparkles size={18} /> SPA / Banho
                </button>
                <button
                    onClick={() => setActiveTab('TRANSPORTE')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'TRANSPORTE'
                        ? 'bg-accent text-white shadow-lg'
                        : 'text-body-secondary hover:bg-bg-subtle'
                        }`}
                >
                    <Truck size={18} /> Transporte
                </button>
            </nav>

            <main>
                <Routes>
                    <Route index element={
                        <RecurringList
                            type={activeTab}
                            onTabChange={setActiveTab}
                            onOpenWizard={(customerId, contractId) => setWizardData({ open: true, customerId, contractId })}
                        />
                    } />
                    <Route path="new-contract" element={<NewRecurrenceContract />} />
                    <Route path="invoices/:id" element={<PackageInvoiceDetails />} />
                </Routes>
            </main>

            <AnimatePresence>
                {wizardData?.open && (
                    <PackageCreationWizard
                        customerId={wizardData.customerId!}
                        contractId={wizardData.contractId}
                        type={activeTab}
                        onClose={() => setWizardData(null)}
                        onSuccess={(invoice) => {
                            setWizardData(null);
                            navigate(`/staff/recurrence/invoices/${invoice.id}`);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
