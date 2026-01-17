import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import BackButton from '../../components/BackButton';
import api from '../../services/api';
import ConfirmModal from '../../components/ConfirmModal';
import LoadingButton from '../../components/LoadingButton';

// Refactored Components
import QuoteTypeSelection from '../../components/client/QuoteTypeSelection';
import PetDateSelection from '../../components/client/PetDateSelection'; // Keep for compat if needed, but we'll use others
import SPAServicesSection from '../../components/client/SPAServicesSection';
import TransportSection from '../../components/client/TransportSection';
import PetHairSelection from '../../components/client/PetHairSelection';
import DateTimeSelection from '../../components/client/DateTimeSelection';

const SHOP_ADDRESS = "The Pet - Av Hildebrando de Lima, 525, Km 18, Osasco, SP";

interface Service {
    id: string;
    name: string;
    basePrice: number;
    category?: string;
    type?: string;
    species: string;
    minWeight?: number;
    maxWeight?: number;
    sizeLabel?: string;
    coatType?: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    category?: string;
}

interface Pet {
    id: string;
    name: string;
    species: string;
    weight?: number;
    breed?: string;
}

type QuoteType = 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';

const fetchServices = async (): Promise<Service[]> => {
    const response = await api.get('/services');
    return response.data;
};

const fetchProducts = async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data;
};

const fetchPets = async (): Promise<Pet[]> => {
    const response = await api.get('/pets');
    return response.data;
};

const fetchMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

