import { useState } from 'react';
import {
    Search, Plus, User, Phone,
    MoreVertical, MessageCircle, Filter, Download, Calendar, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileShell } from '../../../layouts/MobileShell';
import { useCustomersList } from '../../../query/hooks/useCustomers';
import CustomerDetailsModal from '../../../components/staff/CustomerDetailsModal';
import { MobileFilters } from '../../../components/mobile/MobileFilters';
import { DataImportExport } from '../../../components/mobile/DataImportExport';

export const MobileCustomers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<'active' | 'trash'>('active');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showDataImportExport, setShowDataImportExport] = useState(false);

    const { data: customersData, isLoading } = useCustomersList(
        tab,
        {},
        { enabled: true }
    );

    const customers = customersData?.customers || [];

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const handleWhatsApp = (phone: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    const handleCall = (phone: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`tel:${phone}`, '_self');
    };

    return (
        <MobileShell
            title="Clientes"
            rightAction={
                <button
                    onClick={() => setSelectedCustomerId('new')}
                    className="p-2 text-blue-600 active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            }
        >
            <div className="space-y-4 pb-20">
                {/* 1. Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="search"
                        placeholder="Nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl pl-10 pr-16 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                            onClick={() => setShowFilters(true)}
                            className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            <Filter size={14} />
                        </button>
                        <button
                            onClick={() => setShowDataImportExport(true)}
                            className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                            <Download size={14} />
                        </button>
                    </div>
                </div>

                {/* 2. Tabs */}
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-2xl">
                    <button
                        onClick={() => setTab('active')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'active'
                                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500'
                            }`}
                    >
                        ATIVOS
                    </button>
                    <button
                        onClick={() => setTab('trash')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'trash'
                                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500'
                            }`}
                    >
                        LIXEIRA
                    </button>
                </div>

                {/* 3. List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <User size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-medium">Nenhum cliente encontrado.</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filteredCustomers.map((customer) => (
                                <motion.div
                                    key={customer.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mobile-card active:scale-[0.98] transition-transform"
                                    onClick={() => setSelectedCustomerId(customer.id)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight uppercase">
                                                    {customer.name}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${customer.type === 'RECORRENTE'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {customer.type === 'RECORRENTE' ? 'VIP' : 'AVULSO'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                        {customer.stats.totalAppointments} Serviços
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 text-gray-300">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>

                                    {customer.phone && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-zinc-800">
                                            <button
                                                onClick={(e) => handleWhatsApp(customer.phone!, e)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                                            >
                                                <MessageCircle size={16} /> WhatsApp
                                            </button>
                                            <button
                                                onClick={(e) => handleCall(customer.phone!, e)}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                                            >
                                                <Phone size={16} /> Ligar
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedCustomerId && (
                    <CustomerDetailsModal
                        isOpen={!!selectedCustomerId}
                        onClose={() => setSelectedCustomerId(null)}
                        customerId={selectedCustomerId}
                        onUpdate={() => {
                            setSelectedCustomerId(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Filters Modal */}
            <MobileFilters
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                onApply={(filters) => {
                    setSearchTerm(filters.searchTerm);
                }}
                onReset={() => {
                    setSearchTerm('');
                }}
                filters={{
                    dateRange: { start: '', end: '' },
                    valueRange: { min: 0, max: 0 },
                    status: '',
                    searchTerm: searchTerm
                }}
                title="Filtrar Clientes"
                statuses={['ATIVO', 'INATIVO', 'VIP']}
            />

            {/* Data Import/Export Modal */}
            <DataImportExport
                isOpen={showDataImportExport}
                onClose={() => setShowDataImportExport(false)}
                exportType="customers"
                data={filteredCustomers}
                onImport={(file) => {
                    console.log('Importing customers file:', file);
                }}
            />
        </MobileShell>
    );
};
