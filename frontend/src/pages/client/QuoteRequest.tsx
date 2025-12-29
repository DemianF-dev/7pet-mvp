import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Trash2,
    Send,
    CheckCircle2,
    AlertCircle,
    Truck,
    Scissors,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    MapPin,
    Minus,
    RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import BackButton from '../../components/BackButton';
import api from '../../services/api';
import ServiceAutocomplete from '../../components/ServiceAutocomplete';
import LoadingButton from '../../components/LoadingButton';

const SHOP_ADDRESS = "The Pet - Av Hildebrando de Lima, 525, Km 18, Osasco, SP";

interface Service {
    id: string;
    name: string;
    basePrice: number;
    category?: string;
    species: string;
    minWeight?: number;
    maxWeight?: number;
    sizeLabel?: string;
}

interface Pet {
    id: string;
    name: string;
    species: string;
    weight?: number;
    breed?: string;
}

type QuoteType = 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';

const KNOT_REGIONS = [
    'Orelhas', 'Rostinho', 'Pescoço', 'Barriga', 'Costas', 'Patas', 'Bumbum', 'Rabo'
];

export default function QuoteRequest() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Type Selection, 2: Form
    const [quoteType, setQuoteType] = useState<QuoteType | null>(null);

    const [items, setItems] = useState([{ serviceId: '', description: '', quantity: 1 }]);
    const [services, setServices] = useState<Service[]>([]);
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [desiredDate, setDesiredDate] = useState('');
    const [desiredTime, setDesiredTime] = useState('');

    // SPA Details
    const [spaDetails, setSpaDetails] = useState({
        hasKnots: false,
        knotRegions: [] as string[],
        hairLength: 'curto',
        hasParasites: false
    });

    // Transport Details
    const [transportDetails, setTransportDetails] = useState({
        origin: '',
        destination: '7Pet',
        returnAddress: '',
        isReturnSame: true,
        petQuantity: 1,
        period: 'MANHA'
    });

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
            }
        };
        fetchData();
    }, []);

    const selectedPet = pets.find(p => p.id === selectedPetId);

    // Filter services based on selected pet
    const availableServices = services.filter(s => {
        if (!selectedPet) return true;
        const speciesMatch = s.species.toLowerCase().includes(selectedPet.species.toLowerCase()) ||
            (selectedPet.species.toLowerCase() === 'cachorro' && s.species === 'Canino') ||
            (selectedPet.species.toLowerCase() === 'gato' && s.species === 'Felino');
        if (!speciesMatch) return false;
        if (selectedPet.weight && (s.minWeight !== null || s.maxWeight !== null)) {
            const min = s.minWeight ?? 0;
            const max = s.maxWeight ?? 999;
            if (selectedPet.weight < min || selectedPet.weight > max) return false;
        }
        return true;
    });


    const addItem = () => setItems([...items, { serviceId: '', description: '', quantity: 1 }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const handleServiceSelect = (index: number, serviceId: string) => {
        const selected = services.find(s => s.id === serviceId);
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            serviceId: serviceId,
            description: selected?.name || ''
        };
        setItems(newItems);
    };

    const toggleKnotRegion = (region: string) => {
        setSpaDetails(prev => ({
            ...prev,
            knotRegions: prev.knotRegions.includes(region)
                ? prev.knotRegions.filter(r => r !== region)
                : [...prev.knotRegions, region]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPetId) {
            setError('Por favor, selecione qual o Pet.');
            return;
        }

        if (quoteType !== 'TRANSPORTE' && items.some(item => !item.serviceId)) {
            setError('Por favor, selecione o serviço para todos os itens.');
            return;
        }

        if (quoteType !== 'SPA' && !transportDetails.origin) {
            setError('O endereço de origem é obrigatório para o transporte.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const desiredAt = desiredDate && desiredTime ? `${desiredDate}T${desiredTime}` : undefined;

            await api.post('/quotes', {
                type: quoteType,
                items: quoteType === 'TRANSPORTE' ? [] : items,
                petId: selectedPetId,
                desiredAt,
                // Transport Fields
                transportOrigin: transportDetails.origin,
                transportDestination: quoteType === 'SPA_TRANSPORTE' ? SHOP_ADDRESS : transportDetails.destination,
                transportReturnAddress: transportDetails.isReturnSame ? transportDetails.origin : transportDetails.returnAddress,
                transportPeriod: transportDetails.period,
                petQuantity: transportDetails.petQuantity,
                // SPA Fields
                hasKnots: spaDetails.hasKnots,
                knotRegions: spaDetails.knotRegions.join(', '),
                hairLength: spaDetails.hairLength,
                hasParasites: spaDetails.hasParasites
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao enviar solicitação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTypeSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                type="button"
                onClick={() => { setQuoteType('SPA'); setStep(2); }}
                className="group relative bg-white p-10 rounded-[48px] shadow-sm hover:shadow-2xl hover:shadow-primary/10 border border-gray-100 transition-all flex flex-col items-center text-center overflow-hidden active:scale-95"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Scissors size={40} />
                </div>
                <h3 className="text-xl font-black text-secondary mb-2">Serviços de SPA</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">Banho, tosa e cuidados especiais.</p>
                <div className="mt-8 p-2 bg-gray-50 rounded-full text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                    <ChevronRight size={24} />
                </div>
            </button>

            <button
                type="button"
                onClick={() => { setQuoteType('TRANSPORTE'); setStep(2); }}
                className="group relative bg-white p-10 rounded-[48px] shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 border border-gray-100 transition-all flex flex-col items-center text-center overflow-hidden active:scale-95"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-orange-500/20 group-hover:bg-orange-500 transition-colors" />
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                    <Truck size={40} />
                </div>
                <h3 className="text-xl font-black text-secondary mb-2">Apenas Transporte</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">Logística Leva e Traz profissional.</p>
                <div className="mt-8 p-2 bg-gray-50 rounded-full text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-all">
                    <ChevronRight size={24} />
                </div>
            </button>

            <button
                type="button"
                onClick={() => { setQuoteType('SPA_TRANSPORTE'); setStep(2); }}
                className="group relative bg-gradient-to-br from-secondary to-secondary/90 p-10 rounded-[48px] shadow-xl hover:shadow-secondary/20 border border-gray-800 transition-all flex flex-col items-center text-center overflow-hidden active:scale-95"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles size={40} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">SPA + Transporte</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">O combo completo com praticidade.</p>
                <div className="mt-8 p-2 bg-white/5 rounded-full text-white/40 group-hover:text-primary group-hover:bg-white transition-all">
                    <ChevronRight size={24} />
                </div>
            </button>
        </div>
    );

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

            <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-5xl">
                <header className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <BackButton />
                    </div>
                    <h1 className="text-4xl font-extrabold text-secondary">Solicitar <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Orçamento</span></h1>
                    <p className="text-gray-500 mt-3">
                        {step === 1 ? 'Escolha o tipo de serviço que você precisa:' : `Detalhes para ${quoteType === 'SPA' ? 'SPA' : quoteType === 'TRANSPORTE' ? 'Transporte' : 'SPA + Transporte'}`}
                    </p>
                </header>

                {step === 1 ? renderTypeSelection() : (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-[48px] p-10 shadow-sm border border-gray-50 overflow-hidden relative">
                            {/* Pet and Date Section */}
                            <div className="flex flex-col md:flex-row gap-4 mb-10 pb-10 border-b border-gray-100">
                                <div className="flex-1 space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Sobre qual Pet?</label>
                                    <select
                                        required
                                        value={selectedPetId}
                                        onChange={(e) => setSelectedPetId(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold appearance-none transition-all"
                                    >
                                        <option value="">Selecione o pet...</option>
                                        {pets.map(pet => (
                                            <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Data Pretendida</label>
                                    <input
                                        type="date"
                                        value={desiredDate}
                                        onChange={(e) => setDesiredDate(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                                    />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Horário</label>
                                    <input
                                        type="time"
                                        step="900"
                                        value={desiredTime}
                                        onChange={(e) => setDesiredTime(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                                    />
                                </div>
                            </div>

                            {/* SPA SECTION */}
                            {quoteType !== 'TRANSPORTE' && (
                                <div className="mb-12 animate-in fade-in duration-500">
                                    <h2 className="text-xl font-black text-secondary mb-8 flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary"><Scissors size={20} /></div>
                                        Seção SPA
                                    </h2>

                                    {/* Service Selection */}
                                    <div className="space-y-4 mb-8">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-6 rounded-[28px] border border-gray-200">
                                                <div className="flex-1 w-full space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Serviço Desejado</label>
                                                    <ServiceAutocomplete
                                                        services={availableServices}
                                                        value={item.serviceId}
                                                        onSelect={(id) => handleServiceSelect(index, id)}
                                                        placeholder="Ex: Banho, Tosa Higiênica..."
                                                    />
                                                </div>
                                                <div className="w-full md:w-32 space-y-3">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Qtd</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                                        className="w-full bg-white border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                                                    />
                                                </div>
                                                {items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(index)} className="p-4 text-red-400 hover:bg-red-50 rounded-2xl mb-1">
                                                        <Trash2 size={24} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={addItem} className="w-full py-4 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-primary hover:text-primary transition-all text-xs uppercase">
                                            <Plus size={16} /> Adicionar Serviço
                                        </button>
                                    </div>

                                    {/* SPA Specific Questions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tamanho dos pelos</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {[
                                                        { id: 'curto', label: '1 Dedo (Curto)' },
                                                        { id: 'medio', label: 'Até 3 Dedos (Médio)' },
                                                        { id: 'longo', label: 'Acima disso (Longo)' }
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => setSpaDetails({ ...spaDetails, hairLength: opt.id })}
                                                            className={`p-3 text-[9px] font-black uppercase rounded-xl border-2 transition-all ${spaDetails.hairLength === opt.id ? 'bg-primary border-primary text-white' : 'bg-white border-gray-100 text-gray-400'}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-secondary uppercase tracking-tight">Pulgas ou Carrapatos?</p>
                                                    <p className="text-[10px] text-gray-400">Marque se identificou algum parasita.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSpaDetails({ ...spaDetails, hasParasites: !spaDetails.hasParasites })}
                                                    className={`w-14 h-8 rounded-full relative transition-all ${spaDetails.hasParasites ? 'bg-red-500' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${spaDetails.hasParasites ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black text-secondary uppercase tracking-tight">Tem nós e/ou embolos?</p>
                                                    <p className="text-[10px] text-gray-400">Ajuda a definir o tempo de serviço.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSpaDetails({ ...spaDetails, hasKnots: !spaDetails.hasKnots })}
                                                    className={`w-14 h-8 rounded-full relative transition-all ${spaDetails.hasKnots ? 'bg-primary' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${spaDetails.hasKnots ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {spaDetails.hasKnots && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="space-y-3"
                                                >
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Em quais regiões?</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {KNOT_REGIONS.map(region => (
                                                            <button
                                                                key={region}
                                                                type="button"
                                                                onClick={() => toggleKnotRegion(region)}
                                                                className={`p-3 text-[10px] font-bold rounded-xl border-2 transition-all flex items-center justify-between ${spaDetails.knotRegions.includes(region) ? 'border-primary bg-primary/5 text-primary' : 'border-white bg-white text-gray-400'}`}
                                                            >
                                                                {region}
                                                                {spaDetails.knotRegions.includes(region) && <CheckCircle2 size={12} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[9px] text-primary font-bold animate-pulse">* O preço pode variar conforme a quantidade de regiões.</p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            )}

                            {/* TRANSPORT SECTION */}
                            {quoteType !== 'SPA' && (
                                <div className="animate-in fade-in duration-500">
                                    <h2 className="text-xl font-black text-secondary mb-8 flex items-center gap-3">
                                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><Truck size={20} /></div>
                                        Logística Leva e Traz
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-orange-50/30 p-10 rounded-[40px] border border-orange-100/50">
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <MapPin size={14} /> Endereço de Busca (Origem)
                                                </label>
                                                <textarea
                                                    required
                                                    placeholder="Onde buscamos o pet? (Casa, trabalho, etc)"
                                                    value={transportDetails.origin}
                                                    onChange={(e) => setTransportDetails({ ...transportDetails, origin: e.target.value })}
                                                    className="w-full bg-white border-2 border-transparent focus:border-orange-500/20 rounded-[24px] px-6 py-4 shadow-sm text-secondary font-medium min-h-[100px] transition-all resize-none"
                                                />
                                            </div>

                                            {quoteType === 'TRANSPORTE' && (
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                        <MapPin size={14} /> Destino da 'Leva' (Primeira Pernada)
                                                    </label>
                                                    <textarea
                                                        required
                                                        placeholder="Onde deixamos o pet primeiro?"
                                                        value={transportDetails.destination}
                                                        onChange={(e) => setTransportDetails({ ...transportDetails, destination: e.target.value })}
                                                        className="w-full bg-white border-2 border-transparent focus:border-orange-500/20 rounded-[24px] px-6 py-4 shadow-sm text-secondary font-medium min-h-[100px] transition-all resize-none"
                                                    />
                                                </div>
                                            )}

                                            {quoteType === 'SPA_TRANSPORTE' && (
                                                <div className="p-6 bg-white rounded-3xl border border-orange-100 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shadow-sm"><MapPin size={20} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destino do SPA</p>
                                                        <p className="text-[11px] font-bold text-secondary">{SHOP_ADDRESS}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <RefreshCcw size={14} /> Retorno (Traz)
                                                </label>
                                                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
                                                    <p className="text-xs font-bold text-secondary">Mesmo endereço da busca?</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTransportDetails({ ...transportDetails, isReturnSame: !transportDetails.isReturnSame })}
                                                        className={`w-12 h-6 rounded-full relative transition-all ${transportDetails.isReturnSame ? 'bg-orange-500' : 'bg-gray-200'}`}
                                                    >
                                                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${transportDetails.isReturnSame ? 'left-6.5' : 'left-0.5'}`} />
                                                    </button>
                                                </div>
                                                {!transportDetails.isReturnSame && (
                                                    <textarea
                                                        required
                                                        placeholder="Informe o endereço para onde levamos o pet depois..."
                                                        value={transportDetails.returnAddress}
                                                        onChange={(e) => setTransportDetails({ ...transportDetails, returnAddress: e.target.value })}
                                                        className="w-full bg-white border-2 border-transparent focus:border-orange-500/20 rounded-[24px] px-6 py-4 shadow-sm text-secondary font-medium min-h-[100px] transition-all resize-none animate-in slide-in-from-top-2"
                                                    />
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Quantidade de Pets</label>
                                                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl w-fit border border-orange-100">
                                                    <button type="button" onClick={() => setTransportDetails(t => ({ ...t, petQuantity: Math.max(1, t.petQuantity - 1) }))} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl hover:bg-orange-100 transition-colors"><Minus size={18} /></button>
                                                    <span className="w-8 text-center font-black text-secondary">{transportDetails.petQuantity}</span>
                                                    <button type="button" onClick={() => setTransportDetails(t => ({ ...t, petQuantity: t.petQuantity + 1 }))} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl hover:bg-orange-100 transition-colors"><Plus size={18} /></button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]">Período</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['MANHA', 'TARDE', 'NOITE'].map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setTransportDetails({ ...transportDetails, period: p })}
                                                            className={`py-3 text-[10px] font-black rounded-xl border-2 transition-all ${transportDetails.period === p ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-100 text-gray-400'}`}
                                                        >
                                                            {p === 'MANHA' ? 'Manhã' : p === 'TARDE' ? 'Tarde' : 'Noite'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-6 bg-red-50 text-red-600 rounded-[32px] border border-red-100 flex items-center gap-4">
                                <AlertCircle size={28} />
                                <span className="font-black text-sm uppercase tracking-tight">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[40px] shadow-lg border border-gray-50">
                            <button type="button" onClick={() => setStep(1)} className="font-black text-gray-400 hover:text-secondary uppercase tracking-widest text-xs">Voltar</button>
                            <LoadingButton
                                type="submit"
                                isLoading={isSubmitting}
                                loadingText="Enviando..."
                                className="px-14 py-6 rounded-[28px] text-xl"
                                rightIcon={<Send size={24} />}
                            >
                                Solicitar Orçamento
                            </LoadingButton>
                        </div>
                    </motion.form>
                )}
            </main>
        </div>
    );
}
