import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Trash2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

interface Service {
    id: string;
    name: string;
    basePrice: number;
}

interface Pet {
    id: string;
    name: string;
    species: string;
}

export default function QuoteRequest() {
    const navigate = useNavigate();
    const [items, setItems] = useState([{ serviceId: '', description: '', quantity: 1 }]);
    const [services, setServices] = useState<Service[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [desiredDate, setDesiredDate] = useState('');
    const [desiredTime, setDesiredTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, petsRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/pets')
                ]);
                setServices(servicesRes.data);
                setPets(petsRes.data);
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
            } finally {
                // Loading handling removed to fix compilation error
            }
        };
        fetchData();
    }, []);

    const totalEstimate = items.reduce((acc, item) => {
        const service = services.find(s => s.id === item.serviceId);
        return acc + (service?.basePrice || 0) * item.quantity;
    }, 0);

    const addItem = () => setItems([...items, { serviceId: '', description: '', quantity: 1 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.some(item => !item.serviceId)) {
            setError('Por favor, selecione o serviço para todos os itens.');
            return;
        }
        if (!selectedPetId) {
            setError('Por favor, selecione para qual pet é o serviço.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const desiredAt = desiredDate && desiredTime ? `${desiredDate}T${desiredTime}` : undefined;
            await api.post('/quotes', {
                items,
                petId: selectedPetId,
                desiredAt
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao enviar solicitação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <main className="flex-1 md:ml-64 p-6 md:p-10 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center bg-white p-12 rounded-[48px] shadow-sm max-w-lg border border-gray-50"
                    >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-secondary mb-4">Solicitação Enviada!</h2>
                        <p className="text-gray-500 mb-8">Nossa equipe analisará seu pedido e enviará o orçamento em breve. Você pode acompanhar o status na lista de orçamentos.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => navigate('/client/quotes')} className="btn-primary w-full py-4">Ver Meus Orçamentos</button>
                            <button onClick={() => navigate('/client/dashboard')} className="text-gray-400 font-bold hover:text-secondary transition-colors">Voltar ao Início</button>
                        </div>
                    </motion.div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-4xl">
                <header className="mb-10">
                    <h1 className="text-4xl font-extrabold text-secondary">Solicitar <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Orçamento</span></h1>
                    <p className="text-gray-500 mt-3">Personalize seu pedido para o melhor cuidado com seu amigo.</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <FileText size={120} />
                        </div>

                        <h2 className="text-xl font-bold text-secondary mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Geral e Itens
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Para qual Pet?</label>
                                <select
                                    value={selectedPetId}
                                    onChange={(e) => setSelectedPetId(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm appearance-none"
                                >
                                    <option value="">Selecione o pet...</option>
                                    {pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Data Desejada</label>
                                <input
                                    type="date"
                                    value={desiredDate}
                                    onChange={(e) => setDesiredDate(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Hora Desejada</label>
                                <input
                                    type="time"
                                    value={desiredTime}
                                    onChange={(e) => setDesiredTime(e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Serviços Selecionados</label>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence initial={false}>
                                {items.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="flex flex-col md:flex-row gap-4 items-end bg-gray-50/50 p-6 rounded-2xl border border-gray-100"
                                    >
                                        <div className="flex-1 w-full space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Serviço</label>
                                            <select
                                                value={item.serviceId}
                                                onChange={(e) => {
                                                    const selected = services.find(s => s.id === e.target.value);
                                                    const newItems = [...items];
                                                    newItems[index] = {
                                                        ...newItems[index],
                                                        serviceId: e.target.value,
                                                        description: selected?.name || ''
                                                    };
                                                    setItems(newItems);
                                                }}
                                                className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm appearance-none"
                                            >
                                                <option value="">Selecione um serviço...</option>
                                                {services.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} - R$ {s.basePrice.toFixed(2)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-full md:w-32 space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Qtd</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-xl px-4 py-3 shadow-sm text-sm"
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-colors mb-0.5"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="mt-6 flex items-center gap-2 text-primary font-bold hover:bg-primary-light/30 px-4 py-2 rounded-xl transition-colors"
                        >
                            <Plus size={18} /> Adicionar outro item
                        </button>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-secondary">
                            <span className="font-bold">Total Estimado:</span>
                            <span className="text-3xl font-black text-primary">R$ {totalEstimate.toFixed(2)}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertCircle size={20} />
                            <span className="font-medium text-sm">{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-primary px-10 py-4 flex items-center gap-2 text-lg shadow-xl shadow-primary/20"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                            <Send size={20} />
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
