import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dog,
    ChevronRight,
    ChevronLeft,
    Clock,
    CheckCircle2,
    Info,
    AlertCircle,
    MapPin,
    Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

interface Service {
    id: string;
    name: string;
    basePrice: number;
    duration: number;
    description: string;
    category: string;
}

interface Pet {
    id: string;
    name: string;
    species: string;
}

export default function AppointmentBooking() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [services, setServices] = useState<Service[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');

    // Transport State
    const [requiresTransport, setRequiresTransport] = useState(false);
    const [transportDetails, setTransportDetails] = useState({
        origin: '',
        destination: '',
        requestedPeriod: 'MANHA' as 'MANHA' | 'TARDE' | 'NOITE'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, petsRes, meRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/pets'),
                    api.get('/auth/me')
                ]);
                setServices(servicesRes.data);
                setPets(petsRes.data);

                if (meRes.data.customer?.address) {
                    setTransportDetails(prev => ({
                        ...prev,
                        origin: meRes.data.customer.address
                    }));
                }
            } catch (err) {
                setError('Erro ao carregar dados. Tente novamente.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBooking = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const startAt = new Date(`${selectedDate}T${selectedTime}`);
            const payload: any = {
                petId: selectedPet?.id,
                serviceIds: selectedServices.map(s => s.id),
                startAt: startAt.toISOString()
            };

            if (requiresTransport) {
                payload.transport = transportDetails;
            }

            await api.post('/appointments', payload);
            setStep(4); // Success step
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao realizar agendamento.');
            setIsSubmitting(false);
        }
    };

    const nextStep = () => setStep(step + 1);
    const prevStep = () => setStep(step - 1);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-5xl">
                <header className="mb-10 text-center md:text-left">
                    <h1 className="text-4xl font-extrabold text-secondary">Agendar <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Serviço</span></h1>
                    <p className="text-gray-500 mt-3">Reserve um horário para o cuidado especial que seu pet merece.</p>
                </header>

                {/* Progress Bar */}
                {step < 4 && (
                    <div className="mb-12">
                        <div className="flex justify-between mb-2">
                            {['Serviço', 'Pet', 'Horário & Opções'].map((label, idx) => (
                                <span key={idx} className={`text-xs font-bold uppercase tracking-widest ${step === idx + 1 ? 'text-primary' : 'text-gray-300'}`}>
                                    {label}
                                </span>
                            ))}
                        </div>
                        <div className="h-2 bg-white rounded-full overflow-hidden shadow-sm">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: '33.3%' }}
                                animate={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                        <AlertCircle size={20} />
                        <span className="font-medium text-sm">{error}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h2 className="text-2xl font-bold text-secondary mb-4">Selecione o Serviço</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map((service) => {
                                    const isSelected = selectedServices.some(s => s.id === service.id);
                                    return (
                                        <button
                                            key={service.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedServices(selectedServices.filter(s => s.id !== service.id));
                                                } else {
                                                    // Uma de cada categoria por pet por agendamento
                                                    const others = selectedServices.filter(s => s.category !== service.category);
                                                    setSelectedServices([...others, service]);
                                                }
                                            }}
                                            className={`p-6 rounded-[24px] cursor-pointer transition-all border-2 text-left w-full ${isSelected ? 'border-primary bg-primary-light/30 ring-4 ring-primary/5' : 'border-white bg-white hover:border-gray-100 shadow-sm'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-lg font-extrabold text-secondary">{service.name}</h3>
                                                <span className="text-primary font-bold">R$ {service.basePrice.toFixed(2)}</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">{service.description}</p>
                                            <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {service.duration} min
                                                </div>
                                                <div className="px-2 py-1 bg-gray-100 rounded-md uppercase">
                                                    {service.category}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                disabled={selectedServices.length === 0}
                                onClick={nextStep}
                                className="w-full md:w-auto px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-8 active:scale-95 transition-transform"
                            >
                                Continuar <ChevronRight size={20} />
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-secondary">Para qual pet?</h2>
                                <button
                                    onClick={() => navigate('/client/pets')}
                                    className="text-primary font-bold text-sm hover:underline"
                                >
                                    Gerenciar Pets
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pets.map((pet) => (
                                    <button
                                        key={pet.id}
                                        type="button"
                                        onClick={() => setSelectedPet(pet)}
                                        className={`p-6 rounded-[24px] cursor-pointer transition-all border-2 flex items-center gap-4 text-left w-full ${selectedPet?.id === pet.id ? 'border-primary bg-primary-light/30 ring-4 ring-primary/5' : 'border-white bg-white hover:border-gray-100 shadow-sm'}`}
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                            <Dog size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-extrabold text-secondary">{pet.name}</h3>
                                            <p className="text-sm text-gray-400">{pet.species}</p>
                                        </div>
                                        {selectedPet?.id === pet.id && <CheckCircle2 className="text-primary" size={24} />}
                                    </button>
                                ))}
                                {pets.length === 0 && (
                                    <div className="col-span-2 p-10 bg-white rounded-3xl text-center border-2 border-dashed border-gray-100">
                                        <p className="text-gray-400 mb-4">Você ainda não tem nenhum pet cadastrado.</p>
                                        <button onClick={() => navigate('/client/pets')} className="btn-primary">Cadastrar Agora</button>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col md:flex-row gap-3 mt-8">
                                <button onClick={prevStep} className="px-8 py-4 bg-white text-secondary font-bold rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2">
                                    <ChevronLeft size={20} /> Voltar
                                </button>
                                <button
                                    disabled={!selectedPet}
                                    onClick={nextStep}
                                    className="px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    Continuar <ChevronRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <section className="space-y-6">
                                <h2 className="text-2xl font-bold text-secondary mb-4">Escolha o Horário</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Selecione a Data</label>
                                        <input
                                            type="date"
                                            min={new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold appearance-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Horário (HH:MM)</label>
                                        <input
                                            type="time"
                                            step="900"
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold appearance-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-2xl flex items-start gap-3 border border-orange-100">
                                    <Info className="text-orange-400 mt-1" size={18} />
                                    <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                        Lembre-se: agendamentos exigem 12h de antecedência. Horários fora do comercial (08:00 - 18:00) serão confirmados via WhatsApp.
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-secondary">Transporte</h2>
                                    <div
                                        onClick={() => setRequiresTransport(!requiresTransport)}
                                        className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${requiresTransport ? 'bg-primary' : 'bg-gray-200'}`}
                                    >
                                        <motion.div
                                            animate={{ x: requiresTransport ? 24 : 0 }}
                                            className="w-6 h-6 bg-white rounded-full shadow-sm"
                                        />
                                    </div>
                                </div>

                                {requiresTransport && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-6 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Endereço de Busca</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                    <input
                                                        type="text"
                                                        value={transportDetails.origin}
                                                        onChange={(e) => setTransportDetails({ ...transportDetails, origin: e.target.value })}
                                                        placeholder="Rua, Número, Bairro"
                                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl pl-12 pr-4 py-3 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Destino</label>
                                                <div className="relative">
                                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                                    <input
                                                        type="text"
                                                        value={transportDetails.destination}
                                                        onChange={(e) => setTransportDetails({ ...transportDetails, destination: e.target.value })}
                                                        placeholder="Geralmente 7Pet"
                                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-xl pl-12 pr-4 py-3 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Período Preferencial</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['MANHA', 'TARDE', 'NOITE'].map((p) => (
                                                    <button
                                                        key={p}
                                                        type="button"
                                                        onClick={() => setTransportDetails({ ...transportDetails, requestedPeriod: p as any })}
                                                        className={`py-3 rounded-xl font-bold text-xs transition-all ${transportDetails.requestedPeriod === p ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                                    >
                                                        {p === 'MANHA' ? 'Manhã' : p === 'TARDE' ? 'Tarde' : 'Noite'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </section>

                            <div className="bg-secondary rounded-3xl p-8 text-white mt-4 shadow-2xl shadow-secondary/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-6">Resumo do Agendamento</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Serviço(s)</p>
                                        <p className="font-bold text-lg">
                                            {selectedServices.map(s => s.name).join(', ') || '--'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Pet</p>
                                        <p className="font-bold text-lg">{selectedPet?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Valor Total</p>
                                        <p className="font-bold text-lg text-primary">
                                            R$ {selectedServices.reduce((acc, s) => acc + s.basePrice, 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Previsão</p>
                                        <p className="font-bold text-lg">{selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('pt-BR') : '--'} {selectedTime || '--'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Opções</p>
                                        <p className="font-bold text-lg">{requiresTransport ? 'Com Transporte' : 'Sem Transporte'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 mt-8">
                                <button onClick={prevStep} className="px-8 py-4 bg-white text-secondary font-bold rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2">
                                    <ChevronLeft size={20} /> Voltar
                                </button>
                                <button
                                    disabled={!selectedDate || !selectedTime || isSubmitting || (requiresTransport && (!transportDetails.origin || !transportDetails.destination))}
                                    onClick={handleBooking}
                                    className="flex-1 px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'} <CheckCircle2 size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 px-6 bg-white rounded-[48px] shadow-sm border border-gray-50"
                        >
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 shadow-xl shadow-green-100/50 scale-125">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-4xl font-black text-secondary mb-4">Sucesso!</h2>
                            <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">
                                Seu agendamento foi solicitado com sucesso. Agora é só aguardar a confirmação da nossa equipe!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={() => navigate('/client/dashboard')}
                                    className="px-8 py-4 bg-secondary text-white font-bold rounded-2xl hover:bg-secondary-dark transition-all active:scale-95"
                                >
                                    Voltar ao Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/client/appointments')}
                                    className="px-8 py-4 bg-gray-100 text-secondary font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Ver Meus Agendamentos
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
