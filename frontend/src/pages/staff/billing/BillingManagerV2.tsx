
import { useState } from 'react';
import { FileText, PlusCircle, BookOpen } from 'lucide-react';
import InvoicesList from './InvoicesList';
import NewInvoice from './NewInvoice';
import LedgerView from './LedgerView';

export default function BillingManagerV2() {
    const [activeTab, setActiveTab] = useState<'invoices' | 'generate' | 'ledger'>('invoices');

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro V2</h1>
                    <p className="text-gray-500 text-sm">Gerenciamento de faturas e pagamentos</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-zinc-800 rounded-xl w-fit">
                <TabButton
                    active={activeTab === 'invoices'}
                    onClick={() => setActiveTab('invoices')}
                    icon={FileText}
                    label="Faturas"
                />
                <TabButton
                    active={activeTab === 'generate'}
                    onClick={() => setActiveTab('generate')}
                    icon={PlusCircle}
                    label="Gerar Fatura"
                />
                <TabButton
                    active={activeTab === 'ledger'}
                    onClick={() => setActiveTab('ledger')}
                    icon={BookOpen}
                    label="Extrato"
                />
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm min-h-[500px] p-6">
                {activeTab === 'invoices' && <InvoicesList />}
                {activeTab === 'generate' && <NewInvoice onSuccess={() => setActiveTab('invoices')} />}
                {activeTab === 'ledger' && <LedgerView />}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active
                    ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
        >
            <Icon size={16} />
            {label}
        </button>
    );
}
