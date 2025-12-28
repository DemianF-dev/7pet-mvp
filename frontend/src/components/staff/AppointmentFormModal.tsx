import { useState, useEffect } from 'react';
import { X, Search, User, Dog, Calendar, Clock, MapPin, Save, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    appointment?: any;
    isCopy?: boolean;
    preFill?: {
        customerId: string;
        customerName: string;
        quoteId?: string;
        items: any[];
        petId?: string;
        serviceIds?: string[];
        startAt?: string;
    };
}

export default function AppointmentFormModal({ isOpen, onClose, onSuccess, appointment, isCopy, preFill }: ModalProps) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [pets, setPets] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [formData, setFormData] = useState({
        customerId: '',
        petId: '',
        serviceIds: [] as string[],
        startAt: '',
        hasTransport: false,
        transport: {
            origin: '',
            destination: '7Pet',
            requestedPeriod: 'MORNING'
        }
    });

    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            if (appointment) {
                // Formatting date for datetime-local input
                let formattedDate = '';
                try {
                    const date = new Date(appointment.startAt);
                    if (!isNaN(date.getTime())) {
                        formattedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                    }
                } catch (e) {
                    console.error('Invalid date', e);
                }

                setFormData({
                    customerId: appointment.customerId || '',
                    petId: appointment.petId || '',
                    serviceIds: appointment.services ? appointment.services.map((s: any) => s.id) : [],
                    startAt: formattedDate,
                    hasTransport: !!appointment.transport,
                    transport: appointment.transport ? {
                        origin: appointment.transport.origin || '',
                        destination: appointment.transport.destination || '7Pet',
                        requestedPeriod: appointment.transport.requestedPeriod || 'MORNING'
                    } : { origin: '', destination: '7Pet', requestedPeriod: 'MORNING' }
                });
                setPets(appointment.customer?.pets || []);
            } else if (preFill) {
                // Pre-fill from quote
                setFormData({
                    customerId: preFill.customerId,
                    petId: preFill.petId || '',
                    serviceIds: preFill.serviceIds || [],
                    startAt: preFill.startAt || '',
                    hasTransport: false,
                    transport: { origin: '', destination: '7Pet', requestedPeriod: 'MORNING' }
                });
                // We need to wait for customers to load to find the full object
                if (customers.length > 0) {
                    const cust = customers.find(c => c.id === preFill.customerId);
                    if (cust) {
                        setSelectedCustomer(cust);
                        setPets(cust.pets || []);
                    }
                }
            } else {
                setFormData({
                    customerId: '',
                    petId: '',
                    serviceIds: [],
                    startAt: '',
                    hasTransport: false,
                    transport: { origin: '', destination: '7Pet', requestedPeriod: 'MORNING' }
                });
                setSelectedCustomer(null);
            }
        }
    }, [isOpen, appointment, isCopy]);

    const fetchInitialData = async () => {
        try {
            const [custRes, servRes] = await Promise.all([
                api.get('/customers'),
                api.get('/services')
            ]);
            setCustomers(custRes.data);
            setServices(servRes.data);

            // If we have preFill but customers weren't loaded yet
            if (preFill && !selectedCustomer) {
                const cust = custRes.data.find((c: any) => c.id === preFill.customerId);
                if (cust) {
                    setSelectedCustomer(cust);
                    setPets(cust.pets || []);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados iniciais:', error);
        }
    };

    const handleSelectCustomer = (customer: any) => {
        setSelectedCustomer(customer);
        setFormData({ ...formData, customerId: customer.id, petId: '' });
        setPets(customer.pets || []);
        setSearchQuery('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const msg = isCopy ? 'Deseja criar este novo agendamento por cópia?' : appointment ? 'Deseja salvar as alterações neste agendamento?' : 'Confirmar novo agendamento?';
        if (!window.confirm(msg)) return;
        setIsLoading(true);
        try {
            const data = {
                ...formData,
                transport: formData.hasTransport ? formData.transport : undefined
            };
            delete (data as any).hasTransport;

            if (appointment && !isCopy) {
                await api.patch(`/appointments/${appointment.id}`, data);
            } else {
                await api.post('/appointments', data);
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao processar agendamento');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = searchQuery.length > 2
        ? customers.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.user.email.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-secondary/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden"
            >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary">
                            {isCopy ? 'Duplicar' : appointment ? 'Modificar' : 'Novo'} <span className="text-primary">Agendamento</span>
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Área do Colaborador</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Customer Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                            <User size={16} /> Cliente
                        </label>
                        {!selectedCustomer ? (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nome ou email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-field pl-12"
                                />
                                <AnimatePresence>
                                    {filteredCustomers.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-2xl mt-2 shadow-xl z-20 overflow-hidden"
                                        >
                                            {filteredCustomers.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="w-full p-4 text-left hover:bg-primary/5 flex items-center justify-between transition-colors border-b border-gray-50 last:border-none"
                                                >
                                                    <div>
                                                        <p className="font-bold text-secondary text-sm">{c.name}</p>
                                                        <p className="text-xs text-gray-400">{c.user.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">
                                        {selectedCustomer.name ? selectedCustomer.name[0] : 'C'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-secondary text-sm">{selectedCustomer.name || 'Cliente sem nome'}</p>
                                        <p className="text-xs text-gray-400">{selectedCustomer.user?.email}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedCustomer(null); setFormData({ ...formData, customerId: '', petId: '' }) }}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Alterar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pet Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                                <Dog size={16} /> Pet
                            </label>
                            <select
                                required
                                disabled={!selectedCustomer}
                                value={formData.petId}
                                onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
                                className="input-field"
                            >
                                <option value="">Selecione um pet</option>
                                {pets.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                                <Calendar size={16} /> Serviços
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-2xl bg-gray-50/50">
                                {services.map(s => (
                                    <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${formData.serviceIds.includes(s.id) ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-white border-transparent hover:bg-white/80'}`}>
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${formData.serviceIds.includes(s.id) ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                            {formData.serviceIds.includes(s.id) && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            value={s.id}
                                            checked={formData.serviceIds.includes(s.id)}
                                            onChange={(e) => {
                                                const current = formData.serviceIds;
                                                if (e.target.checked) {
                                                    setFormData({ ...formData, serviceIds: [...current, s.id] });
                                                } else {
                                                    setFormData({ ...formData, serviceIds: current.filter((id: string) => id !== s.id) });
                                                }
                                            }}
                                        />
                                        <div className="flex-1 flex justify-between items-center text-sm">
                                            <span className={`font-medium ${formData.serviceIds.includes(s.id) ? 'text-primary' : 'text-gray-600'}`}>{s.name}</span>
                                            <span className="font-bold text-gray-400 text-xs">R$ {s.basePrice}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                            <Clock size={16} /> Data e Horário
                        </label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.startAt}
                            onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                            className="input-field"
                        />
                    </div>

                    {/* Transport Toggle */}
                    <div className="pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.hasTransport}
                                onChange={(e) => setFormData({ ...formData, hasTransport: e.target.checked })}
                            />
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.hasTransport ? 'bg-primary' : 'bg-gray-200'}`}>
                                <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${formData.hasTransport ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-secondary">Solicitar Transporte (Leva e Traz)</span>
                        </label>

                        <AnimatePresence>
                            {formData.hasTransport && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-gray-50 p-6 rounded-3xl mt-4 space-y-4 border border-gray-100">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                                <MapPin size={12} /> Endereço de Busca
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Rua, número, bairro..."
                                                value={formData.transport.origin}
                                                onChange={(e) => setFormData({ ...formData, transport: { ...formData.transport, origin: e.target.value } })}
                                                className="input-field text-sm bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Período Preferencial</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['MORNING', 'AFTERNOON', 'NIGHT'].map(period => (
                                                    <button
                                                        key={period}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, transport: { ...formData.transport, requestedPeriod: period as any } })}
                                                        className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${formData.transport.requestedPeriod === period ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                                                    >
                                                        {period === 'MORNING' ? 'Manhã' : period === 'AFTERNOON' ? 'Tarde' : 'Noite'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-[20px] font-bold hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 py-4 bg-primary text-white rounded-[20px] font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Processando...' : isCopy ? <><Copy size={18} /> Duplicar</> : appointment ? <><Save size={18} /> Salvar Alterações</> : 'Confirmar Agendamento'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