export default function QuoteRequest() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Type Selection, 2: Form
    const [quoteType, setQuoteType] = useState<QuoteType | null>(null);

    const [items, setItems] = useState([{ serviceId: '', description: '', quantity: 1 }]);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [desiredDate, setDesiredDate] = useState('');
    const [desiredTime, setDesiredTime] = useState('');

    const { data: services = [] } = useQuery({ queryKey: ['services'], queryFn: fetchServices });
    const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
    const { data: pets = [] } = useQuery({ queryKey: ['pets'], queryFn: fetchPets });
    const { data: userData } = useQuery({ queryKey: ['me'], queryFn: fetchMe });

    const [communicationPrefs, setCommunicationPrefs] = useState<string[]>(['APP']);

    // SPA Details
    const [spaDetails, setSpaDetails] = useState({
        hasKnots: false,
        knotRegions: [] as string[],
        hairLength: 'curto',
        hasParasites: false,
        parasiteTypes: '', // 'PULGA', 'CARRAPATO', ou 'AMBOS'
        parasiteComments: '',
        wantsMedicatedBath: false
    });

    // Transport Details
    const [transportDetails, setTransportDetails] = useState({
        origin: '',
        destination: '7Pet',
        returnAddress: '',
        isReturnSame: true,
        petQuantity: 1,
        period: 'MANHA',
        transportType: 'LEVA_E_TRAZ' // LEVA_E_TRAZ, SO_LEVA, SO_TRAZ
    });

    useEffect(() => {
        if (userData?.customer?.communicationPrefs) {
            setCommunicationPrefs(userData.customer.communicationPrefs);
        }
        const userAddress = userData?.address || userData?.customer?.address;
        if (userAddress && !transportDetails.origin) {
            setTransportDetails(prev => ({
                ...prev,
                origin: userAddress,
                returnAddress: userAddress
            }));
        }
    }, [userData]);

    const [transportInfo, setTransportInfo] = useState<{
        distanceText: string;
        durationText: string;
        distanceValue: number;
        durationValue: number;
        estimatedPrice?: number;
    } | null>(null);
    const [isCalculatingTransport, setIsCalculatingTransport] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [savedAsDraft, setSavedAsDraft] = useState(false);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

    const selectedPet = pets.find(p => p.id === selectedPetId);

    // Helper: Determine pet size based on weight
    const getPetSize = (weight?: number): string | null => {
        if (!weight) return null;
        if (weight <= 3) return 'Mini';
        if (weight <= 7) return 'Pequeno';
        if (weight <= 15) return 'Médio';
        if (weight <= 30) return 'Grande';
        if (weight <= 50) return 'Gigante';
        return 'XGigante';
    };

    const petSize = selectedPet ? getPetSize(selectedPet.weight) : null;

    // Filter services based on selected pet species, size (porte), and hair type
    const availableServices = services.filter(s => {
        if (!selectedPet) return true;

        // 1. Species Match (Canino/Felino)
        const petSpecies = selectedPet.species.toLowerCase();
        const serviceSpecies = s.species.toLowerCase();

        const speciesMatch = serviceSpecies.includes(petSpecies) ||
            (petSpecies === 'cachorro' && serviceSpecies === 'canino') ||
            (petSpecies === 'gato' && serviceSpecies === 'felino');

        if (!speciesMatch) return false;

        // 2. Size/Porte Match - Show services for pet's size OR services available for all sizes
        if (petSize && s.sizeLabel) {
            // Service has a specific size requirement
            // Accept if service matches pet size OR service is available for all sizes
            if (s.sizeLabel !== 'Todos' && s.sizeLabel !== petSize) return false;
        }

        // 3. Hair Type Filter - Match coatType with selected hairLength
        if (spaDetails.hairLength && s.coatType) {
            const hairMap: { [key: string]: string } = {
                'curto': 'Curto',
                'medio': 'Médio',
                'longo': 'Longo'
            };

            const expectedCoat = hairMap[spaDetails.hairLength];
            if (expectedCoat && s.coatType !== expectedCoat) return false;
        }

        return true;
    });

    // Intelligent Product Filtering based on Pet Profile
    const availableProducts = products.filter(p => {
        if (!selectedPet) return true;
        // Simple intelligent matching: look for pet species or size in product name/description/category
        const profileTags = [
            selectedPet.species.toLowerCase(),
            petSize?.toLowerCase(),
            selectedPet.breed?.toLowerCase()
        ].filter(Boolean);

        const searchText = (p.name + ' ' + (p.category || '')).toLowerCase();

        // If product mentions a different species, exclude it
        if (selectedPet.species.toLowerCase().includes('cão') || selectedPet.species.toLowerCase().includes('cachorro') || selectedPet.species.toLowerCase().includes('canino')) {
            if (searchText.includes('gato') || searchText.includes('felino')) return false;
        }
        if (selectedPet.species.toLowerCase().includes('gato') || selectedPet.species.toLowerCase().includes('felino')) {
            if (searchText.includes('cão') || searchText.includes('cachorro') || searchText.includes('canino')) return false;
        }

        return true;
    });

    // Categorize services for SPA using the 'type' field
    const banhoServices = availableServices.filter(s =>
        s.type && s.type.toLowerCase() === 'banho'
    );
    const tosaServices = availableServices.filter(s =>
        s.type && s.type.toLowerCase() === 'tosa'
    );
    const extraServices = availableServices.filter(s =>
        s.type && s.type.toLowerCase() === 'outros'
    );

    const [selectedBanhoId, setSelectedBanhoId] = useState('');
    const [selectedTosaId, setSelectedTosaId] = useState('');

    useEffect(() => {
        // Reset selections when pet changes to ensure compatibility with weight/porte limits
        setSelectedBanhoId('');
        setSelectedTosaId('');
        setItems([]);
    }, [selectedPetId]);

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

    const handleCalculateTransport = async () => {
        if (!transportDetails.origin) return;

        setIsCalculatingTransport(true);
        try {
            const res = await api.post('/maps/calculate', { address: transportDetails.origin });
            setTransportInfo(res.data);
        } catch (err) {
            console.error('Erro ao calcular transporte:', err);
            // Optionally set an error state for transport specific error
        } finally {
            setIsCalculatingTransport(false);
        }
    };

    const handleConfirmSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPetId) {
            setError('Por favor, selecione qual o Pet.');
            return;
        }

        if (quoteType !== 'TRANSPORTE') {
            const hasAnySPAService = selectedBanhoId || selectedTosaId || items.some(item => item.serviceId);
            if (!hasAnySPAService) {
                setError('Por favor, selecione ao menos um serviço de SPA (Banho, Tosa ou Extra).');
                return;
            }
        }

        if (quoteType !== 'SPA' && !transportDetails.origin) {
            setError('O endereço de origem é obrigatório para o transporte.');
            return;
        }

        setError(null);
        setShowConfirmSubmit(true);
    };

    const handleSaveAsDraft = async () => {
        setIsSubmitting(true);
        setError(null);
        await handleSubmit(true);
    };

    const handleSubmit = async (saveAsDraft: boolean = false) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const desiredAt = desiredDate && desiredTime ? `${desiredDate}T${desiredTime}` : undefined;

            // Combine categorized items
            const finalItems = [
                ...(selectedBanhoId ? [{
                    serviceId: selectedBanhoId,
                    description: services.find(s => s.id === selectedBanhoId)?.name || 'Banho',
                    quantity: 1
                }] : []),
                ...(selectedTosaId ? [{
                    serviceId: selectedTosaId,
                    description: services.find(s => s.id === selectedTosaId)?.name || 'Tosa',
                    quantity: 1
                }] : []),
                ...items
                    .filter(item => item.serviceId)
                    .map(item => ({
                        serviceId: item.serviceId,
                        description: item.description || services.find(s => s.id === item.serviceId)?.name || 'Serviço Extra',
                        quantity: item.quantity || 1
                    })),
                // Intelligent product suggestions based on pet profile
                // Automatically include specific products if intelligently matched and requested
                ...(spaDetails.hasParasites && products && products.length > 0 ?
                    [products.find(p => p.name.toLowerCase().includes('antipulga') || (p.category && p.category.toLowerCase().includes('parasita')))].filter(Boolean).map(p => ({
                        productId: p!.id,
                        description: p!.name,
                        quantity: 1
                    })) : []),
                ...(spaDetails.hasKnots ?
                    (() => {
                        // First try to find a matching service (preferred)
                        const knotService = services && services.length > 0
                            ? services.find(s => s.type === 'Outros' && (s.name.toLowerCase().includes('desembolo') || s.name.toLowerCase().includes('nós')))
                            : null;

                        if (knotService) {
                            return [{
                                serviceId: knotService.id,
                                description: knotService.name,
                                quantity: 1
                            }];
                        }

                        // Fallback to product if no service found
                        if (products && products.length > 0) {
                            return products
                                .filter(p => p.name.toLowerCase().includes('desembolo') || p.name.toLowerCase().includes('nós'))
                                .map(p => ({
                                    productId: p.id,
                                    description: p.name,
                                    quantity: 1
                                }));
                        }
                        return [];
                    })() : [])
            ];

            await api.post('/quotes', {
                type: quoteType,
                items: quoteType === 'TRANSPORTE' ? [] : finalItems,
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
                hasParasites: spaDetails.hasParasites,
                parasiteTypes: spaDetails.parasiteTypes,
                parasiteComments: spaDetails.parasiteComments,
                wantsMedicatedBath: spaDetails.wantsMedicatedBath,
                saveAsDraft
            });

            // Proactively update user preference
            await api.patch('/auth/me', { communicationPrefs });

            setSavedAsDraft(saveAsDraft);
            setSuccess(true);
            setShowConfirmSubmit(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao enviar solicitação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <main className="p-6 md:p-10 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center bg-white p-12 rounded-[48px] shadow-sm max-w-lg border border-gray-50"
                >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-secondary mb-4">
                        {savedAsDraft ? '💾 Rascunho Salvo!' : 'Solicitação Enviada!'}
                    </h2>
                    <p className="text-gray-500 mb-8">
                        {savedAsDraft
                            ? 'Seu rascunho foi salvo com sucesso. Você pode continuar editando ou enviar quando estiver pronto.'
                            : 'Nossa equipe analisará seu pedido e enviará o orçamento em breve. Você pode acompanhar o status na lista de orçamentos.'}
                    </p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => navigate('/client/quotes')} className="btn-primary w-full py-4">Ver Meus Orçamentos</button>
                        <button onClick={() => navigate('/client/dashboard')} className="text-gray-400 font-bold hover:text-secondary transition-colors">Voltar ao Início</button>
                    </div>
                </motion.div>
            </main>
        );
    }

    return (
        <>
            <main className="p-6 md:p-10 max-w-5xl">
                <header className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        {(step === 2 || step === 3) && (
                            <button
                                onClick={() => setStep(step === 3 ? 2 : 1)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <BackButton />
                    </div>
                    <h1 className="text-4xl font-extrabold text-secondary">Solicitar <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Orçamento</span></h1>
                    <p className="text-gray-500 mt-3">
                        {step === 1 ? 'Escolha o tipo de serviço:' :
                            step === 2 ? 'Fale um pouco sobre seu Pet:' :
                                `Detalhes para ${quoteType === 'SPA' ? 'SPA' : quoteType === 'TRANSPORTE' ? 'Transporte' : 'SPA + Transporte'}`}
                    </p>
                </header>

                {step === 1 ? (
                    <QuoteTypeSelection onSelect={(type) => { setQuoteType(type); setStep(2); }} />
                ) : step === 2 ? (
                    <PetHairSelection
                        pets={pets}
                        selectedPetId={selectedPetId}
                        onPetChange={setSelectedPetId}
                        hairLength={spaDetails.hairLength}
                        onHairLengthChange={(length) => setSpaDetails(p => ({ ...p, hairLength: length }))}
                        quoteType={quoteType}
                        onNext={() => setStep(3)}
                    />
                ) : (
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleConfirmSubmit}
                        className="space-y-6"
                    >
                        <div className="bg-white rounded-[48px] p-10 shadow-sm border border-gray-100 overflow-hidden relative">
                            {/* Summary header for chosen pet/hair */}
                            <div className="mb-10 bg-gray-50 p-6 rounded-[32px] flex items-center justify-between border border-gray-100">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Escolha Personalizada p/</p>
                                    <h3 className="text-lg font-black text-secondary uppercase">{selectedPet?.name} <span className="text-primary italic opacity-50">• {spaDetails.hairLength}</span></h3>
                                </div>
                                <button type="button" onClick={() => setStep(2)} className="text-[10px] font-black uppercase text-primary hover:underline">Trocar Pet</button>
                            </div>

                            <DateTimeSelection
                                desiredDate={desiredDate}
                                onDateChange={setDesiredDate}
                                desiredTime={desiredTime}
                                onTimeChange={setDesiredTime}
                            />

                            {quoteType !== 'TRANSPORTE' && (
                                <SPAServicesSection
                                    selectedPetId={selectedPetId}
                                    banhoServices={banhoServices}
                                    tosaServices={tosaServices}
                                    extraServices={extraServices}
                                    selectedBanhoId={selectedBanhoId}
                                    setSelectedBanhoId={setSelectedBanhoId}
                                    selectedTosaId={selectedTosaId}
                                    setSelectedTosaId={setSelectedTosaId}
                                    items={items}
                                    onAddItem={addItem}
                                    onRemoveItem={removeItem}
                                    onUpdateItem={updateItem} // Legacy, integrated into handlers
                                    onServiceSelect={handleServiceSelect}
                                    spaDetails={spaDetails}
                                    setSpaDetails={setSpaDetails}
                                    toggleKnotRegion={toggleKnotRegion}
                                />
                            )}

                            {quoteType !== 'SPA' && (
                                <TransportSection
                                    transportDetails={transportDetails}
                                    setTransportDetails={setTransportDetails}
                                    onCalculate={handleCalculateTransport}
                                    isCalculating={isCalculatingTransport}
                                    transportInfo={transportInfo}
                                    quoteType={quoteType}
                                    shopAddress={SHOP_ADDRESS}
                                />
                            )}
                        </div>

                        {error && (
                            <div className="p-6 bg-red-50 text-red-600 rounded-[32px] border border-red-100 flex items-center gap-4">
                                <AlertCircle size={28} />
                                <span className="font-black text-sm uppercase tracking-tight">{error}</span>
                            </div>
                        )}

                        <div id="tour-communication" className="bg-white p-8 rounded-[40px] shadow-lg border border-gray-50 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-lg font-black text-secondary uppercase tracking-tight">Como prefere receber o orçamento?</h3>
                                <p className="text-xs text-gray-400 font-medium">Sua resposta nos ajuda a agilizar o atendimento.</p>
                            </div>
                            <div className="flex gap-3">
                                {[
                                    { id: 'APP', label: 'Pelo App' },
                                    { id: 'WHATSAPP', label: 'WhatsApp' }
                                ].map(pref => (
                                    <button
                                        key={pref.id}
                                        type="button"
                                        onClick={() => setCommunicationPrefs(prev =>
                                            prev.includes(pref.id) ? prev.filter(p => p !== pref.id) : [...prev, pref.id]
                                        )}
                                        className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border-2 ${communicationPrefs.includes(pref.id) ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                                    >
                                        {pref.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[40px] shadow-lg border border-gray-50">
                            <button type="button" onClick={() => setStep(2)} className="font-black text-gray-400 hover:text-secondary uppercase tracking-widest text-xs">Voltar</button>
                            <div className="flex gap-4">
                                <LoadingButton
                                    type="button"
                                    onClick={handleSaveAsDraft}
                                    isLoading={isSubmitting}
                                    loadingText="Salvando..."
                                    className="px-10 py-6 rounded-[28px] text-lg bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200"
                                >
                                    💾 Salvar Rascunho
                                </LoadingButton>
                                <LoadingButton
                                    type="submit"
                                    isLoading={isSubmitting}
                                    loadingText="Enviando..."
                                    className="px-14 py-6 rounded-[28px] text-xl"
                                >
                                    Solicitar Agora
                                </LoadingButton>
                            </div>
                        </div>
                    </motion.form>
                )}
            </main>

            <AnimatePresence>
                {showConfirmSubmit && (
                    <ConfirmModal
                        isOpen={showConfirmSubmit}
                        onClose={() => setShowConfirmSubmit(false)}
                        onConfirm={handleSubmit}
                        title="Confirmar Solicitação"
                        description="Deseja enviar seu pedido de orçamento agora? Nossa equipe responderá o mais breve possível."
                        confirmText="Sim, Enviar"
                        cancelText="Ainda não"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
