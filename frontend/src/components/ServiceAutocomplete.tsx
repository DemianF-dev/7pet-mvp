import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Service {
    id: string;
    name: string;
    basePrice: number;
    category?: string;
    sizeLabel?: string;
}

interface ServiceAutocompleteProps {
    services: Service[];
    onSelect: (serviceId: string) => void;
    placeholder?: string;
    className?: string;
    value?: string;
}

const ServiceAutocomplete: React.FC<ServiceAutocompleteProps> = ({
    services,
    onSelect,
    placeholder = "Buscar serviço...",
    className = "",
    value = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedService = services.find(s => s.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className="w-full bg-white border-2 border-transparent focus-within:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm flex items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate">
                    {selectedService ? (
                        <span className="text-secondary font-medium">{selectedService.name}</span>
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
                                placeholder="Filtrar por nome ou categoria..."
                                className="w-full bg-white border-none focus:ring-0 rounded-lg pl-10 pr-4 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {filteredServices.length > 0 ? (
                            filteredServices.map(s => (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        onSelect(s.id);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`px-4 py-3 hover:bg-primary/5 cursor-pointer flex items-center justify-between group transition-colors ${value === s.id ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold ${value === s.id ? 'text-primary' : 'text-secondary'}`}>
                                            {s.name}
                                        </span>
                                        {s.category && (
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                                                {s.category}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-primary">
                                            R$ {s.basePrice.toFixed(2)}
                                        </span>
                                        {value === s.id && <Check size={16} className="text-primary" />}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                Nenhum serviço encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceAutocomplete;
