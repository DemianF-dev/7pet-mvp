import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';

interface QuoteItem {
    id?: string;
    description: string;
    quantity: number;
    price: number;
    serviceId?: string;
    performerId?: string;
    discount?: number;
}

interface QuoteItemsSectionProps {
    items: QuoteItem[];
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onItemChange: (index: number, field: keyof QuoteItem, value: any) => void;
    serviceSearch: { [key: number]: string };
    setServiceSearch: (val: { [key: number]: string }) => void;
    showServiceDropdown: { [key: number]: boolean };
    setShowServiceDropdown: (val: { [key: number]: boolean }) => void;
    getFilteredServices: (searchTerm: string) => any[];
    staffUsers: any[];
    totalAmount: number;
    availableServices?: any[];
}

const QuoteItemsSection: React.FC<QuoteItemsSectionProps> = ({
    items,
    onAddItem,
    onRemoveItem,
    onItemChange,
    serviceSearch,
    setServiceSearch,
    showServiceDropdown,
    setShowServiceDropdown,
    getFilteredServices,
    staffUsers,
    totalAmount,
    availableServices = []
}) => {
    return (
        <section className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-secondary dark:text-white">Itens e Serviços</h3>
                <button
                    onClick={onAddItem}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-sm"
                >
                    <Plus size={16} /> Adicionar Item
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50/50 dark:bg-gray-700/20 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 relative group"
                    >
                        <div className="md:col-span-3 relative service-dropdown-container">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 px-2">Descrição / Serviço</label>
                            <input
                                type="text"
                                value={serviceSearch[index] !== undefined ? serviceSearch[index] : item.description}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setServiceSearch({ ...serviceSearch, [index]: value });
                                    onItemChange(index, 'description', value);
                                    setShowServiceDropdown({ ...showServiceDropdown, [index]: value.length > 0 });
                                }}
                                onFocus={() => {
                                    const currentValue = serviceSearch[index] !== undefined ? serviceSearch[index] : item.description;
                                    if (currentValue && currentValue.length > 0) {
                                        setShowServiceDropdown({ ...showServiceDropdown, [index]: true });
                                    }
                                }}
                                className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl px-4 py-1.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-secondary dark:text-white"
                                placeholder="Buscar serviço..."
                            />

                            {showServiceDropdown[index] && (
                                <div className="absolute z-[9999] w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                    {getFilteredServices(serviceSearch[index] || item.description).length > 0 ? (
                                        getFilteredServices(serviceSearch[index] || item.description).map(service => (
                                            <button
                                                key={service.id}
                                                type="button"
                                                onClick={() => {
                                                    onItemChange(index, 'description', service.name);
                                                    onItemChange(index, 'price', service.basePrice);
                                                    onItemChange(index, 'serviceId', service.id);
                                                    onItemChange(index, 'performerId', service.responsibleId || '');
                                                    setServiceSearch({ ...serviceSearch, [index]: service.name });
                                                    setShowServiceDropdown({ ...showServiceDropdown, [index]: false });
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 flex justify-between items-center group"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm text-secondary dark:text-white group-hover:text-primary transition-colors">{service.name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                                        <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">{service.species}</span>
                                                        {service.category && <span className="text-primary/60">{service.category}</span>}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-black text-primary ml-4 whitespace-nowrap">
                                                    R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nenhum serviço encontrado</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2 px-2">Profissional</label>
                            <select
                                value={item.performerId || ''}
                                onChange={(e) => onItemChange(index, 'performerId', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl px-3 py-1.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none text-secondary dark:text-white cursor-pointer"
                            >
                                <option value="">Nenhum</option>
                                {(staffUsers || [])
                                    .filter(u => {
                                        const description = item.description.toLowerCase();
                                        const service = availableServices.find(s => s.id === item.serviceId);
                                        const category = service?.category?.toUpperCase();

                                        // Detection of Logistics/Transport items
                                        const isLogistics =
                                            category === 'LOGISTICA' ||
                                            description.includes('transporte') ||
                                            description.includes('leva') ||
                                            description.includes('traz') ||
                                            description.includes('taxi') ||
                                            description.includes('entrega') ||
                                            description.includes('busca');

                                        if (isLogistics) {
                                            return u.division?.toUpperCase().includes('LOGISTICA') || u.role === 'TTM';
                                        }

                                        // Everything else (Banhos, Tosas, Extras, even if no category) 
                                        // is considered SPA and should only show SPA staff
                                        return u.division?.toUpperCase().includes('SPA') || ['SPA', 'BANHADOR', 'TOSADOR'].includes(u.role);
                                    })
                                    .map(u => u && (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.division})
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <div className="md:col-span-1 text-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Qtd</label>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => onItemChange(index, 'quantity', parseInt(e.target.value))}
                                className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl px-2 py-1.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-center text-secondary dark:text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Preço Unit.</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[10px]">R$</span>
                                <input
                                    type="number"
                                    value={item.price}
                                    step="0.01"
                                    onChange={(e) => onItemChange(index, 'price', parseFloat(e.target.value))}
                                    className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl pl-8 pr-2 py-1.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-secondary dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Desc (%)</label>
                            <input
                                type="number"
                                value={item.discount || 0}
                                min="0"
                                max="100"
                                onChange={(e) => onItemChange(index, 'discount', parseFloat(e.target.value))}
                                className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl px-2 py-1.5 text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-center text-secondary dark:text-white"
                                placeholder="0%"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2 text-right">Subtotal</label>
                            <div className="px-3 py-1.5 text-xs font-black text-secondary dark:text-white bg-gray-100/50 dark:bg-gray-700/50 rounded-2xl h-[34px] flex items-center justify-end">
                                R$ {((item.price * item.quantity) * (1 - (item.discount || 0) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="md:col-span-1 flex items-end justify-center pb-1">
                            <button
                                onClick={() => onRemoveItem(index)}
                                className="p-2 text-gray-300 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {items.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-[32px] text-gray-400 italic">
                        Nenhum item adicionado.
                    </div>
                )}
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center px-4">
                <span className="text-lg font-bold text-secondary dark:text-white">Valor Total Calculado</span>
                <div className="text-right">
                    <span className="text-3xl font-black text-primary">R$ {totalAmount.toFixed(2)}</span>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Este valor será enviado ao cliente</p>
                </div>
            </div>
        </section>
    );
};

export default QuoteItemsSection;
