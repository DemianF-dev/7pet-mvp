import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, User } from 'lucide-react';
import api from '../services/api';
import VirtualList from './system/VirtualList';

interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
}

interface CustomerAutocompleteProps {
    onSelect: (customerId: string) => void;
    placeholder?: string;
    className?: string;
    value?: string; // ID
}

const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
    onSelect,
    placeholder = "Buscar cliente...",
    className = "",
    value = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Customer item component for virtual list
    const CustomerItem = ({ customer }: { customer: Customer }) => (
        <div
            onClick={() => {
                onSelect(customer.id);
                setSelectedCustomer(customer);
                setIsOpen(false);
                setSearchTerm("");
            }}
            className={`px-4 py-3 hover:bg-primary/5 cursor-pointer flex items-center justify-between group transition-colors border-b border-gray-100 ${value === customer.id ? 'bg-primary/5' : ''}`}
        >
            <div className="flex flex-col">
                <span className={`text-sm font-bold ${value === customer.id ? 'text-primary' : 'text-secondary'}`}>
                    {customer.name}
                </span>
                {(customer.phone || customer.email) && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[200px]">
                        {customer.phone || customer.email}
                    </span>
                )}
            </div>
            {value === customer.id && <Check size={16} className="text-primary" />}
        </div>
    );

    // Initial fetch of selected customer if value provided
    useEffect(() => {
        if (value && !selectedCustomer) {
            const fetchCustomer = async () => {
                try {
                    const res = await api.get(`/customers/${value}`);
                    setSelectedCustomer(res.data);
                } catch (e) {
                    console.error(e);
                }
            };
            fetchCustomer();
        }
    }, [value]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!isOpen) return;

            setLoading(true);
            try {
                // If search term is empty, fetch recent/all (limited)
                // If search term exists, search
                const endpoint = searchTerm
                    ? `/customers/search?q=${searchTerm}&limit=10`
                    : `/customers?limit=10`; // Assuming standard list supports limit or returns all

                // Fallback to simple list if search not supported or returns all
                const res = await api.get(endpoint);
                const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
                setCustomers(data);
            } catch (error) {
                console.error("Error searching customers", error);
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className="w-full bg-white border-2 border-transparent focus-within:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    {selectedCustomer ? (
                        <span className="text-secondary font-medium">{selectedCustomer.name}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nome, telefone ou email..."
                                className="w-full bg-white border-none focus:ring-0 rounded-lg pl-10 pr-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Buscando...
                            </div>
                        ) : customers.length > 0 ? (
                            <VirtualList
                                items={customers}
                                estimateSize={56}
                                renderItem={(customer) => <CustomerItem customer={customer} />}
                            />
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                {searchTerm ? "Nenhum cliente encontrado" : "Nenhum cliente disponível"}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerAutocomplete;