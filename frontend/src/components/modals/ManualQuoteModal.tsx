import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Search } from 'lucide-react';

interface ManualQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (quote: any) => void;
}

export default function ManualQuoteModal({ isOpen, onClose, onSuccess }: ManualQuoteModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<any[]>([]);

    // Form State
    const [customer, setCustomer] = useState({
        name: '',
        email: '',
        phone: '',
        address: ''
    });

    const [pet, setPet] = useState({
        name: '',
        species: 'Canino',
        breed: '',
        weight: '',
        coatType: 'CURTO',
        temperament: 'DOCIL',
        age: '',
        observations: ''
    });

    const [quote, setQuote] = useState({
        type: 'SPA',
        desiredAt: '',
        transportOrigin: '',
        transportDestination: '',
        transportPeriod: 'MANHA',
        items: [] as any[]
    });

    useEffect(() => {
        if (isOpen) {
            fetchServices();
        }
    }, [isOpen]);

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data.items || []);
        } catch (error) {
            console.error('Erro ao buscar serviços:', error);
        }
    };

    const handleAddItem = (service?: any) => {
        const newItem = {
            serviceId: service?.id || null,
            description: service?.name || '',
            quantity: 1,
            price: service?.basePrice || 0
        };
        setQuote({ ...quote, items: [...quote.items, newItem] });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...quote.items];
        newItems.splice(index, 1);
        setQuote({ ...quote, items: newItems });
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...quote.items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'serviceId' && value) {
            const selectedService = services.find(s => s.id === value);
            if (selectedService) {
                newItems[index].description = selectedService.name;
                newItems[index].price = selectedService.basePrice;
            }
        }

        setQuote({ ...quote, items: newItems });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customer.name || !customer.email) {
            return toast.error('Nome e Email do cliente são obrigatórios');
        }

        if (quote.items.length === 0) {
            return toast.error('Adicione pelo menos um item ao orçamento');
        }

        setIsLoading(true);
        try {
            const payload = {
                customer,
                pet,
                quote: {
                    ...quote,
                    transportOrigin: quote.transportOrigin || customer.address
                }
            };

            const res = await api.post('/quotes/manual', payload);
            toast.success('Orçamento e cadastros realizados com sucesso!');
            onSuccess(res.data);
            onClose();
        } catch (error: any) {
            console.error('Erro ao criar orçamento manual:', error);
            toast.error(error.response?.data?.error || 'Erro ao criar orçamento');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const total = quote.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
            <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Novo Orçamento Manual</h2>
                        <p className="text-sm text-gray-500">Crie um orçamento e cadastre cliente/pet simultaneamente</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Cliente */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
                            Dados do Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                <input
                                    required
                                    type="text"
                                    value={customer.name}
                                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    required
                                    type="email"
                                    value={customer.email}
                                    onChange={e => setCustomer({ ...customer, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="joao@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                <input
                                    type="text"
                                    value={customer.phone}
                                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (Origem Transporte)</label>
                                <input
                                    type="text"
                                    value={customer.address}
                                    onChange={e => setCustomer({ ...customer, address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Rua Exemplo, 123"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Pet */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">2</span>
                            Dados do Pet
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pet</label>
                                <input
                                    type="text"
                                    value={pet.name}
                                    onChange={e => setPet({ ...pet, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Rex"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Espécie</label>
                                <select
                                    value={pet.species}
                                    onChange={e => setPet({ ...pet, species: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="Canino">Cachorro</option>
                                    <option value="Felino">Gato</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Raça</label>
                                <input
                                    type="text"
                                    value={pet.breed}
                                    onChange={e => setPet({ ...pet, breed: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: Poodle"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Orçamento */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">3</span>
                            Detalhes do Orçamento
                        </h3>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-gray-500 uppercase">Itens do Orçamento</span>
                                <button
                                    type="button"
                                    onClick={() => handleAddItem()}
                                    className="flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
                                >
                                    <Plus size={16} /> Adicionar Item
                                </button>
                            </div>

                            <div className="space-y-3">
                                {quote.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-400 mb-1">Serviço / Descrição</label>
                                            <select
                                                value={item.serviceId || ''}
                                                onChange={e => handleUpdateItem(idx, 'serviceId', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                                            >
                                                <option value="">Selecione um serviço ou digite...</option>
                                                {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.basePrice}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-20">
                                            <label className="block text-xs text-gray-400 mb-1">Qtd</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => handleUpdateItem(idx, 'quantity', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                        <div className="w-28">
                                            <label className="block text-xs text-gray-400 mb-1">Preço Unit.</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.price}
                                                onChange={e => handleUpdateItem(idx, 'price', parseFloat(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(idx)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                {quote.items.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                        Nenhum item adicionado ainda
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
                                <div className="text-right">
                                    <span className="text-gray-500">Total Estimado</span>
                                    <div className="text-3xl font-black text-blue-600">R$ {total.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        disabled={isLoading}
                        onClick={handleSubmit}
                        className="px-8 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                        {isLoading ? 'Salvando...' : 'Criar Orçamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
