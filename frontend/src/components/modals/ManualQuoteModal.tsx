import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Truck, MapPin, RefreshCcw, Scissors, Droplets, Bug, AlertTriangle, Calendar, Minus, CheckCircle, Info, Eye, Edit, Copy, User, Search, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../ui/Badge';
import { Phone } from 'lucide-react';
import { useDirtyState } from '../../hooks/useDirtyState';
import ConfirmModal from '../ConfirmModal';

interface ManualQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (quote: any) => void;
    initialType?: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
}

export default function ManualQuoteModal({ isOpen, onClose, onSuccess, initialType = 'SPA' }: ManualQuoteModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeItemSearch, setActiveItemSearch] = useState<{ index: number, query: string } | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [strategicDiscount, setStrategicDiscount] = useState<number | ''>(0);
    const [creditCardFee, setCreditCardFee] = useState<number | ''>(0); // Taxa de cartão de crédito em %
    // We default to false because we now use the external QuoteTypeSelectorModal
    const [selectionStep, setSelectionStep] = useState(false);

    // Dirty State Tracking
    const [isDirtyState, setIsDirtyState] = useState(false);
    const { showConfirm, handleClose, confirmClose, cancelClose } = useDirtyState(isDirtyState, onClose);

    // Form State
    const [customer, setCustomer] = useState({
        id: '', // Added for existing customers
        name: '',
        email: '',
        phone: '',
        address: '',
        type: 'AVULSO', // AVULSO ou RECORRENTE
        recurrenceFrequency: 'MENSAL' as 'MENSAL' | 'QUINZENAL' | 'SEMANAL' | null,
        transportDaysPerWeek: 1 as number,
        transportDays: [] as string[],
    });

    // Search State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchMode, setSearchMode] = useState<'NEW' | 'EXISTING'>('NEW');

    // Full Customer Search Picker
    const [showFullCustomerSearch, setShowFullCustomerSearch] = useState(false);
    const [allCustomers, setAllCustomers] = useState<any[]>([]);
    const [isFetchingCustomers, setIsFetchingCustomers] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');

    const [pet, setPet] = useState({
        id: '',
        name: '',
        species: 'Canino',
        breed: '',
        weight: '',
        coatType: 'CURTO',
        temperament: 'DOCIL',
        age: '',
        observations: '',
        hasKnots: false,
        knotRegions: [] as string[],
        hasParasites: false,
        hasMattedFur: false,
        healthIssues: '',
        allergies: '',
        parasiteTypes: '',
        parasiteComments: '',
        wantsMedicatedBath: false
    });

    const [customerPets, setCustomerPets] = useState<any[]>([]);

    const [quote, setQuote] = useState({
        type: initialType,
        desiredAt: '',
        transportOrigin: '',
        transportDestination: '7Pet',
        transportReturnAddress: '',
        isReturnSame: true,
        transportPeriod: 'MANHA',
        transportLevaAt: '',
        transportTrazAt: '',
        petQuantity: 1,
        items: [] as any[]
    });

    // Reset/Update type when modal opens or initialType changes
    useEffect(() => {
        if (isOpen) {
            setQuote(prev => ({ ...prev, type: initialType }));
            setIsDirtyState(false);
        }
    }, [isOpen, initialType]);

    const [transportInfo, setTransportInfo] = useState<any>(null);
    const [isCalculatingTransport, setIsCalculatingTransport] = useState(false);
    const [transportType, setTransportType] = useState<'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF'>('ROUND_TRIP');
    const [transportParadas, setTransportParadas] = useState<Array<{ address: string; km: number; min: number; active: boolean }>>([]);
    const [generationTime] = useState(new Date().toLocaleString('pt-BR'));

    // Estados para produtos selecionados (1 de cada categoria)
    const [selectedProductBanho, setSelectedProductBanho] = useState<any>(null);
    const [selectedProductTosa, setSelectedProductTosa] = useState<any>(null);
    const [selectedProductExtra, setSelectedProductExtra] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            fetchServices();
        }
    }, [isOpen]);

    // Active Search Effect
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            const query = customer.name.length >= 3 ? customer.name : (customer.phone.length >= 5 ? customer.phone : '');
            if (query && searchMode === 'NEW') {
                try {
                    const res = await api.get(`/customers/search?q=${query}`);
                    setSearchResults(res.data);
                    setShowSuggestions(res.data.length > 0);
                } catch (error) {
                    // Silenciar erros de busca para não poluir o console
                }
            } else if (!query) {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [customer.name, customer.phone, searchMode]);

    // Fetch full customer base when the picker is opened
    useEffect(() => {
        const fetchFullBase = async () => {
            if (!showFullCustomerSearch || allCustomers.length > 0) return;

            setIsFetchingCustomers(true);
            try {
                const res = await api.get('/customers?active=true');
                setAllCustomers(res.data.customers || res.data || []);
            } catch (error) {
                console.error('Error fetching full customer base:', error);
                toast.error('Erro ao carregar lista completa de clientes');
            } finally {
                setIsFetchingCustomers(false);
            }
        };
        fetchFullBase();
    }, [showFullCustomerSearch, allCustomers.length]);

    const fetchServices = async () => {
        try {
            const [svcRes, prodRes] = await Promise.all([
                api.get('/services'),
                api.get('/products')
            ]);
            // A API pode retornar array direto ou { items: [...] }
            const svcData = Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data.items || []);
            const prodData = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.items || []);



            setServices(svcData);
            setProducts(prodData);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        }
    };

    const handleCalculateTransport = async () => {
        const origin = quote.transportOrigin || customer.address;
        if (!origin) return toast.error('Informe um endereço de origem para calcular');

        setIsCalculatingTransport(true);
        try {
            // Coletar endereços das paradas ativas
            const stopsAddresses = transportParadas.filter(p => p.active && p.address).map(p => p.address);

            const res = await api.post('/maps/calculate', {
                address: origin,
                destinationAddress: quote.transportDestination,
                type: transportType,
                stops: stopsAddresses
            });

            // Garantir que temos um número válido para evitar NaN
            const basePrice = Number(res.data?.estimatedPrice || res.data?.total) || 0;

            // Acréscimo por pet adicional: +20% por cada pet EXTRA (ex: 2 pets = +20%, 3 pets = +40%)
            const extraPets = Math.max(0, quote.petQuantity - 1);
            const petSurchargeMultiplier = 1 + (extraPets * 0.2);

            const calculatedPrice = basePrice * petSurchargeMultiplier;

            // Atualizar paradas com valores calculados se existirem
            if (res.data?.breakdown?.paradas) {
                const updatedParadas = [...transportParadas];
                let stopIdx = 0;
                updatedParadas.forEach((p, idx) => {
                    if (p.active && p.address) {
                        const calculated = res.data.breakdown.paradas[stopIdx];
                        if (calculated) {
                            updatedParadas[idx] = {
                                ...p,
                                km: calculated.distanceKm,
                                min: calculated.durationMin
                            };
                            stopIdx++;
                        }
                    }
                });
                setTransportParadas(updatedParadas);
            }

            setTransportInfo({
                ...res.data,
                basePrice: basePrice,
                estimatedPrice: Number(calculatedPrice.toFixed(2)),
                discountPercent: 0,
                legs: {
                    largada: {
                        km: res.data?.breakdown?.largada?.distanceKm || 0,
                        min: res.data?.breakdown?.largada?.durationMin || 0,
                        active: !!res.data?.breakdown?.largada
                    },
                    leva: {
                        km: res.data?.breakdown?.leva?.distanceKm || 0,
                        min: res.data?.breakdown?.leva?.durationMin || 0,
                        active: !!res.data?.breakdown?.leva
                    },
                    traz: {
                        km: res.data?.breakdown?.traz?.distanceKm || 0,
                        min: res.data?.breakdown?.traz?.durationMin || 0,
                        active: !!res.data?.breakdown?.traz
                    },
                    retorno: {
                        km: res.data?.breakdown?.retorno?.distanceKm || 0,
                        min: res.data?.breakdown?.retorno?.durationMin || 0,
                        active: !!res.data?.breakdown?.retorno
                    }
                }
            });

            if (calculatedPrice > 0) {
                toast.success(`Transporte calculado: R$ ${calculatedPrice.toFixed(2)}`);
            } else {
                setTransportInfo({
                    ...res.data,
                    basePrice: 0,
                    estimatedPrice: '',
                    customKm: 0,
                    customMin: 0,
                    discountPercent: 0
                });
                toast.error('Valor não calculado automaticamente. Preencha manualmente.');
            }
        } catch (err) {
            console.error('Erro ao calcular transporte:', err);
            toast.error('Erro ao calcular transporte.');
            setTransportInfo({
                distanceText: '-',
                durationText: '-',
                basePrice: 0,
                estimatedPrice: '',
                customKm: 0,
                customMin: 0,
                discountPercent: 0
            });
        } finally {
            setIsCalculatingTransport(false);
        }
    };

    const recalculateTransport = (info: any) => {
        if (!info?.settings || !info?.legs) return;

        const settings = info.settings;
        const discount = Number(info.discountPercent) || 0;
        let base = 0;

        // Calcular base de acordo com tipo de transporte
        if (transportType === 'ROUND_TRIP') {
            // Pernada 1: Largada (apenas KM, sem MIN)
            if (info.legs.largada.active) {
                base += (Number(info.legs.largada.km) * settings.kmPriceLargada);
            }
            // Pernada 2: Leva (KM + MIN)
            if (info.legs.leva.active) {
                base += (Number(info.legs.leva.km) * settings.kmPriceLeva) + (Number(info.legs.leva.min) * settings.minPriceLeva);
            }
            // Pernada 3: Traz (KM + MIN)
            if (info.legs.traz.active) {
                base += (Number(info.legs.traz.km) * settings.kmPriceTraz) + (Number(info.legs.traz.min) * settings.minPriceTraz);
            }
            // Pernada 4: Retorno (apenas KM, sem MIN)
            if (info.legs.retorno.active) {
                base += (Number(info.legs.retorno.km) * settings.kmPriceRetorno);
            }
        } else if (transportType === 'PICK_UP') {
            // Só Leva - apenas pernada 2
            if (info.legs.leva.active) {
                base += (Number(info.legs.leva.km) * settings.kmPriceLeva) + (Number(info.legs.leva.min) * settings.minPriceLeva);
            }
        } else if (transportType === 'DROP_OFF') {
            // Só Traz - apenas pernada 3
            if (info.legs.traz.active) {
                base += (Number(info.legs.traz.km) * settings.kmPriceTraz) + (Number(info.legs.traz.min) * settings.minPriceTraz);
            }
        }

        // Calcular paradas extras (aplicável a todos os tipos de transporte)
        // Usa os preços de "leva" como base para as paradas intermediárias
        let paradasTotal = 0;
        transportParadas.forEach(parada => {
            if (parada.active) {
                paradasTotal += (Number(parada.km) * (settings.kmPriceLeva || 1)) + (Number(parada.min) * (settings.minPriceLeva || 0.5));
            }
        });
        base += paradasTotal;

        // Salvar base antes do acréscimo para exibir separadamente
        const baseBeforeSurcharge = base;

        // Surcharge pets (porcentagem configurável)
        const extraPets = Math.max(0, quote.petQuantity - 1);
        const surchargePercentage = (settings?.additionalPetSurchargePercent || 20) / 100; // Configurable
        const surchargeAmount = base * (extraPets * surchargePercentage);
        base = base + surchargeAmount;

        // Desconto
        const final = base * (1 - (discount / 100));

        setTransportInfo({
            ...info,
            estimatedPrice: Number(final.toFixed(2)),
            basePrice: baseBeforeSurcharge,
            surchargeAmount: surchargeAmount,
            surchargePercentage: surchargePercentage * 100,
            extraPets: extraPets
        });
    };

    // Validação mínima para habilitar o botão "Calcular Agora"
    const canCalculateTransport = (): boolean => {
        // Precisa ter tipo de transporte selecionado
        if (!transportType) return false;

        // Precisa ter endereço de origem
        const origin = quote.transportOrigin || customer?.address;
        if (!origin || origin.trim().length === 0) return false;

        // Validação por tipo de transporte
        switch (transportType) {
            case 'PICK_UP':
                // Só Leva: precisa de Horário Leva
                return !!(quote.transportLevaAt && quote.transportLevaAt.trim().length > 0);
            case 'DROP_OFF':
                // Só Traz: precisa de Horário Traz
                return !!(quote.transportTrazAt && quote.transportTrazAt.trim().length > 0);
            case 'ROUND_TRIP':
                // Leva & Traz: precisa de ambos os horários
                return !!(
                    quote.transportLevaAt && quote.transportLevaAt.trim().length > 0 &&
                    quote.transportTrazAt && quote.transportTrazAt.trim().length > 0
                );
            default:
                return false;
        }
    };

    useEffect(() => {
        if (transportInfo) {
            recalculateTransport(transportInfo);
        }
    }, [quote.petQuantity, transportParadas]);

    // Sincronização automática do item de transporte quando for quote de TRANSPORTE_ONLY
    useEffect(() => {
        if (quote.type === 'TRANSPORTE' && transportInfo?.estimatedPrice !== undefined && transportInfo?.estimatedPrice !== '') {
            const transportLabels = {
                'ROUND_TRIP': '🔄 Leva e Traz',
                'PICK_UP': '📦 Só Leva (Coleta)',
                'DROP_OFF': '🏠 Só Traz (Entrega)'
            };

            const transportDescription = transportLabels[transportType];
            const price = Number(transportInfo.estimatedPrice) || 0;

            // Verificamos se já existe um item de transporte nos items
            // Procuramos por qualquer uma das descrições possíveis de transporte
            const existingIndex = quote.items.findIndex(item =>
                item.description === '🔄 Leva e Traz' ||
                item.description === '📦 Só Leva (Coleta)' ||
                item.description === '🏠 Só Traz (Entrega)'
            );

            if (existingIndex >= 0) {
                // Se já existe, verificamos se mudou algo antes de atualizar (evitar loop infinito)
                const currentItem = quote.items[existingIndex];
                if (currentItem.price !== price || currentItem.description !== transportDescription || currentItem.quantity !== quote.petQuantity) {
                    const newItems = [...quote.items];
                    newItems[existingIndex] = {
                        ...currentItem,
                        description: transportDescription,
                        price: price,
                        quantity: quote.petQuantity || 1
                    };
                    setQuote(prev => ({ ...prev, items: newItems }));
                }
            } else {
                // Se não existe, adicionamos como um novo item manual
                const newItem = {
                    serviceId: null,
                    productId: null,
                    isManual: true,
                    description: transportDescription,
                    quantity: quote.petQuantity || 1,
                    price: price
                };
                setQuote(prev => ({ ...prev, items: [...prev.items, newItem] }));
            }
        }
    }, [transportInfo?.estimatedPrice, transportType, quote.type, quote.petQuantity]);

    const handleAddTransportToQuote = () => {
        if (!transportInfo || (transportInfo.estimatedPrice === '' && transportInfo.estimatedPrice !== 0)) {
            return toast.error('Calcule ou informe o valor do transporte primeiro');
        }

        const transportLabels = {
            'ROUND_TRIP': '🔄 Leva e Traz',
            'PICK_UP': '📦 Só Leva (Coleta)',
            'DROP_OFF': '🏠 Só Traz (Entrega)'
        };

        const newItem = {
            serviceId: null,
            isManual: true,
            description: transportLabels[transportType],
            quantity: quote.petQuantity || 1,
            price: transportInfo.estimatedPrice
        };

        setQuote({ ...quote, items: [...quote.items, newItem] });
        toast.success('Transporte adicionado ao orçamento!');
        setTransportInfo(null); // Limpa para novo cálculo
        setTransportType('ROUND_TRIP'); // Reset to default
    };

    const normalizeSpecies = (s: string) => {
        const lower = s.toLowerCase();
        if (lower.includes('canin') || lower.includes('cachorro') || lower.includes('dog') || lower.includes('cão')) return 'CANINO';
        if (lower.includes('felin') || lower.includes('gato') || lower.includes('cat')) return 'FELINO';
        return lower;
    };

    const getFilteredServices = () => {
        // Se não tiver espécie definida, mostra tudo (fallback)
        if (!pet.species) {
            return services;
        }

        const pNorm = normalizeSpecies(pet.species);
        const pWeight = parseFloat(pet.weight) || 0;
        const pCoat = (pet.coatType || '').toUpperCase();

        const filteredServices = services.filter((service) => {
            // 1. Filtrar por espécie
            if (service.species) {
                const sNorm = normalizeSpecies(service.species);
                if (sNorm !== pNorm) {
                    return false;
                }
            }

            // 2. Filtrar por porte/peso - Usar sizeLabel primeiro, depois weight range
            const serviceSizeLabel = (service.sizeLabel || '').toUpperCase();

            // Mapear peso para sizeLabel esperado
            let expectedSizeLabel = '';
            if (pWeight > 0) {
                if (pWeight <= 5) expectedSizeLabel = 'MINI';
                else if (pWeight <= 10) expectedSizeLabel = 'PEQUENO';
                else if (pWeight <= 20) expectedSizeLabel = 'MÉDIO';
                else if (pWeight <= 35) expectedSizeLabel = 'GRANDE';
                else expectedSizeLabel = 'GIGANTE';

                // If service has sizeLabel defined, check if it matches roughly
                const sizes = ['MINI', 'PEQUENO', 'MÉDIO', 'GRANDE', 'GIGANTE'];
                const serviceIdx = sizes.indexOf(serviceSizeLabel);
                const expectedIdx = sizes.indexOf(expectedSizeLabel);

                // For manual quotes, we allow a margin of 1 level (e.g. PEQUENO pet can see MINI and MÉDIO services)
                if (serviceIdx !== -1 && expectedIdx !== -1) {
                    const diff = Math.abs(serviceIdx - expectedIdx);
                    if (diff > 1) {
                        return false;
                    }
                } else if (serviceSizeLabel && expectedSizeLabel && serviceSizeLabel !== expectedSizeLabel) {
                    // Fallback for labels not in our weight array
                    return false;
                }
            }

            // 3. Filtrar por tipo de pelo - Usar coatType do serviço em vez do nome
            if (pCoat && service.coatType) {
                const serviceCoatType = (service.coatType || '').toUpperCase();
                const petCoatType = pCoat.includes('CURTO') ? 'CURTO' :
                    pCoat.includes('LONGO') ? 'LONGO' :
                        pCoat.includes('MEDIO') || pCoat.includes('MÉDIO') ? 'MÉDIO' : '';

                if (petCoatType && serviceCoatType && petCoatType !== serviceCoatType) {
                    return false;
                }
            }

            return true;
        });

        return filteredServices;
    };

    // Categoriza e organiza serviços de forma inteligente
    const getCategorizedServices = () => {
        const filtered = getFilteredServices();

        const categories = {
            banho: [] as any[],
            tosa: [] as any[],
            extras: [] as any[]
        };

        filtered.forEach(s => {
            const name = (s.name || '').toLowerCase();
            const cat = (s.category || '').toLowerCase();
            const sub = (s.subcategory || '').toLowerCase();

            // Lógica de agrupamento baseada no nome ou categoria
            if (cat.includes('banho') || name.includes('banho') || sub.includes('banho')) {
                categories.banho.push(s);
            } else if (cat.includes('tosa') || name.includes('tosa') || sub.includes('tosa')) {
                categories.tosa.push(s);
            } else {
                categories.extras.push(s);
            }
        });

        // Ordenação alfabética dentro das categorias para facilitar leitura
        categories.banho.sort((a, b) => a.name.localeCompare(b.name));
        categories.tosa.sort((a, b) => a.name.localeCompare(b.name));
        categories.extras.sort((a, b) => a.name.localeCompare(b.name));

        return categories;
    };

    const getCategorizedProducts = () => {
        // Filtrar produtos que correspondem ao perfil do pet
        let filteredProducts = products;

        if (pet.species || pet.weight || pet.coatType) {
            const pNorm = normalizeSpecies(pet.species || '');
            const pWeight = parseFloat(pet.weight) || 0;
            const pCoat = (pet.coatType || '').toUpperCase();

            filteredProducts = products.filter(product => {
                const productName = (product.name || '').toUpperCase();

                // 1. Filtrar por espécie via nome do produto
                const productForDog = productName.includes('CÃO') || productName.includes('CANIN') || productName.includes('DOG');
                const productForCat = productName.includes('GATO') || productName.includes('FELIN') || productName.includes('CAT');

                if (pNorm === 'CANINO' && productForCat) return false;
                if (pNorm === 'FELINO' && productForDog) return false;

                // 2. Filtrar por porte/peso analisando o nome do produto
                if (pWeight > 0) {
                    // Identificar porte no nome do produto
                    const productIsMini = productName.includes('MINI') || productName.includes('P -');
                    const productIsSmall = productName.includes('P ') || productName.includes('PEQUENO');
                    const productIsMedium = productName.includes(' M ') || productName.includes('MÉDIO') || productName.includes('MEDIO');
                    const productIsLarge = productName.includes(' G ') || productName.includes('GRANDE');
                    const productIsXL = productName.includes('GG') || productName.includes('GIGANTE');

                    // Determinar porte do pet baseado no peso
                    let petSize = '';
                    if (pWeight < 5) petSize = 'MINI';
                    else if (pWeight >= 5 && pWeight < 10) petSize = 'P';
                    else if (pWeight >= 10 && pWeight < 25) petSize = 'M';
                    else if (pWeight >= 25 && pWeight < 40) petSize = 'G';
                    else if (pWeight >= 40) petSize = 'GG';

                    // Se o produto especifica porte, filtrar
                    if (productIsMini && petSize !== 'MINI') return false;
                    if (productIsSmall && petSize !== 'P') return false;
                    if (productIsMedium && petSize !== 'M') return false;
                    if (productIsLarge && petSize !== 'G') return false;
                    if (productIsXL && petSize !== 'GG') return false;
                }

                // 3. Filtrar por tipo de pelo analisando o nome
                if (pCoat) {
                    const productHasCurto = productName.includes('CURTO');
                    const productHasLongo = productName.includes('LONGO');
                    const productHasMedio = productName.includes('MEDIO') || productName.includes('MÉDIO');
                    const productHasCoatType = productHasCurto || productHasLongo || productHasMedio;

                    if (productHasCoatType) {
                        const petIsCurto = pCoat.includes('CURTO');
                        const petIsLongo = pCoat.includes('LONGO');
                        const petIsMedio = pCoat.includes('MEDIO') || pCoat.includes('MÉDIO');

                        if (petIsCurto && !productHasCurto) return false;
                        if (petIsLongo && !productHasLongo) return false;
                        if (petIsMedio && !productHasMedio) return false;
                    }
                }

                return true;
            });
        }

        // Categorizar em Banho, Tosa e Extras
        const categories = {
            banho: [] as any[],
            tosa: [] as any[],
            extras: [] as any[]
        };

        filteredProducts.forEach(p => {
            const name = (p.name || '').toLowerCase();
            const cat = (p.category || '').toLowerCase();

            // Lógica de agrupamento baseada no nome ou categoria
            if (cat.includes('banho') || name.includes('shampoo') || name.includes('condicionador') || name.includes('hidrat') || name.includes('banho')) {
                categories.banho.push(p);
            } else if (cat.includes('tosa') || name.includes('tesoura') || name.includes('máquina') || name.includes('lâmina') || name.includes('tosar')) {
                categories.tosa.push(p);
            } else {
                categories.extras.push(p);
            }
        });

        // Ordenação alfabética dentro das categorias
        categories.banho.sort((a, b) => a.name.localeCompare(b.name));
        categories.tosa.sort((a, b) => a.name.localeCompare(b.name));
        categories.extras.sort((a, b) => a.name.localeCompare(b.name));

        return categories;
    };

    const handleAddItem = (item?: any) => {
        const newItem = {
            serviceId: item?.basePrice !== undefined ? item.id : null,
            productId: item?.price !== undefined && item?.basePrice === undefined ? item.id : null,
            isManual: false, // Sempre inicia como item de catálogo (select)
            description: item?.name || '',
            quantity: 1,
            price: item?.price || item?.basePrice || 0
        };
        setQuote({ ...quote, items: [...quote.items, newItem] });
        setIsDirtyState(true);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...quote.items];
        newItems.splice(index, 1);
        setQuote({ ...quote, items: newItems });
        setIsDirtyState(true);
    };

    const handleDuplicateItem = (index: number) => {
        const itemToDuplicate = { ...quote.items[index] };
        const newItems = [...quote.items];

        // Create a new item with same properties but new ID if exists
        const duplicatedItem = {
            ...itemToDuplicate,
            id: undefined, // Let backend generate new ID
            description: itemToDuplicate.description + ' (cópia)'
        };

        // Insert right after the original item
        newItems.splice(index + 1, 0, duplicatedItem);
        setQuote({ ...quote, items: newItems });
        setIsDirtyState(true);

        toast.success('Item duplicado com sucesso!');
    };

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...quote.items];
        newItems[index] = { ...newItems[index], [field]: value };

        if (field === 'description' && newItems[index].isManual) {
            if (value.length >= 2) {
                setActiveItemSearch({ index, query: value });
            } else {
                setActiveItemSearch(null);
            }
        }

        if (field === 'serviceId') {
            if (value === 'MANUAL_UPGRADE') {
                newItems[index] = { ...newItems[index], serviceId: null, productId: null, isManual: true, description: '' };
            } else if (value === '' || value === 'PENDING') {
                newItems[index] = { ...newItems[index], serviceId: null, productId: null, isManual: false, description: '' };
            } else {
                // Tenta achar no serviço
                const svc = services.find(s => s.id === value);
                if (svc) {
                    newItems[index].description = svc.name;
                    newItems[index].price = svc.basePrice;
                    newItems[index].serviceId = value;
                    newItems[index].productId = null;
                    newItems[index].isManual = false;
                } else {
                    // Tenta achar no produto
                    const prod = products.find(p => p.id === value);
                    if (prod) {
                        newItems[index].description = prod.name;
                        newItems[index].price = prod.price;
                        newItems[index].productId = value;
                        newItems[index].serviceId = null;
                        newItems[index].isManual = false;
                    }
                }
            }
        }

        setQuote({ ...quote, items: newItems });
        setIsDirtyState(true);
    };

    const selectSuggestedItem = (idx: number, item: any) => {
        const newItems = [...quote.items];
        newItems[idx] = {
            ...newItems[idx],
            description: item.name,
            price: item.price || item.basePrice || 0,
            serviceId: item.basePrice !== undefined ? item.id : null,
            isManual: item.basePrice === undefined // Se não tem basePrice, provavelmente é produto e entra como manual
        };
        setQuote({ ...quote, items: newItems });
        setActiveItemSearch(null);
        setIsDirtyState(true);
    };

    const handleSelectCustomer = (selected: any) => {
        setCustomer({
            id: selected.id,
            name: selected.name,
            email: selected.user?.email || '',
            phone: selected.phone || selected.user?.phone || '',
            address: selected.address || selected.user?.address || '',
            type: selected.type || 'AVULSO',
            recurrenceFrequency: selected.recurrenceFrequency || 'MENSAL',
            transportDaysPerWeek: selected.transportDaysPerWeek || 1,
            transportDays: selected.transportDays || []
        });
        setCustomerPets(selected.pets || []);

        // If customer has pets, pre-select the first one if applicable
        if (selected.pets && selected.pets.length > 0) {
            const p = selected.pets[0];
            setPet({
                id: p.id,
                name: p.name,
                species: p.species,
                breed: p.breed || '',
                weight: p.weight?.toString() || '',
                coatType: p.coatType || 'CURTO',
                temperament: p.temperament || 'DOCIL',
                age: p.age || '',
                observations: p.observations || '',
                hasKnots: p.hasKnots || false,
                knotRegions: p.knotRegions ? (typeof p.knotRegions === 'string' ? p.knotRegions.split(',') : p.knotRegions) : [],
                hasParasites: p.hasParasites || false,
                hasMattedFur: p.hasMattedFur || false,
                healthIssues: p.healthIssues || '',
                allergies: p.allergies || '',
                parasiteTypes: p.parasiteTypes || '',
                parasiteComments: p.parasiteComments || '',
                wantsMedicatedBath: false
            });
        }

        setSearchMode('EXISTING');
        setShowSuggestions(false);
        setIsDirtyState(true);
        toast.success(`Cliente ${selected.name} selecionado.`);
    };

    const toggleKnotRegion = (region: string) => {
        setPet(prev => ({
            ...prev,
            knotRegions: prev.knotRegions.includes(region)
                ? prev.knotRegions.filter(r => r !== region)
                : [...prev.knotRegions, region]
        }));
        setIsDirtyState(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!customer.name || !customer.email) {
            return toast.error('Nome e Email do cliente são obrigatórios');
        }

        if (quote.items.length === 0 && quote.type !== 'TRANSPORTE') {
            return toast.error('Adicione pelo menos um item ao orçamento');
        }

        // Mostrar resumo antes de criar
        setShowSummary(true);
    };

    // Função para confirmar e criar o orçamento
    const confirmCreateQuote = async () => {
        setIsLoading(true);
        try {
            // Validações adicionais no frontend
            if (!customer.email || !customer.name) {
                toast.error('Nome e email do cliente são obrigatórios');
                setIsLoading(false);
                return;
            }

            if (!pet.name) {
                toast.error('Nome do pet é obrigatório');
                setIsLoading(false);
                return;
            }

            // Garantir que items seja sempre um array
            const itemsForQuote = quote.items || [];

            if (itemsForQuote.length === 0 && quote.type !== 'TRANSPORTE') {
                toast.error('Adicione pelo menos um item ao orçamento');
                setIsLoading(false);
                return;
            }

            const payload = {
                customer: {
                    ...customer,
                    recurrenceFrequency: customer.type === 'RECORRENTE' ? customer.recurrenceFrequency : null,
                },
                pet: {
                    ...pet,
                    weight: parseFloat(pet.weight) || 0 // Ensure weight is numeric
                },
                quote: {
                    ...quote,
                    items: itemsForQuote, // Ensure items are included
                    recurrenceFrequency: customer.type === 'RECORRENTE' ? customer.recurrenceFrequency : null,
                    type: quote.type || 'SPA',
                    desiredAt: quote.desiredAt || null,
                    transportOrigin: quote.transportOrigin || customer.address || '',
                    transportDestination: quote.transportDestination || '7Pet',
                    transportReturnAddress: quote.isReturnSame ? (quote.transportOrigin || customer.address) : quote.transportReturnAddress,
                    transportType: transportType,
                    transportPeriod: quote.transportPeriod || 'MANHA',
                    petQuantity: Number(quote.petQuantity) || 1,
                    hasKnots: Boolean(pet.hasKnots),
                    knotRegions: Array.isArray(pet.knotRegions) ? pet.knotRegions.join(', ') : '',
                    hasParasites: Boolean(pet.hasParasites),
                    parasiteTypes: pet.parasiteTypes || '',
                    wantsMedicatedBath: Boolean(pet.wantsMedicatedBath),
                    strategicDiscount: Number(strategicDiscount) || 0,
                    isRecurring: customer.type === 'RECORRENTE',
                    transportWeeklyFrequency: customer.type === 'RECORRENTE' ? (customer.transportDaysPerWeek || 1) : null,
                    transportDiscountPercent: getTransportDiscountRate() * 100,
                    metadata: {
                        ...(quote as any).metadata,
                        transportDays: customer.transportDays,
                        transportType: transportType,
                        transportStops: transportParadas.filter(p => p.active && p.address).map(p => p.address),
                        transportSnapshot: transportInfo ? {
                            ...transportInfo,
                            total: transportInfo.estimatedPrice || transportInfo.total // Ensure 'total' is present for editor
                        } : null
                    }
                }
            };

            console.log('[ManualQuoteModal] Enviando payload:', JSON.stringify(payload, null, 2));
            const res = await api.post('/quotes/manual', payload);
            toast.success('Orçamento criado com sucesso! Agora está em status CALCULADO para revisão.');
            setIsDirtyState(false);
            onSuccess(res.data);
            onClose();
        } catch (error: any) {
            console.error('Erro ao criar orçamento manual:', error);

            // Tratamento melhorado de erros
            let errorMessage = 'Erro ao criar orçamento';

            if (error.response?.data) {
                const errorData = error.response.data;
                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.details) {
                    errorMessage = JSON.stringify(errorData.details);
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
            setShowSummary(false);
        }
    };

    const getKnotItems = () => {
        if (!pet.hasKnots || pet.knotRegions.length === 0) return [];

        const KNOT_PRICES: Record<string, number> = {
            'orelhas': 7.50,
            'rostinho': 15.00,
            'pescoço': 15.00,
            'barriga': 12.50,
            'pata frontal esquerda': 7.50,
            'pata frontal direita': 7.50,
            'pata traseira esquerda': 7.50,
            'pata traseira direita': 7.50,
            'bumbum': 12.50,
            'rabo': 10.00
        };

        const patas = pet.knotRegions.filter(r => r.includes('pata'));
        const outrasRegioes = pet.knotRegions.filter(r => !r.includes('pata'));

        const items: any[] = [];
        if (patas.length > 0) {
            items.push({
                description: `Desembolo - Patas (${patas.length}x)`,
                quantity: patas.length,
                price: 7.50,
                isAutomatic: true
            });
        }

        outrasRegioes.forEach(region => {
            const price = KNOT_PRICES[region];
            if (price) {
                items.push({
                    description: `Desembolo - ${region.charAt(0).toUpperCase() + region.slice(1)}`,
                    quantity: 1,
                    price,
                    isAutomatic: true
                });
            }
        });

        return items;
    };

    const getMedicatedBathItem = () => {
        if (!pet.wantsMedicatedBath) return null;
        return {
            description: '💊 Banho Medicamentoso Antipulgas',
            quantity: 1,
            price: 45.00,
            isAutomatic: true
        };
    };

    if (!isOpen) return null;

    const getSpaDiscountRate = () => {
        if (customer.type === 'AVULSO') return 0;
        if (customer.recurrenceFrequency === 'MENSAL') return 0.05;
        if (customer.recurrenceFrequency === 'QUINZENAL') return 0.07;
        if (customer.recurrenceFrequency === 'SEMANAL') return 0.10;
        return 0;
    };

    const getTransportDiscountRate = () => {
        if (customer.type === 'AVULSO') return 0;

        // Regra de descontos para transporte recorrente baseada em dias por semana
        const days = customer.transportDaysPerWeek || 1;
        if (days >= 5) return 0.10; // 10% para 5-6 dias
        if (days >= 3) return 0.07; // 7% para 3-4 dias
        return 0.05; // 5% para 1-2 dias
    };

    const knotItems = getKnotItems();
    const medicatedBathItem = getMedicatedBathItem();
    const allItems = [...quote.items, ...knotItems, ...(medicatedBathItem ? [medicatedBathItem] : [])];

    const spaItems = allItems.filter(item =>
        !item.description?.toLowerCase().includes('transporte') &&
        !item.description?.includes('🔄') &&
        !item.description?.includes('📦') &&
        !item.description?.includes('🏠')
    );
    const spaSubtotal = spaItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const transportItems = allItems.filter(item =>
        item.description?.toLowerCase().includes('transporte') ||
        item.description?.includes('🔄') ||
        item.description?.includes('📦') ||
        item.description?.includes('🏠')
    );
    const transportSubtotal = transportItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const totalBase = allItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const spaDiscountRate = getSpaDiscountRate();
    const transportDiscountRate = getTransportDiscountRate();

    const serviceDiscount = customer.type === 'RECORRENTE' ? allItems.reduce((acc, item) => {
        const isTransport = item.description?.toLowerCase().includes('transporte') ||
            item.description?.includes('🔄') ||
            item.description?.includes('📦') ||
            item.description?.includes('🏠');

        if (isTransport) {
            return acc + (item.price * item.quantity * transportDiscountRate);
        } else if ((item.serviceId || item.isAutomatic) && !item.productId) {
            return acc + (item.price * item.quantity * spaDiscountRate);
        }
        return acc;
    }, 0) : 0;

    const productDiscount = customer.type === 'AVULSO' ? allItems.reduce((acc, item) => {
        if (Number(strategicDiscount) > 0) {
            return acc + (item.price * item.quantity * (Number(strategicDiscount) / 100));
        }
        return acc;
    }, 0) : 0;

    // Subtotal de transporte para exibição (reserved for future display)
    void allItems.filter(item =>
        item.description?.toLowerCase().includes('transporte') || item.description?.includes('🔄')
    ).reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const totalDiscount = serviceDiscount + productDiscount;
    const total = totalBase - totalDiscount;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handleClose}
                                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20 dark:border-gray-700"
                            >
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Novo Orçamento Manual</h2>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                                                Crie um orçamento e cadastre cliente/pet simultaneamente • 📅 Gerado em: <span className="text-primary font-bold uppercase">{generationTime}</span>
                                            </p>
                                        </div>
                                        {/* TYPE BADGE */}
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border shadow-sm ${quote.type === 'TRANSPORTE' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            quote.type === 'SPA_TRANSPORTE' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                'bg-pink-50 text-pink-600 border-pink-200'
                                            }`}>
                                            {quote.type?.replace('_', ' + ')}
                                        </div>
                                    </div>
                                    <button onClick={handleClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                                    </button>
                                </div>

                                {selectionStep ? (
                                    <div className="flex-1 overflow-y-auto p-10 bg-gray-50/30 dark:bg-gray-900/50">
                                        <div className="flex flex-col items-center text-center mb-12">
                                            <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary mb-6">
                                                <Scissors size={40} className="animate-pulse" />
                                            </div>
                                            <h3 className="text-3xl font-bold text-secondary dark:text-white uppercase tracking-tight mb-3">Escolha o Tipo de Orçamento</h3>
                                            <p className="text-gray-500 font-medium max-w-md">Selecione o fluxo desejado para que o sistema prepare as ferramentas e automações ideais.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                {
                                                    id: 'SPA',
                                                    title: 'SPA & Estética',
                                                    desc: 'Banhos, tosas e tratamentos. Sem logística de transporte.',
                                                    icon: Droplets,
                                                    color: 'blue',
                                                    gradient: 'from-blue-500/20 to-cyan-500/20'
                                                },
                                                {
                                                    id: 'TRANSPORTE',
                                                    title: 'Apenas Transporte',
                                                    desc: 'Logística de leva e traz. Ideal para traslados avulsos.',
                                                    icon: Truck,
                                                    color: 'orange',
                                                    gradient: 'from-orange-500/20 to-yellow-500/20'
                                                },
                                                {
                                                    id: 'SPA_TRANSPORTE',
                                                    title: 'SPA + Transporte',
                                                    desc: 'Fluxo completo. Estética com retirada e entrega domiciliar.',
                                                    icon: RefreshCcw,
                                                    color: 'purple',
                                                    gradient: 'from-purple-500/20 to-pink-500/20'
                                                }
                                            ].map(opt => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setQuote({ ...quote, type: opt.id as any });
                                                        setSelectionStep(false);
                                                    }}
                                                    className="group relative flex flex-col p-8 bg-white dark:bg-gray-800 rounded-[40px] border-2 border-transparent hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all text-left overflow-hidden"
                                                >
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${opt.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                    <div className="relative z-10">
                                                        <div className={`w-14 h-14 rounded-2xl bg-${opt.color}-500/10 text-${opt.color}-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                                            <opt.icon size={28} />
                                                        </div>
                                                        <h4 className="text-xl font-bold text-secondary dark:text-white uppercase tracking-tight mb-2">{opt.title}</h4>
                                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 leading-relaxed">{opt.desc}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-10 bg-gray-50/30 dark:bg-gray-900/50">
                                        {/* Botão Voltar para Seleção */}
                                        <div className="flex justify-start">
                                            <button
                                                type="button"
                                                onClick={() => setSelectionStep(true)}
                                                className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors"
                                            >
                                                <RefreshCcw size={12} /> Alterar Tipo de Orçamento ({quote.type})
                                            </button>
                                        </div>
                                        {/* 1. Cliente */}
                                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-xl shadow-blue-500/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                                                <div className="w-12 h-12 rounded-[20px] bg-blue-500 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">1</div>
                                                Dados do Cliente
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                <div className="md:col-span-8 relative">
                                                    <div className="flex justify-between items-center mb-2 ml-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nome Completo *</label>
                                                        {searchMode === 'EXISTING' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setCustomer({
                                                                        id: '',
                                                                        name: '',
                                                                        email: '',
                                                                        phone: '',
                                                                        address: '',
                                                                        type: 'AVULSO',
                                                                        recurrenceFrequency: 'MENSAL',
                                                                        transportDaysPerWeek: 1,
                                                                        transportDays: []
                                                                    });
                                                                    setSearchMode('NEW');
                                                                }}
                                                                className="text-[9px] font-bold text-blue-500 uppercase hover:underline"
                                                            >
                                                                Limpar / Novo
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            required
                                                            type="text"
                                                            value={customer.name}
                                                            onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                                            onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                                                            onDoubleClick={() => {
                                                                if (!customer.name.trim()) setShowFullCustomerSearch(true);
                                                            }}
                                                            className={`w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 ${searchMode === 'EXISTING' ? 'ring-2 ring-blue-500/20' : ''}`}
                                                            placeholder="Ex: João Silva (Dica: Clique 2x p/ buscar)"
                                                        />
                                                        {searchMode === 'EXISTING' && <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500" />}
                                                    </div>

                                                    {/* Suggestions Popover */}
                                                    <AnimatePresence>
                                                        {showSuggestions && searchResults.length > 0 && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: 10 }}
                                                                className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto"
                                                            >
                                                                <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                                                                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Clientes Encontrados:</span>
                                                                </div>
                                                                {searchResults.map((res: any) => (
                                                                    <button
                                                                        key={res.id}
                                                                        type="button"
                                                                        onClick={() => handleSelectCustomer(res)}
                                                                        className="w-full px-5 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between border-b border-gray-50 dark:border-gray-700 last:border-none"
                                                                    >
                                                                        <div>
                                                                            <p className="text-sm font-bold text-secondary dark:text-white">{res.name}</p>
                                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{res.phone || res.user?.email}</p>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[8px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Existente</span>
                                                                            <Plus size={14} className="text-blue-500" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                                <div className="md:col-span-4">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo de Orçamento</label>
                                                    <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCustomer({ ...customer, type: 'AVULSO' })}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${customer.type === 'AVULSO' ? 'bg-white dark:bg-gray-600 text-secondary dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                                                        >
                                                            Avulso
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCustomer({ ...customer, type: 'RECORRENTE' })}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${customer.type === 'RECORRENTE' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400'}`}
                                                        >
                                                            Recorrente
                                                        </button>
                                                    </div>
                                                </div>

                                                {customer.type === 'RECORRENTE' && (
                                                    <div className="md:col-span-12 space-y-4 animate-in slide-in-from-top-2">
                                                        {/* Frequência SPA - SOMENTE SE NÃO FOR TRANSPORTE PURO */}
                                                        {quote.type !== 'TRANSPORTE' && (
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 ml-1">Frequência de Banhos (SPA)</label>
                                                                <div className="grid grid-cols-3 gap-3 p-4 bg-purple-50 rounded-[32px] border border-purple-100">
                                                                    {[
                                                                        { id: 'MENSAL', label: 'Mensal', desc: '1 banho/mês', discount: '5% SPA' },
                                                                        { id: 'QUINZENAL', label: 'Quinzenal', desc: '2 banhos/mês', discount: '7% SPA' },
                                                                        { id: 'SEMANAL', label: 'Semanal', desc: '4+ banhos/mês', discount: '10% SPA' },
                                                                    ].map(freq => (
                                                                        <button
                                                                            key={freq.id}
                                                                            type="button"
                                                                            onClick={() => setCustomer({ ...customer, recurrenceFrequency: freq.id as any })}
                                                                            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${customer.recurrenceFrequency === freq.id ? 'bg-purple-600 text-white shadow-xl scale-105' : 'bg-white text-purple-400 hover:bg-purple-100'}`}
                                                                        >
                                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{freq.label}</span>
                                                                            <span className="text-[8px] font-bold opacity-70">{freq.desc}</span>
                                                                            <div className={`mt-1 px-2 py-0.5 rounded-lg font-bold text-[9px] ${customer.recurrenceFrequency === freq.id ? 'bg-white/20' : 'bg-purple-100 text-purple-600'}`}>
                                                                                {freq.discount}
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Frequência Transporte (Logística) - Exibido apenas se envolver transporte */}
                                                        {(quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') && (
                                                            <div className="pt-4 border-t border-purple-100/50">
                                                                <label className="block text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3 ml-1">Frequência de Transporte (Recorrente)</label>

                                                                <div className="space-y-4 bg-orange-50/50 p-6 rounded-[32px] border border-orange-100">
                                                                    {/* Dias por Semana */}
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-2 ml-1">Quantos dias na semana?</label>
                                                                        <div className="flex gap-2">
                                                                            {[1, 2, 3, 4, 5].map(num => (
                                                                                <button
                                                                                    key={num}
                                                                                    type="button"
                                                                                    onClick={() => setCustomer({ ...customer, transportDaysPerWeek: num })}
                                                                                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${customer.transportDaysPerWeek === num ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-orange-400 hover:bg-orange-100'}`}
                                                                                >
                                                                                    {num}x
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Quais Dias */}
                                                                    <div>
                                                                        <label className="block text-[9px] font-bold text-orange-400 uppercase tracking-widest mb-2 ml-1">Quais dias da semana?</label>
                                                                        <div className="grid grid-cols-7 gap-1">
                                                                            {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map(day => (
                                                                                <button
                                                                                    key={day}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const updated = customer.transportDays.includes(day)
                                                                                            ? customer.transportDays.filter(d => d !== day)
                                                                                            : [...customer.transportDays, day];
                                                                                        setCustomer({ ...customer, transportDays: updated });
                                                                                    }}
                                                                                    className={`py-2 rounded-lg text-[10px] font-bold transition-all ${customer.transportDays.includes(day) ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-orange-300 hover:bg-orange-100'}`}
                                                                                >
                                                                                    {day}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Resumo Desconto */}
                                                                    <div className="mt-2 p-3 bg-white/60 rounded-2xl flex items-center justify-between border border-orange-200/50">
                                                                        <span className="text-[10px] font-bold text-orange-800 uppercase tracking-tight">Desconto Logística:</span>
                                                                        <span className="text-sm font-bold text-orange-600">{(getTransportDiscountRate() * 100).toFixed(0)}% OFF</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="md:col-span-6">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email *</label>
                                                    <input
                                                        required
                                                        type="email"
                                                        value={customer.email}
                                                        onChange={e => setCustomer({ ...customer, email: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                        placeholder="joao@email.com"
                                                    />
                                                </div>
                                                <div className="md:col-span-6 relative">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={customer.phone}
                                                            onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                                            onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                                                            className={`w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 ${searchMode === 'EXISTING' ? 'ring-2 ring-blue-500/20' : ''}`}
                                                            placeholder="(11) 99999-9999"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-12">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Endereço (Padrão para Transporte)</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                                        <input
                                                            type="text"
                                                            value={customer.address}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setCustomer({ ...customer, address: val });
                                                                if (!quote.transportOrigin) {
                                                                    setQuote({ ...quote, transportOrigin: val });
                                                                }
                                                            }}
                                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl pl-14 pr-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                            placeholder="Rua, Número, Bairro, Cidade - CEP"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-xl shadow-purple-500/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                                                    <div className="w-12 h-12 rounded-[20px] bg-purple-500 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/20 ring-4 ring-purple-500/10">2</div>
                                                    Dados do Pet
                                                </h3>
                                                {customerPets.length > 0 && (
                                                    <div className="ml-auto flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Selecionar:</span>
                                                        <select
                                                            onChange={(e) => {
                                                                const p = customerPets.find(cp => cp.id === e.target.value);
                                                                if (p) {
                                                                    setPet({
                                                                        id: p.id,
                                                                        name: p.name,
                                                                        species: p.species,
                                                                        breed: p.breed || '',
                                                                        weight: p.weight?.toString() || '',
                                                                        coatType: p.coatType || 'CURTO',
                                                                        temperament: p.temperament || 'DOCIL',
                                                                        age: p.age || '',
                                                                        observations: p.observations || '',
                                                                        hasKnots: p.hasKnots || false,
                                                                        knotRegions: p.knotRegions ? (typeof p.knotRegions === 'string' ? p.knotRegions.split(',') : p.knotRegions) : [],
                                                                        hasParasites: p.hasParasites || false,
                                                                        hasMattedFur: p.hasMattedFur || false,
                                                                        healthIssues: p.healthIssues || '',
                                                                        allergies: p.allergies || '',
                                                                        parasiteTypes: p.parasiteTypes || '',
                                                                        parasiteComments: p.parasiteComments || '',
                                                                        wantsMedicatedBath: false
                                                                    });
                                                                } else {
                                                                    // Reset to new pet
                                                                    setPet({
                                                                        id: '',
                                                                        name: '',
                                                                        species: 'Canino',
                                                                        breed: '',
                                                                        weight: '',
                                                                        coatType: 'CURTO',
                                                                        temperament: 'DOCIL',
                                                                        age: '',
                                                                        observations: '',
                                                                        hasKnots: false,
                                                                        knotRegions: [],
                                                                        hasParasites: false,
                                                                        hasMattedFur: false,
                                                                        healthIssues: '',
                                                                        allergies: '',
                                                                        parasiteTypes: '',
                                                                        parasiteComments: '',
                                                                        wantsMedicatedBath: false
                                                                    });
                                                                }
                                                            }}
                                                            className="bg-gray-100 border-none rounded-xl px-3 py-1 text-xs font-bold text-secondary outline-none focus:ring-2 focus:ring-purple-500/20"
                                                            value={pet.id}
                                                        >
                                                            <option value="">+ Novo Pet</option>
                                                            {customerPets.map(p => (
                                                                <option key={p.id} value={p.id}>{p.name} ({p.breed || 'SRD'})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Pet</label>
                                                    <input
                                                        type="text"
                                                        value={pet.name}
                                                        onChange={e => setPet({ ...pet, name: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                        placeholder="Ex: Rex"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Espécie</label>
                                                    <select
                                                        value={pet.species}
                                                        onChange={e => setPet({ ...pet, species: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                    >
                                                        <option value="Canino">🐕 Cachorro</option>
                                                        <option value="Felino">🐈 Gato</option>
                                                        <option value="Outro">🐾 Outro</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Raça</label>
                                                    <input
                                                        type="text"
                                                        value={pet.breed}
                                                        onChange={e => setPet({ ...pet, breed: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                        placeholder="Ex: Poodle"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Peso (kg)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={pet.weight}
                                                        onChange={e => setPet({ ...pet, weight: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                        placeholder="0.0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Pelagem</label>
                                                    <select
                                                        value={pet.coatType}
                                                        onChange={e => setPet({ ...pet, coatType: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                    >
                                                        <option value="CURTO">Curto</option>
                                                        <option value="MEDIO">Médio</option>
                                                        <option value="LONGO">Longo</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Observações de Saúde/Comportamento</label>
                                                    <input
                                                        type="text"
                                                        value={pet.observations}
                                                        onChange={e => setPet({ ...pet, observations: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                        placeholder="Ex: Alérgico a perfume, morde se tocar na calda..."
                                                    />
                                                </div>
                                            </div>

                                            {quote.type !== 'TRANSPORTE' && (
                                                <>
                                                    {/* Características Avançadas (Nós, Parasitas) */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                                                        {/* Nó e Desembolo */}
                                                        <div className={`p-5 rounded-3xl border-2 transition-all ${pet.hasKnots ? 'border-orange-200 bg-orange-50/30' : 'border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30'}`}>
                                                            <label className="flex items-center justify-between cursor-pointer mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-2 rounded-xl ${pet.hasKnots ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                                        <Scissors size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-sm font-bold text-secondary dark:text-white uppercase tracking-tight">O Pet possui nós?</span>
                                                                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Adiciona itens de desembolo ao total</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPet({ ...pet, hasKnots: !pet.hasKnots })}
                                                                    className={`w-12 h-7 rounded-full relative transition-all ${pet.hasKnots ? 'bg-orange-500 shadow-lg shadow-orange-500/30' : 'bg-gray-200'}`}
                                                                >
                                                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${pet.hasKnots ? 'left-6' : 'left-1'}`} />
                                                                </button>
                                                            </label>

                                                            {pet.hasKnots && (
                                                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                                                    <p className="text-[9px] font-bold text-orange-600 uppercase tracking-widest ml-1">Selecione as Regiões afetadas:</p>
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                        {[
                                                                            'Orelhas', 'Rostinho', 'Pescoço', 'Barriga',
                                                                            'Pata Frontal Esquerda', 'Pata Frontal Direita',
                                                                            'Pata Traseira Esquerda', 'Pata Traseira Direita',
                                                                            'Bumbum', 'Rabo'
                                                                        ].map(region => (
                                                                            <button
                                                                                key={region}
                                                                                type="button"
                                                                                onClick={() => toggleKnotRegion(region.toLowerCase())}
                                                                                className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-tight transition-all border ${pet.knotRegions.includes(region.toLowerCase()) ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-orange-100 text-orange-400 hover:bg-orange-50'}`}
                                                                            >
                                                                                {region}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Parasitas e Banho Medicamentoso */}
                                                        <div className="space-y-4">
                                                            <div className={`p-5 rounded-3xl border-2 transition-all ${pet.hasParasites ? 'border-red-200 bg-red-50/30' : 'border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30'}`}>
                                                                <label className="flex items-center justify-between cursor-pointer">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-xl ${pet.hasParasites ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                                            <Bug size={18} />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-sm font-bold text-secondary dark:text-white uppercase tracking-tight">Presença de Parasitas?</span>
                                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Pulgas ou carrapatos identificados</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPet({ ...pet, hasParasites: !pet.hasParasites })}
                                                                        className={`w-12 h-7 rounded-full relative transition-all ${pet.hasParasites ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-gray-200'}`}
                                                                    >
                                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${pet.hasParasites ? 'left-6' : 'left-1'}`} />
                                                                    </button>
                                                                </label>

                                                                {pet.hasParasites && (
                                                                    <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2">
                                                                        {['PULGA', 'CARRAPATO', 'AMBOS'].map(type => (
                                                                            <button
                                                                                key={type}
                                                                                type="button"
                                                                                onClick={() => setPet({ ...pet, parasiteTypes: type })}
                                                                                className={`flex-1 py-2 rounded-xl text-[9px] font-bold uppercase border transition-all ${pet.parasiteTypes === type ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-red-100 text-red-300 hover:bg-red-50'}`}
                                                                            >
                                                                                {type}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className={`p-5 rounded-3xl border-2 transition-all ${pet.wantsMedicatedBath ? 'border-blue-200 bg-blue-50/30' : 'border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30'}`}>
                                                                <label className="flex items-center justify-between cursor-pointer">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-xl ${pet.wantsMedicatedBath ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                                            <Droplets size={18} />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-sm font-bold text-secondary dark:text-white uppercase tracking-tight">Banho Medicamentoso?</span>
                                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">Adiciona (+ R$ 45,00) ao total</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPet({ ...pet, wantsMedicatedBath: !pet.wantsMedicatedBath })}
                                                                        className={`w-12 h-7 rounded-full relative transition-all ${pet.wantsMedicatedBath ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : 'bg-gray-200'}`}
                                                                    >
                                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${pet.wantsMedicatedBath ? 'left-6' : 'left-1'}`} />
                                                                    </button>
                                                                </label>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </section>

                                        {/* 3. Logística de Transporte */}
                                        {quote.type !== 'SPA' && (
                                            <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-xl shadow-orange-500/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                                                        <div className="w-12 h-12 rounded-[20px] bg-orange-500 text-white flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 ring-4 ring-orange-500/10">3</div>
                                                        Logística (Transporte)
                                                    </h3>
                                                    {quote.type !== 'TRANSPORTE' && (
                                                        <div className="px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-orange-600 uppercase">Incluir Transporte?</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setQuote({ ...quote, type: quote.type === 'SPA_TRANSPORTE' ? 'SPA' : 'SPA_TRANSPORTE' })}
                                                                className={`w-10 h-6 rounded-full relative transition-all ${quote.type.includes('TRANSPORTE') ? 'bg-orange-500' : 'bg-gray-200'}`}
                                                            >
                                                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${quote.type.includes('TRANSPORTE') ? 'left-4.5' : 'left-0.5'}`} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {quote.type.includes('TRANSPORTE') && (
                                                    <div className="space-y-6 animate-in fade-in duration-500">
                                                        {/* 1. TIPO DE TRANSPORTE (PRIMEIRO DE TUDO) */}
                                                        <div className="space-y-4 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/10 rounded-[32px] border-2 border-orange-200 dark:border-orange-800/50 shadow-lg shadow-orange-500/10">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-lg shadow-orange-500/30">1</div>
                                                                <label className="text-sm font-bold text-orange-700 dark:text-orange-300 uppercase tracking-widest">Tipo de Transporte</label>
                                                                <span className="text-[9px] font-bold text-orange-400 dark:text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-full">Obrigatório</span>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-3">
                                                                {[
                                                                    { value: 'ROUND_TRIP', label: 'Leva & Traz', icon: '🔄', desc: 'Busca e devolve' },
                                                                    { value: 'PICK_UP', label: 'Só Leva', icon: '📦', desc: 'Apenas coleta' },
                                                                    { value: 'DROP_OFF', label: 'Só Traz', icon: '🏠', desc: 'Apenas entrega' }
                                                                ].map(type => (
                                                                    <button
                                                                        key={type.value}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const prevType = transportType;
                                                                            setTransportType(type.value as any);
                                                                            // RESET RULES: Limpar estado inválido ao trocar tipo
                                                                            if (type.value === 'PICK_UP') {
                                                                                // Só Leva: limpar horaTraz e legs de retorno
                                                                                setQuote(q => ({ ...q, transportTrazAt: '' }));
                                                                                if (transportInfo?.legs) {
                                                                                    setTransportInfo((ti: any) => ({
                                                                                        ...ti,
                                                                                        legs: {
                                                                                            ...ti.legs,
                                                                                            traz: { ...ti.legs.traz, active: false },
                                                                                            retorno: { ...ti.legs.retorno, active: false }
                                                                                        }
                                                                                    }));
                                                                                }
                                                                            } else if (type.value === 'DROP_OFF') {
                                                                                // Só Traz: limpar horaLeva e legs de ida
                                                                                setQuote(q => ({ ...q, transportLevaAt: '' }));
                                                                                if (transportInfo?.legs) {
                                                                                    setTransportInfo((ti: any) => ({
                                                                                        ...ti,
                                                                                        legs: {
                                                                                            ...ti.legs,
                                                                                            largada: { ...ti.legs.largada, active: false },
                                                                                            leva: { ...ti.legs.leva, active: false }
                                                                                        }
                                                                                    }));
                                                                                }
                                                                            } else if (type.value === 'ROUND_TRIP') {
                                                                                // Leva & Traz: reativar todas as legs
                                                                                if (transportInfo?.legs) {
                                                                                    setTransportInfo((ti: any) => ({
                                                                                        ...ti,
                                                                                        legs: {
                                                                                            largada: { ...ti.legs.largada, active: true },
                                                                                            leva: { ...ti.legs.leva, active: true },
                                                                                            traz: { ...ti.legs.traz, active: true },
                                                                                            retorno: { ...ti.legs.retorno, active: true }
                                                                                        }
                                                                                    }));
                                                                                }
                                                                            }
                                                                        }}
                                                                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${transportType === type.value
                                                                            ? 'bg-orange-500 text-white border-orange-600 shadow-xl shadow-orange-500/30 scale-105'
                                                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                                                            }`}
                                                                    >
                                                                        <span className="text-2xl">{type.icon}</span>
                                                                        <span className="text-xs font-bold uppercase tracking-wider">{type.label}</span>
                                                                        <span className={`text-[9px] font-medium ${transportType === type.value ? 'text-white/80' : 'text-gray-400'}`}>{type.desc}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* 2. CAMPOS DE ROTA (SÓ APARECEM APÓS ESCOLHER TIPO) */}
                                                        {transportType ? (
                                                            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div className="space-y-4">
                                                                        {/* Origem (sempre visível) */}
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                                                {transportType === 'DROP_OFF' ? 'Origem (Embarque)' : 'Origem (Coleta)'}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={quote.transportOrigin || customer.address}
                                                                                onChange={e => setQuote({ ...quote, transportOrigin: e.target.value })}
                                                                                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                                                placeholder="Endereço de origem..."
                                                                            />
                                                                        </div>

                                                                        {/* Destino (Apenas para PICK_UP, DROP_OFF, combos) */}
                                                                        <div>
                                                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                                                                Destino (Entrega)
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={quote.transportDestination || ''}
                                                                                onChange={e => setQuote({ ...quote, transportDestination: e.target.value })}
                                                                                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                                                placeholder="Endereço de destino..."
                                                                            />
                                                                        </div>

                                                                        {/* PARADAS EXTRAS (Disponível para todos os tipos) */}
                                                                        <div className="p-4 bg-gradient-to-br from-violet-50/50 to-purple-50/30 dark:from-violet-900/10 dark:to-purple-900/10 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 animate-in fade-in slide-in-from-bottom">
                                                                            <div className="flex items-center justify-between mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-xl">📍</span>
                                                                                    <span className="text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-widest">Paradas Extras</span>
                                                                                    <span className="text-[8px] font-bold text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-full">Opcional</span>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setTransportParadas([...transportParadas, { address: '', km: 0, min: 5, active: true }])}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-lg shadow-violet-500/20 hover:bg-violet-600 transition-all"
                                                                                >
                                                                                    <Plus size={12} /> Adicionar Parada
                                                                                </button>
                                                                            </div>

                                                                            {transportParadas.length === 0 ? (
                                                                                <p className="text-[9px] font-medium text-violet-400 dark:text-violet-500 text-center py-3">
                                                                                    Nenhuma parada extra. Clique em "Adicionar Parada" para incluir paradas intermediárias na rota.
                                                                                </p>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    {transportParadas.map((parada, index) => (
                                                                                        <div
                                                                                            key={index}
                                                                                            className={`p-3 rounded-xl border transition-all ${parada.active
                                                                                                ? 'bg-white dark:bg-gray-800 border-violet-200 dark:border-violet-800/50'
                                                                                                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700 opacity-60'
                                                                                                }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-3">
                                                                                                {/* Toggle */}
                                                                                                {/* Toggle (Oculto até calcular) */}
                                                                                                {transportInfo && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => {
                                                                                                            const updated = [...transportParadas];
                                                                                                            updated[index].active = !updated[index].active;
                                                                                                            setTransportParadas(updated);
                                                                                                            if (transportInfo) recalculateTransport(transportInfo);
                                                                                                        }}
                                                                                                        className={`w-8 h-4 rounded-full transition-all relative flex-shrink-0 ${parada.active ? 'bg-violet-500' : 'bg-gray-300'}`}
                                                                                                    >
                                                                                                        <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${parada.active ? 'left-4' : 'left-0.5'}`} />
                                                                                                    </button>
                                                                                                )}

                                                                                                {/* Número da parada */}
                                                                                                <span className="w-5 h-5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                                                                                                    {index + 1}
                                                                                                </span>

                                                                                                {/* Input de endereço */}
                                                                                                <input
                                                                                                    type="text"
                                                                                                    value={parada.address}
                                                                                                    onChange={e => {
                                                                                                        const updated = [...transportParadas];
                                                                                                        updated[index].address = e.target.value;
                                                                                                        setTransportParadas(updated);
                                                                                                    }}
                                                                                                    disabled={!parada.active && transportInfo}
                                                                                                    placeholder="Digite o endereço da parada..."
                                                                                                    className="flex-1 bg-transparent border-none text-sm font-bold text-secondary dark:text-white outline-none placeholder:text-gray-300 min-w-0"
                                                                                                />

                                                                                                {transportInfo ? (
                                                                                                    <>
                                                                                                        {/* KM */}
                                                                                                        <div className="w-14">
                                                                                                            <label className="text-[7px] font-bold text-gray-400 uppercase block mb-0.5 text-center">KM</label>
                                                                                                            <input
                                                                                                                type="number"
                                                                                                                step="0.1"
                                                                                                                value={parada.km}
                                                                                                                onChange={e => {
                                                                                                                    const updated = [...transportParadas];
                                                                                                                    updated[index].km = parseFloat(e.target.value) || 0;
                                                                                                                    setTransportParadas(updated);
                                                                                                                    if (transportInfo) recalculateTransport(transportInfo);
                                                                                                                }}
                                                                                                                disabled={!parada.active}
                                                                                                                className="w-full text-[10px] font-bold text-secondary dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1 outline-none border border-gray-100 dark:border-gray-600 text-center"
                                                                                                            />
                                                                                                        </div>

                                                                                                        {/* MIN */}
                                                                                                        <div className="w-14">
                                                                                                            <label className="text-[7px] font-bold text-gray-400 uppercase block mb-0.5 text-center">MIN</label>
                                                                                                            <input
                                                                                                                type="number"
                                                                                                                value={parada.min}
                                                                                                                onChange={e => {
                                                                                                                    const updated = [...transportParadas];
                                                                                                                    updated[index].min = parseFloat(e.target.value) || 0;
                                                                                                                    setTransportParadas(updated);
                                                                                                                    if (transportInfo) recalculateTransport(transportInfo);
                                                                                                                }}
                                                                                                                disabled={!parada.active}
                                                                                                                className="w-full text-[10px] font-bold text-secondary dark:text-white bg-gray-50 dark:bg-gray-700 rounded-lg px-2 py-1 outline-none border border-gray-100 dark:border-gray-600 text-center"
                                                                                                            />
                                                                                                        </div>
                                                                                                    </>
                                                                                                ) : null}

                                                                                                {/* Remove */}
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => {
                                                                                                        const updated = transportParadas.filter((_, i) => i !== index);
                                                                                                        setTransportParadas(updated);
                                                                                                        if (transportInfo) recalculateTransport(transportInfo);
                                                                                                    }}
                                                                                                    className="w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex-shrink-0"
                                                                                                >
                                                                                                    <X size={12} />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}

                                                                                    {/* Resumo das paradas */}
                                                                                    {transportParadas.filter(p => p.active).length > 0 && (
                                                                                        <div className="mt-2 p-2 bg-violet-100/50 dark:bg-violet-900/20 rounded-xl text-center">
                                                                                            <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">
                                                                                                {transportParadas.filter(p => p.active).length} parada(s) ativa(s) •
                                                                                                Total: {transportParadas.filter(p => p.active).reduce((acc, p) => acc + Number(p.km), 0).toFixed(1)} km,
                                                                                                {transportParadas.filter(p => p.active).reduce((acc, p) => acc + Number(p.min), 0)} min
                                                                                            </span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Retorno (SOMENTE ROUND_TRIP) */}
                                                                        {transportType === 'ROUND_TRIP' && (
                                                                            <div className="p-5 bg-orange-50/30 rounded-[32px] border border-orange-100/50 animate-in fade-in slide-in-from-left">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <span className="text-[10px] font-bold text-orange-700 uppercase tracking-widest">Retorno no mesmo endereço?</span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setQuote({ ...quote, isReturnSame: !quote.isReturnSame })}
                                                                                        className={`w-12 h-7 rounded-full transition-all relative ${quote.isReturnSame ? 'bg-orange-500 shadow-md shadow-orange-500/20' : 'bg-gray-200'}`}
                                                                                    >
                                                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${quote.isReturnSame ? 'left-6' : 'left-1'}`} />
                                                                                    </button>
                                                                                </div>
                                                                                {!quote.isReturnSame && (
                                                                                    <div className="mt-4 animate-in slide-in-from-top-2">
                                                                                        <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 block ml-1">Destino do Retorno</label>
                                                                                        <input
                                                                                            type="text"
                                                                                            value={quote.transportReturnAddress}
                                                                                            onChange={e => setQuote({ ...quote, transportReturnAddress: e.target.value })}
                                                                                            placeholder="Endereço final..."
                                                                                            className="w-full bg-white dark:bg-gray-700 border-none rounded-xl px-5 py-4 text-xs font-bold text-secondary dark:text-white shadow-sm"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-6">
                                                                        {/* 3. PERÍODO E HORÁRIOS (CONDICIONAIS AO TIPO) */}
                                                                        <div className="flex flex-col gap-4">
                                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Período Preferencial</label>
                                                                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                                                                {['MANHA', 'TARDE', 'NOITE'].map((p) => (
                                                                                    <button
                                                                                        key={p}
                                                                                        type="button"
                                                                                        onClick={() => setQuote({ ...quote, transportPeriod: p as any })}
                                                                                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${quote.transportPeriod === p ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-secondary'}`}
                                                                                    >
                                                                                        {p === 'MANHA' ? 'Manhã' : p === 'TARDE' ? 'Tarde' : 'Noite'}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>

                                                                        {/* HORÁRIOS CONDICIONAIS */}
                                                                        <div className="grid grid-cols-1 gap-4">
                                                                            {/* Horário LEVA - só para PICK_UP e ROUND_TRIP */}
                                                                            {(transportType === 'PICK_UP' || transportType === 'ROUND_TRIP') && (
                                                                                <div className="animate-in fade-in slide-in-from-right">
                                                                                    <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
                                                                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                                                                        Horário Leva (Busca)
                                                                                    </label>
                                                                                    <input
                                                                                        type="datetime-local"
                                                                                        value={quote.transportLevaAt}
                                                                                        onChange={e => setQuote({ ...quote, transportLevaAt: e.target.value })}
                                                                                        className="w-full bg-orange-50/50 border-2 border-orange-200 dark:border-orange-800 rounded-2xl px-5 py-4 text-sm font-medium text-secondary outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            {/* Horário TRAZ - só para DROP_OFF e ROUND_TRIP */}
                                                                            {(transportType === 'DROP_OFF' || transportType === 'ROUND_TRIP') && (
                                                                                <div className="animate-in fade-in slide-in-from-right">
                                                                                    <label className="text-[10px] font-bold text-teal-500 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
                                                                                        <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                                                                                        Horário Traz (Entrega)
                                                                                    </label>
                                                                                    <input
                                                                                        type="datetime-local"
                                                                                        value={quote.transportTrazAt}
                                                                                        onChange={e => setQuote({ ...quote, transportTrazAt: e.target.value })}
                                                                                        className="w-full bg-teal-50/50 border-2 border-teal-200 dark:border-teal-800 rounded-2xl px-5 py-4 text-sm font-medium text-secondary outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* 4. QTD PETS */}
                                                                        <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-[32px] border border-gray-100 dark:border-gray-600">
                                                                            <span className="text-secondary dark:text-white font-bold text-[10px] uppercase tracking-widest ml-1">Qtd. de Pets</span>
                                                                            <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setQuote({ ...quote, petQuantity: Math.max(1, quote.petQuantity - 1) })}
                                                                                    className="p-1 text-gray-400 hover:text-secondary"
                                                                                >
                                                                                    <Minus size={16} />
                                                                                </button>
                                                                                <span className="font-bold text-secondary dark:text-white min-w-[20px] text-center">{quote.petQuantity}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setQuote({ ...quote, petQuantity: quote.petQuantity + 1 })}
                                                                                    className="p-1 text-gray-400 hover:text-secondary dark:hover:text-white"
                                                                                >
                                                                                    <Plus size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* 5. CÁLCULO INTELIGENTE */}
                                                                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-6 overflow-hidden relative">
                                                                    <div className="relative z-10">
                                                                        <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-2 mb-1"><RefreshCcw size={14} /> Cálculo Inteligente</h4>
                                                                        <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 max-w-[300px]">Cálculo automático baseado na distância entre a coleta e a 7Pet via Google Maps.</p>
                                                                        {transportInfo && transportInfo.legs && (
                                                                            <div className="mt-4 space-y-4 animate-in slide-in-from-left">
                                                                                {/* Grade de Pernadas Detalhada (filtrada por tipo) */}
                                                                                <div className="space-y-3">
                                                                                    {[
                                                                                        { id: 'largada', label: '🚀 Largada (Loja -> Coleta)', color: 'bg-blue-50 text-blue-600', showMin: false, showFor: ['PICK_UP', 'ROUND_TRIP'] },
                                                                                        { id: 'leva', label: '📦 Leva (Coleta -> Loja)', color: 'bg-green-50 text-green-600', showMin: true, showFor: ['PICK_UP', 'ROUND_TRIP'] },
                                                                                        { id: 'traz', label: '🏠 Traz (Loja -> Entrega)', color: 'bg-purple-50 text-purple-600', showMin: true, showFor: ['DROP_OFF', 'ROUND_TRIP'] },
                                                                                        { id: 'retorno', label: '🔄 Retorno (Entrega -> Loja)', color: 'bg-orange-50 text-orange-600', showMin: false, showFor: ['DROP_OFF', 'ROUND_TRIP'] }
                                                                                    ].filter(leg => leg.showFor.includes(transportType)).map(leg => (
                                                                                        <div key={leg.id} className={`p-3 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4 transition-all ${transportInfo.legs[leg.id].active ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700 opacity-60'}`}>
                                                                                            {/* Toggle para ativar/desativar pernada */}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const next = {
                                                                                                        ...transportInfo,
                                                                                                        legs: {
                                                                                                            ...transportInfo.legs,
                                                                                                            [leg.id]: {
                                                                                                                ...transportInfo.legs[leg.id],
                                                                                                                active: !transportInfo.legs[leg.id].active
                                                                                                            }
                                                                                                        }
                                                                                                    };
                                                                                                    setTransportInfo(next);
                                                                                                    recalculateTransport(next);
                                                                                                }}
                                                                                                className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${transportInfo.legs[leg.id].active ? 'bg-green-500' : 'bg-gray-300'}`}
                                                                                            >
                                                                                                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${transportInfo.legs[leg.id].active ? 'left-5' : 'left-0.5'}`} />
                                                                                            </button>
                                                                                            <div className="flex-1">
                                                                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${leg.color}`}>{leg.label}</span>
                                                                                            </div>
                                                                                            <div className={`flex items-center gap-3 ${!transportInfo.legs[leg.id].active && 'pointer-events-none'}`}>
                                                                                                <div className="w-20">
                                                                                                    <label className="text-[7px] font-bold text-gray-400 uppercase block mb-0.5">KM</label>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        step="0.1"
                                                                                                        value={transportInfo.legs[leg.id].km}
                                                                                                        onChange={e => {
                                                                                                            const next = { ...transportInfo, legs: { ...transportInfo.legs, [leg.id]: { ...transportInfo.legs[leg.id], km: e.target.value } } };
                                                                                                            setTransportInfo(next);
                                                                                                            recalculateTransport(next);
                                                                                                        }}
                                                                                                        className="w-full text-[10px] font-bold text-secondary dark:text-white bg-white dark:bg-gray-700 rounded-lg px-2 py-1 outline-none border border-gray-100 dark:border-gray-600 focus:border-blue-200"
                                                                                                    />
                                                                                                </div>
                                                                                                {leg.showMin && (
                                                                                                    <div className="w-20">
                                                                                                        <label className="text-[7px] font-bold text-gray-400 uppercase block mb-0.5">MIN</label>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            value={transportInfo.legs[leg.id].min}
                                                                                                            onChange={e => {
                                                                                                                const next = { ...transportInfo, legs: { ...transportInfo.legs, [leg.id]: { ...transportInfo.legs[leg.id], min: e.target.value } } };
                                                                                                                setTransportInfo(next);
                                                                                                                recalculateTransport(next);
                                                                                                            }}
                                                                                                            className="w-full text-[10px] font-bold text-secondary dark:text-white bg-white dark:bg-gray-700 rounded-lg px-2 py-1 outline-none border border-gray-100 dark:border-gray-600 focus:border-blue-200"
                                                                                                        />
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>

                                                                                {/* Paradas Extras - Resumo no Cálculo */}
                                                                                {transportParadas.filter(p => p.active).length > 0 && (
                                                                                    <div className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-200/50 dark:border-violet-800/30">
                                                                                        <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <span className="text-lg">📍</span>
                                                                                                <div>
                                                                                                    <span className="text-[9px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-widest">
                                                                                                        {transportParadas.filter(p => p.active).length} Parada(s) Extra(s)
                                                                                                    </span>
                                                                                                    <p className="text-[8px] font-medium text-violet-500 dark:text-violet-400">
                                                                                                        +{transportParadas.filter(p => p.active).reduce((acc, p) => acc + Number(p.km), 0).toFixed(1)} km,
                                                                                                        +{transportParadas.filter(p => p.active).reduce((acc, p) => acc + Number(p.min), 0)} min
                                                                                                    </p>
                                                                                                </div>
                                                                                            </div>
                                                                                            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                                                                                                Incluído no cálculo ✓
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}

                                                                                {/* Desconto Geral */}
                                                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm w-full">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <label className="text-[8px] font-bold text-blue-400 dark:text-blue-300 uppercase tracking-widest">Desconto no Transporte (%)</label>
                                                                                        <input
                                                                                            type="number"
                                                                                            value={transportInfo.discountPercent}
                                                                                            onChange={e => {
                                                                                                const next = { ...transportInfo, discountPercent: e.target.value };
                                                                                                setTransportInfo(next);
                                                                                                recalculateTransport(next);
                                                                                            }}
                                                                                            className="w-16 text-right text-xs font-bold text-blue-600 dark:text-blue-400 outline-none bg-transparent"
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                {/* Valor Editável e Info */}
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="flex-1">
                                                                                        <label className="text-[9px] font-bold text-blue-600 uppercase mb-1 block ml-1">Valor Final Sugerido</label>
                                                                                        <div className="relative">
                                                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold text-xs">R$</span>
                                                                                            <input
                                                                                                type="number"
                                                                                                step="0.01"
                                                                                                value={transportInfo.estimatedPrice ?? ''}
                                                                                                onChange={e => {
                                                                                                    const val = e.target.value;
                                                                                                    setTransportInfo({
                                                                                                        ...transportInfo,
                                                                                                        estimatedPrice: val === '' ? '' : parseFloat(val)
                                                                                                    });
                                                                                                }}
                                                                                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl font-bold text-lg text-blue-600 dark:text-blue-400 border-2 border-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                    {transportInfo.settings && (
                                                                                        <div className="px-4 py-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-xl text-[8px] leading-tight space-y-1.5 border border-blue-200 dark:border-blue-800">
                                                                                            {quote.petQuantity > 1 && <div className="font-bold text-blue-600 dark:text-blue-300">+{(quote.petQuantity - 1) * 20}% Pets Adic.</div>}
                                                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                                                                <span className="text-blue-500 font-bold">R$/KM:</span>
                                                                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                                                                    {((transportInfo.settings.kmPriceLeva + transportInfo.settings.kmPriceTraz) / 2).toFixed(2)}
                                                                                                </span>
                                                                                                <Info size={10} className="text-gray-400" />
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                                                                <span className="text-blue-500 font-bold">R$/Min:</span>
                                                                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                                                                    {((transportInfo.settings.minPriceLeva + transportInfo.settings.minPriceTraz) / 2).toFixed(2)}
                                                                                                </span>
                                                                                                <Info size={10} className="text-gray-400" />
                                                                                            </div>
                                                                                            <div className="text-[7px] text-blue-500/70 dark:text-blue-400/70 mt-1 italic flex items-center gap-1">
                                                                                                <AlertTriangle size={9} />
                                                                                                Valores travados (Conf. Transporte)
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Botão Incluir (Oculto se for TRANSPORTE pois é automático) */}
                                                                                {quote.type !== 'TRANSPORTE' && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={handleAddTransportToQuote}
                                                                                        className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                                                                    >
                                                                                        <CheckCircle size={16} /> Incluir no Orçamento
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* BOTÃO CALCULAR - só habilita quando requisitos mínimos estão ok */}
                                                                    <button
                                                                        type="button"
                                                                        disabled={isCalculatingTransport || !canCalculateTransport()}
                                                                        onClick={handleCalculateTransport}
                                                                        className="relative z-10 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        title={!canCalculateTransport() ? 'Preencha os campos obrigatórios primeiro' : 'Calcular valor do transporte'}
                                                                    >
                                                                        {isCalculatingTransport ? (
                                                                            <RefreshCcw size={16} className="animate-spin" />
                                                                        ) : 'Calcular Agora'}
                                                                    </button>
                                                                    <div className="absolute right-0 top-0 text-blue-100 translate-x-10 -translate-y-10">
                                                                        <Truck size={140} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* PLACEHOLDER QUANDO TIPO NÃO FOI ESCOLHIDO */
                                                            <div className="p-8 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-4 text-center animate-pulse">
                                                                <Truck size={48} className="text-gray-300 dark:text-gray-600" />
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Selecione o Tipo de Transporte</p>
                                                                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Os campos de rota e horário serão exibidos após a seleção</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </section>
                                        )}


                                        {/* 4. Itens do Orçamento */}
                                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-xl shadow-green-500/5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                                                    <div className="w-12 h-12 rounded-[20px] bg-green-500 text-white flex items-center justify-center font-bold shadow-lg shadow-green-500/20 ring-4 ring-green-500/10">
                                                        {quote.type === 'SPA' ? '3' : '4'}
                                                    </div>
                                                    Itens do Orçamento
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddItem()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                                                >
                                                    <Plus size={14} /> Adicionar Item
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                {quote.items.map((item, idx) => (
                                                    <div key={idx} className="group relative flex flex-wrap md:flex-nowrap gap-4 items-end bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-800 hover:bg-white dark:hover:bg-gray-700 transition-all">
                                                        <div className="flex-1 min-w-[200px]">
                                                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Serviço / Descrição</label>
                                                            <div className="relative">
                                                                {!item.isManual ? (
                                                                    <>
                                                                        <select
                                                                            value={item.serviceId || item.productId || ''}
                                                                            onChange={e => handleUpdateItem(idx, 'serviceId', e.target.value)}
                                                                            className={`w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-bold ${(!item.serviceId && !item.productId) ? 'text-gray-300' : 'text-secondary dark:text-white'} outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none`}
                                                                        >
                                                                            <option value="">🛒 Selecione um Serviço ou Produto...</option>

                                                                            {/* Serviços Categorizados */}
                                                                            {(() => {
                                                                                const cats = getCategorizedServices();
                                                                                return (
                                                                                    <>
                                                                                        {cats.banho.length > 0 && (
                                                                                            <optgroup label="🛁 BANHOS (4 Tipos)">
                                                                                                {cats.banho.map(s => (
                                                                                                    <option key={s.id} value={s.id}>
                                                                                                        {s.name} - R$ {s.basePrice.toFixed(2)}
                                                                                                        {s.sizeLabel && ` • ${s.sizeLabel}`}
                                                                                                        {s.coatType && ` • ${s.coatType}`}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}

                                                                                        {cats.tosa.length > 0 && (
                                                                                            <optgroup label="✂️ TOSAS (Higiênica, Estética, Raça, Bebê)">
                                                                                                {cats.tosa.map(s => (
                                                                                                    <option key={s.id} value={s.id}>
                                                                                                        {s.name} - R$ {s.basePrice.toFixed(2)}
                                                                                                        {s.sizeLabel && ` • ${s.sizeLabel}`}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}

                                                                                        {cats.extras.length > 0 && (
                                                                                            <optgroup label="⭐ SERVIÇOS EXTRAS">
                                                                                                {cats.extras.map(s => (
                                                                                                    <option key={s.id} value={s.id}>
                                                                                                        {s.name} - R$ {s.basePrice.toFixed(2)}
                                                                                                        {s.sizeLabel && ` • ${s.sizeLabel}`}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}
                                                                                    </>
                                                                                );
                                                                            })()}

                                                                            {/* Produtos Categorizados */}
                                                                            {(() => {
                                                                                const prodCats = getCategorizedProducts();
                                                                                return (
                                                                                    <>
                                                                                        {prodCats.banho.length > 0 && (
                                                                                            <optgroup label="🧴 PRODUTOS BANHO">
                                                                                                {prodCats.banho.map(p => (
                                                                                                    <option key={p.id} value={p.id}>
                                                                                                        {p.name} - R$ {p.price.toFixed(2)}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}

                                                                                        {prodCats.tosa.length > 0 && (
                                                                                            <optgroup label="✄ PRODUTOS TOSA">
                                                                                                {prodCats.tosa.map(p => (
                                                                                                    <option key={p.id} value={p.id}>
                                                                                                        {p.name} - R$ {p.price.toFixed(2)}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}

                                                                                        {prodCats.extras.length > 0 && (
                                                                                            <optgroup label="🎁 PRODUTOS EXTRAS">
                                                                                                {prodCats.extras.map(p => (
                                                                                                    <option key={p.id} value={p.id}>
                                                                                                        {p.name} - R$ {p.price.toFixed(2)}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </optgroup>
                                                                                        )}
                                                                                    </>
                                                                                );
                                                                            })()}

                                                                            <option value="MANUAL_UPGRADE">✏️ Digitar item personalizado...</option>
                                                                        </select>
                                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                                                                            <Info size={14} />
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="relative flex items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={item.description}
                                                                            onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                                                                            className="w-full bg-blue-50/50 dark:bg-blue-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-xl px-4 py-3 text-xs font-bold text-blue-600 dark:text-blue-400 outline-none shadow-sm focus:border-blue-500 transition-all"
                                                                            placeholder="Digite para buscar serviço ou produto..."
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const n = [...quote.items];
                                                                                n[idx] = { ...n[idx], isManual: false, serviceId: 'PENDING' };
                                                                                setQuote({ ...quote, items: n });
                                                                            }}
                                                                            className="absolute right-3 text-blue-400 hover:text-blue-600 p-1"
                                                                            title="Escolher serviço do catálogo"
                                                                        >
                                                                            <RefreshCcw size={12} />
                                                                        </button>

                                                                        {/* Sugestões de Itens (Serviços + Produtos) */}
                                                                        <AnimatePresence>
                                                                            {activeItemSearch?.index === idx && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, y: -10 }}
                                                                                    animate={{ opacity: 1, y: 0 }}
                                                                                    exit={{ opacity: 0, y: -10 }}
                                                                                    className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-blue-100 dark:border-blue-900/50 z-[100] max-h-60 overflow-y-auto"
                                                                                >
                                                                                    {[...services, ...products]
                                                                                        .filter(i => i.name.toLowerCase().includes(activeItemSearch.query.toLowerCase()))
                                                                                        .slice(0, 10)
                                                                                        .map(match => (
                                                                                            <button
                                                                                                key={match.id}
                                                                                                type="button"
                                                                                                onClick={() => selectSuggestedItem(idx, match)}
                                                                                                className="w-full p-4 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border-b border-gray-50 dark:border-gray-700 last:border-none group"
                                                                                            >
                                                                                                <div className="text-left">
                                                                                                    <p className="text-xs font-bold text-secondary dark:text-white group-hover:text-blue-600">{match.name}</p>
                                                                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                                                                                        {match.basePrice !== undefined ? '🛠️ Serviço' : '📦 Produto'}
                                                                                                        {match.category && ` • ${match.category}`}
                                                                                                    </p>
                                                                                                </div>
                                                                                                <span className="text-xs font-bold text-blue-500">R$ {(match.price || match.basePrice || 0).toFixed(2)}</span>
                                                                                            </button>
                                                                                        ))}
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="w-24">
                                                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Qtd</label>
                                                            <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                                                    className="p-3 text-gray-300 hover:text-secondary"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>
                                                                <span className="flex-1 text-center font-bold text-secondary dark:text-white text-xs">{item.quantity}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                                                                    className="p-3 text-gray-300 hover:text-secondary"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="w-32">
                                                            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Preço Unit.</label>
                                                            <div className="relative">
                                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] font-bold">R$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.price ?? ''}
                                                                    onChange={e => {
                                                                        const val = e.target.value;
                                                                        handleUpdateItem(idx, 'price', val === '' ? 0 : parseFloat(val));
                                                                    }}
                                                                    className="w-full bg-white dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-green-500/20 transition-all"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDuplicateItem(idx)}
                                                                className="p-3 text-blue-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                                title="Duplicar item"
                                                            >
                                                                <Copy size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItem(idx)}
                                                                className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {quote.items.length === 0 && (
                                                    <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-dashed border-gray-100 dark:border-gray-600 rounded-3xl group hover:border-blue-200 transition-all cursor-pointer" onClick={() => handleAddItem()}>
                                                        <div className="w-12 h-12 bg-white dark:bg-gray-600 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-400 mx-auto mb-4 group-hover:text-blue-500 transition-all">
                                                            <Plus size={24} />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum item adicionado</p>
                                                        <p className="text-[10px] font-bold text-gray-300">Clique para adicionar o primeiro serviço</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Subsessões de Produtos */}
                                            <div className="mt-6 space-y-4">
                                                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                                    <span className="w-6 h-6 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center text-xs">📦</span>
                                                    Produtos Inteligentes (baseados no perfil do pet)
                                                </h4>

                                                {/* Produto de Banho */}
                                                {(() => {
                                                    const prodCats = getCategorizedProducts();
                                                    return prodCats.banho.length > 0 && (
                                                        <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                                            <label className="block text-[9px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-2 ml-1">
                                                                🧴 Produto de Banho (opcional)
                                                            </label>
                                                            <select
                                                                value={selectedProductBanho?.id || ''}
                                                                onChange={(e) => {
                                                                    const prod = prodCats.banho.find(p => p.id === e.target.value);
                                                                    setSelectedProductBanho(prod || null);
                                                                    if (prod) {
                                                                        handleAddItem(prod);
                                                                    }
                                                                }}
                                                                className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                            >
                                                                <option value="">Selecionar produto de banho...</option>
                                                                {prodCats.banho.map(p => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} - R$ {p.price.toFixed(2)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <p className="mt-2 text-[9px] font-medium text-blue-600 dark:text-blue-400 ml-1">
                                                                {prodCats.banho.length} produto(s) compatível(is) com {pet.species} {pet.weight}kg {pet.coatType}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Produto de Tosa */}
                                                {(() => {
                                                    const prodCats = getCategorizedProducts();
                                                    return prodCats.tosa.length > 0 && (
                                                        <div className="p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                                                            <label className="block text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-2 ml-1">
                                                                ✄ Produto de Tosa (opcional)
                                                            </label>
                                                            <select
                                                                value={selectedProductTosa?.id || ''}
                                                                onChange={(e) => {
                                                                    const prod = prodCats.tosa.find(p => p.id === e.target.value);
                                                                    setSelectedProductTosa(prod || null);
                                                                    if (prod) {
                                                                        handleAddItem(prod);
                                                                    }
                                                                }}
                                                                className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                            >
                                                                <option value="">Selecionar produto de tosa...</option>
                                                                {prodCats.tosa.map(p => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} - R$ {p.price.toFixed(2)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <p className="mt-2 text-[9px] font-medium text-amber-600 dark:text-amber-400 ml-1">
                                                                {prodCats.tosa.length} produto(s) compatível(is) com {pet.species} {pet.weight}kg {pet.coatType}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Produto Extra */}
                                                {(() => {
                                                    const prodCats = getCategorizedProducts();
                                                    return prodCats.extras.length > 0 && (
                                                        <div className="p-4 bg-purple-50/30 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                                                            <label className="block text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-2 ml-1">
                                                                🎁 Produto Extra (opcional)
                                                            </label>
                                                            <select
                                                                value={selectedProductExtra?.id || ''}
                                                                onChange={(e) => {
                                                                    const prod = prodCats.extras.find(p => p.id === e.target.value);
                                                                    setSelectedProductExtra(prod || null);
                                                                    if (prod) {
                                                                        handleAddItem(prod);
                                                                    }
                                                                }}
                                                                className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-bold text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-purple-500/20 transition-all"
                                                            >
                                                                <option value="">Selecionar produto extra...</option>
                                                                {prodCats.extras.map(p => (
                                                                    <option key={p.id} value={p.id}>
                                                                        {p.name} - R$ {p.price.toFixed(2)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <p className="mt-2 text-[9px] font-medium text-purple-600 dark:text-purple-400 ml-1">
                                                                {prodCats.extras.length} produto(s) compatível(is) com {pet.species} {pet.weight}kg {pet.coatType}
                                                            </p>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </section>


                                        {/* 5. Previsão de Atendimento */}
                                        <section className="bg-white dark:bg-gray-800 p-8 rounded-[40px] border border-gray-100 dark:border-gray-700 shadow-xl shadow-blue-500/5 space-y-8">
                                            <h3 className="text-xl font-bold text-secondary dark:text-white flex items-center gap-4 uppercase tracking-tighter">
                                                <div className="w-12 h-12 rounded-[20px] bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-600/20 ring-4 ring-blue-600/10">
                                                    {quote.type === 'SPA' ? '4' : '5'}
                                                </div>
                                                Previsão de Atendimento
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Data e Hora Prevista</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                                        <input
                                                            type="datetime-local"
                                                            value={quote.desiredAt ? new Date(new Date(quote.desiredAt).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                                                            onChange={e => setQuote({ ...quote, desiredAt: e.target.value })}
                                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl pl-14 pr-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-[10px] font-medium text-gray-400 ml-1">Sugestão de data e horário para execução</p>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Resumo e Total */}
                                        <div className="mt-8 pt-8 border-t border-gray-50 dark:border-gray-700 space-y-6">
                                            {/* Desconto Estratégico (Manual) - Apenas para AVULSO */}
                                            {customer.type === 'AVULSO' && (
                                                <div className="p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-800/30">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                                                                <span className="w-5 h-5 bg-purple-500 text-white rounded-lg flex items-center justify-center text-[10px]">💎</span>
                                                                Desconto Estratégico (Vendas/Negociação)
                                                            </h4>
                                                            <p className="text-[10px] font-medium text-purple-600/70 dark:text-purple-400/70 mt-1">
                                                                Aplique um desconto manual para clientes avulsos para incentivar a venda ou negociação
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.1"
                                                                value={strategicDiscount ?? ''}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setStrategicDiscount(val === '' ? '' : parseFloat(val));
                                                                }}
                                                                className="w-20 text-center px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-xl font-bold text-purple-600 dark:text-purple-400 outline-none focus:border-purple-500 transition-all"
                                                            />
                                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                                <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 max-w-md">
                                                    <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
                                                    <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                                                        <span className="font-bold uppercase block mb-1">Nota para o Operador:</span>
                                                        Fatores como desembolo (nós) e transporte calculado via Maps serão processados automaticamente ao salvar, podendo alterar o valor total final se não incluídos manualmente.
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex flex-col items-end mb-1 space-y-0.5">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Total Parcial Estimado</span>
                                                        {serviceDiscount > 0 && (
                                                            <span className="text-[10px] font-bold text-green-500 uppercase">
                                                                Desc. Recorrência: - R$ {serviceDiscount.toFixed(2)}
                                                            </span>
                                                        )}
                                                        {productDiscount > 0 && (
                                                            <span className="text-[10px] font-bold text-purple-500 uppercase">
                                                                Desc. Estratégico (Produtos): - R$ {productDiscount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-4xl font-bold text-secondary dark:text-white tabular-nums flex items-baseline gap-1">
                                                        <span className="text-lg opacity-30">R$</span> {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer (Premium) */}
                                        <div className="mt-10 px-6 py-8 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4 rounded-b-[40px]">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                className="px-8 py-3 rounded-2xl font-bold text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                disabled={isLoading}
                                                type="submit"
                                                className="px-10 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:shadow-2xl hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
                                            >
                                                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                                                    {isLoading ? (
                                                        <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Plus size={12} className="text-white" />
                                                    )}
                                                </div>
                                                {isLoading ? 'Salvando...' : 'Criar Orçamento'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        </div>

                        {showSummary && (
                            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowSummary(false)}
                                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    className="w-full max-w-2xl max-h-[85vh] bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20 dark:border-gray-700"
                                >
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Eye size={24} className="text-blue-600 dark:text-blue-400" />
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Conferência do Orçamento</h2>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Revise todos os dados antes de criar</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowSummary(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {/* 1. Cliente */}
                                        <div className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200 uppercase mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">1</div>
                                                Cliente
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Nome:</span> <span className="font-bold text-secondary dark:text-white">{customer.name}</span></div>
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Email:</span> <span className="text-secondary dark:text-white">{customer.email}</span></div>
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Telefone:</span> <span className="text-secondary dark:text-white">{customer.phone || 'Não informado'}</span></div>
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Tipo:</span> <span className={`px-2 py-0.5 rounded text-xs font-bold ${customer.type === 'RECORRENTE' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{customer.type}</span></div>
                                                {customer.type === 'RECORRENTE' && (
                                                    <div className="col-span-2 space-y-1">
                                                        <div><span className="font-bold text-gray-600 dark:text-gray-400">Frequência SPA:</span> <span className="font-bold text-purple-600 dark:text-purple-400">{customer.recurrenceFrequency}</span></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 2. Pet */}
                                        <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                            <h3 className="text-sm font-bold text-purple-800 dark:text-purple-200 uppercase mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-purple-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">2</div>
                                                Pet
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Nome:</span> <span className="font-bold text-secondary dark:text-white">{pet.name}</span></div>
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Espécie:</span> <span className="text-secondary dark:text-white">{pet.species}</span></div>
                                                {pet.breed && <div><span className="font-bold text-gray-600 dark:text-gray-400">Raça:</span> <span className="text-secondary dark:text-white">{pet.breed}</span></div>}
                                                {pet.weight && <div><span className="font-bold text-gray-600 dark:text-gray-400">Peso:</span> <span className="text-secondary dark:text-white">{pet.weight} kg</span></div>}
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Pelagem:</span> <span className="text-secondary dark:text-white">{pet.coatType}</span></div>
                                                <div><span className="font-bold text-gray-600 dark:text-gray-400">Temperamento:</span> <span className="text-secondary dark:text-white">{pet.temperament}</span></div>
                                            </div>
                                        </div>

                                        {/* 3. Serviços SPA */}
                                        {(() => {
                                            // Desconto de recorrência sobre serviços (Apenas para RECORRENTE)
                                            const recurrenceDiscountAmount = customer.type === 'RECORRENTE' ? spaItems.reduce((acc, item) => {
                                                // Se for serviço (tem serviceId ou é automático sem productId)
                                                if ((item.serviceId || item.isAutomatic) && !item.productId && spaDiscountRate > 0) {
                                                    return acc + (item.price * item.quantity * spaDiscountRate);
                                                }
                                                return acc;
                                            }, 0) : 0;

                                            // Desconto estratégico (Manual - apenas para AVULSO conforme regra do usuário)
                                            const strategicDiscountAmount = customer.type === 'AVULSO' ? spaItems.reduce((acc, item) => {
                                                // Aplica o desconto estratégico no subtotal do SPA para AVULSO
                                                if (Number(strategicDiscount) > 0) {
                                                    return acc + (item.price * item.quantity * (Number(strategicDiscount) / 100));
                                                }
                                                return acc;
                                            }, 0) : 0;

                                            const totalSpaDiscount = recurrenceDiscountAmount + strategicDiscountAmount;
                                            const spaTotal = spaSubtotal - totalSpaDiscount;

                                            if (spaSubtotal === 0) return null;

                                            return (
                                                <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                                                    <h3 className="text-sm font-bold text-green-800 dark:text-green-200 uppercase mb-3 flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">3</div>
                                                        Serviços SPA
                                                    </h3>

                                                    {/* Lista de itens */}
                                                    <div className="space-y-2 mb-4">
                                                        {spaItems.map((item, idx) => (
                                                            <div key={idx} className={`flex items-center justify-between p-2.5 rounded-lg ${item.isAutomatic ? 'bg-orange-100/50 dark:bg-orange-900/20' : 'bg-white/60 dark:bg-gray-800/40'}`}>
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-xs text-secondary dark:text-white">
                                                                        {item.description}
                                                                        {item.isAutomatic && <span className="ml-2 text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">Auto</span>}
                                                                    </p>
                                                                    <p className="text-[9px] text-gray-500">Qtd: {item.quantity} × R$ {item.price.toFixed(2)}</p>
                                                                </div>
                                                                <div className="text-right flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleDuplicateItem(quote.items.findIndex(qi => qi.description === item.description && qi.price === item.price && !qi.isTransport))}
                                                                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                                                        title="Duplicar item"
                                                                    >
                                                                        <Copy size={12} />
                                                                    </button>
                                                                    <p className="font-bold text-sm text-secondary dark:text-white">R$ {(item.price * item.quantity).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>


                                                    {/* Totais */}
                                                    <div className="space-y-2 text-sm pt-3 border-t border-green-200 dark:border-green-800">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700 dark:text-gray-300 font-bold">
                                                                Subtotal SPA:
                                                                {totalSpaDiscount > 0 && (
                                                                    <span className="ml-2 text-green-600 dark:text-green-400 text-xs">
                                                                        ({((totalSpaDiscount / spaSubtotal) * 100).toFixed(0)}% desconto)
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="font-bold text-secondary dark:text-white">R$ {spaSubtotal.toFixed(2)}</span>
                                                        </div>
                                                        {recurrenceDiscountAmount > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-green-600 dark:text-green-400 font-bold">Desconto Recorrência ({(spaDiscountRate * 100).toFixed(0)}%):</span>
                                                                <span className="font-bold text-green-600 dark:text-green-400">- R$ {recurrenceDiscountAmount.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        {strategicDiscountAmount > 0 && (
                                                            <div className="flex justify-between">
                                                                <span className="text-purple-600 dark:text-purple-400 font-bold">Desconto Produtos ({strategicDiscount}%):</span>
                                                                <span className="font-bold text-purple-600 dark:text-purple-400">- R$ {strategicDiscountAmount.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between pt-2 border-t-2 border-green-300 dark:border-green-700">
                                                            <span className="font-bold text-green-800 dark:text-green-200 uppercase">Total SPA (com desconto):</span>
                                                            <span className="font-bold text-lg text-green-800 dark:text-green-200">R$ {spaTotal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 4. Serviços de Transporte */}
                                        {(() => {
                                            // Desconto no transporte conforme tipo de cliente
                                            const transportRecurrenceDiscount = customer.type === 'RECORRENTE' ? (transportSubtotal * transportDiscountRate) : 0;
                                            const transportStrategicDiscount = customer.type === 'AVULSO' ? (transportSubtotal * (Number(strategicDiscount) / 100)) : 0;

                                            // Usar o maior desconto ou o de transporte específico se houver
                                            const transportDiscount = Math.max(
                                                transportRecurrenceDiscount + transportStrategicDiscount,
                                                transportInfo?.discountPercent ? (transportSubtotal * (transportInfo.discountPercent / 100)) : 0
                                            );
                                            const transportTotal = transportSubtotal - transportDiscount;

                                            if (transportSubtotal === 0) return null;

                                            return (
                                                <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                                    <h3 className="text-sm font-bold text-orange-800 dark:text-orange-200 uppercase mb-3 flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">
                                                            {spaSubtotal > 0 ? '4' : '3'}
                                                        </div>
                                                        Serviço Leva & Traz
                                                    </h3>

                                                    {/* Detalhamento do transporte */}
                                                    <div className="space-y-2">
                                                        {transportItems.map((item, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-sm text-orange-800 dark:text-orange-200">{item.description}</p>
                                                                    <p className="text-[9px] text-gray-500">Qtd: {item.quantity} × R$ {item.price.toFixed(2)}</p>
                                                                </div>
                                                                <div className="text-right flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => handleDuplicateItem(quote.items.findIndex(qi => qi.description === item.description && qi.price === item.price))}
                                                                        className="p-1.5 text-orange-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
                                                                        title="Duplicar transporte"
                                                                    >
                                                                        <Copy size={12} />
                                                                    </button>
                                                                    <p className="font-bold text-sm text-orange-800 dark:text-orange-200">R$ {(item.price * item.quantity).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Acréscimo por pets adicionais (Se houver info de cálculo manual ainda ativa) */}
                                                        {transportInfo?.extraPets > 0 && (
                                                            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-sm text-yellow-800 dark:text-yellow-200">
                                                                        Acréscimo ({transportInfo.extraPets} pet{transportInfo.extraPets > 1 ? 's' : ''} adicional{transportInfo.extraPets > 1 ? 'is' : ''})
                                                                    </p>
                                                                    <p className="text-[9px] text-gray-500">{transportInfo.surchargePercentage}% por pet adicional</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-sm text-yellow-800 dark:text-yellow-200">+R$ {(transportInfo.surchargeAmount || 0).toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Totais do Transporte */}
                                                        <div className="pt-3 border-t border-orange-200 dark:border-orange-800 space-y-1">
                                                            <div className="flex justify-between text-xs font-bold text-orange-600/60">
                                                                <span>Subtotal Transporte:</span>
                                                                <span>R$ {transportSubtotal.toFixed(2)}</span>
                                                            </div>
                                                            {transportDiscount > 0 && (
                                                                <div className="flex justify-between text-xs font-bold text-green-600">
                                                                    <span>Desconto aplicado ({((transportDiscount / transportSubtotal) * 100).toFixed(0)}%):</span>
                                                                    <span>- R$ {transportDiscount.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center justify-between p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg mt-2">
                                                                <div className="flex-1">
                                                                    <p className="font-bold text-xs text-orange-800 dark:text-orange-200 uppercase tracking-widest">Total Líquido Transporte</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-xl text-orange-800 dark:text-orange-200">R$ {transportTotal.toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 5. Total do Orçamento (antes da taxa de cartão) */}
                                        <div className="p-5 bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 rounded-2xl border-2 border-slate-300 dark:border-slate-600">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">Subtotal do Orçamento</p>
                                                    {totalDiscount > 0 && (
                                                        <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">Economia Total: R$ {totalDiscount.toFixed(2)}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">R$ {total.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 6. Taxa de Cartão de Crédito */}
                                        <div className="p-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                            <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-200 uppercase mb-3 flex items-center gap-2">
                                                <div className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold">💳</div>
                                                Taxa de Cartão de Crédito (Opcional)
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Percentual da Taxa (%)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            value={creditCardFee ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setCreditCardFee(val === '' ? '' : parseFloat(val));
                                                            }}
                                                            className="w-24 text-center px-3 py-2 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500 transition-all"
                                                            placeholder="0.0"
                                                        />
                                                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">%</span>
                                                    </div>
                                                </div>
                                                {Number(creditCardFee) > 0 && (
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Valor da Taxa</p>
                                                        <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">+ R$ {(total * (Number(creditCardFee) / 100)).toFixed(2)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* 7. TOTAL FINAL DO ORÇAMENTO */}
                                        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl border-4 border-blue-400 shadow-2xl">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">VALOR TOTAL FINAL</p>
                                                    {Number(creditCardFee) > 0 && (
                                                        <p className="text-[10px] text-blue-100">Inclui taxa de cartão ({creditCardFee}%)</p>
                                                    )}
                                                    {totalDiscount > 0 && (
                                                        <p className="text-[10px] text-green-300 font-bold mt-1">✓ Economizou R$ {totalDiscount.toFixed(2)}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-4xl font-bold text-white drop-shadow-lg">
                                                        R$ {(total + (total * (Number(creditCardFee) / 100))).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowSummary(false)}
                                            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
                                        >
                                            <Edit size={16} />
                                            Alterar
                                        </button>
                                        <button
                                            disabled={isLoading}
                                            onClick={confirmCreateQuote}
                                            className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isLoading ? (
                                                <>Verificando...</>
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} />
                                                    Verificar e Criar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                        {/* Picker Modal Overlay */}
                        <AnimatePresence>
                            {showFullCustomerSearch && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-10"
                                >
                                    <div
                                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                        onClick={() => setShowFullCustomerSearch(false)}
                                    />
                                    <motion.div
                                        initial={{ scale: 0.9, y: 20 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0.9, y: 20 }}
                                        className="relative w-full max-w-5xl max-h-full bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl flex flex-col overflow-hidden border border-white/20"
                                    >
                                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-primary/10 text-primary rounded-[22px] flex items-center justify-center">
                                                    <User size={30} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-secondary dark:text-white uppercase tracking-tighter leading-none mb-1">Base Completa de Clientes</h3>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Encontre o tutor pela lista visual</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowFullCustomerSearch(false)}
                                                className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all border border-gray-100 dark:border-gray-700 hover:rotate-90"
                                            >
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div className="p-8 flex-1 overflow-hidden flex flex-col gap-8">
                                            <div className="relative">
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={24} />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={pickerSearch}
                                                    onChange={e => setPickerSearch(e.target.value)}
                                                    placeholder="Filtrar por nome, telefone ou email..."
                                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-[32px] pl-16 pr-8 py-6 text-xl font-bold text-secondary dark:text-white shadow-inner focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                                />
                                            </div>

                                            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 custom-scrollbar pb-10">
                                                {isFetchingCustomers ? (
                                                    <div className="col-span-full py-32 flex flex-col items-center justify-center gap-6">
                                                        <div className="relative">
                                                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                            <User size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-bounce">Sincronizando base de dados...</span>
                                                    </div>
                                                ) : allCustomers.filter(c =>
                                                    c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                                                    c.phone?.includes(pickerSearch) ||
                                                    c.email?.toLowerCase().includes(pickerSearch.toLowerCase())
                                                ).length === 0 ? (
                                                    <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-40">
                                                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                                                            <Search size={48} className="text-gray-300 dark:text-gray-600" />
                                                        </div>
                                                        <h4 className="text-xl font-bold text-gray-400 uppercase tracking-tight">Vazio por aqui</h4>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Tente outros termos ou cadastre este cliente.</p>
                                                    </div>
                                                ) : (
                                                    allCustomers
                                                        .filter(c =>
                                                            c.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
                                                            c.phone?.includes(pickerSearch) ||
                                                            c.email?.toLowerCase().includes(pickerSearch.toLowerCase())
                                                        )
                                                        .map(c => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    handleSelectCustomer(c);
                                                                    setShowFullCustomerSearch(false);
                                                                }}
                                                                className="group flex flex-col p-6 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all text-left relative overflow-hidden"
                                                            >
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                                                                <div className="relative z-10 w-full">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${c.type === 'RECORRENTE' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                            {c.name.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <Badge variant={c.type === 'RECORRENTE' ? 'info' : 'neutral'} className="text-[8px] px-2 py-0.5 font-bold uppercase tracking-tighter">
                                                                            {c.type === 'RECORRENTE' ? 'VIP' : 'AVULSO'}
                                                                        </Badge>
                                                                    </div>
                                                                    <h4 className="text-base font-bold text-secondary dark:text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-1 mb-3">{c.name}</h4>
                                                                    <div className="space-y-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                                        <p className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                                                            <Phone size={12} className="text-primary" /> {c.phone || 'Sem Telefone'}
                                                                        </p>
                                                                        <p className="flex items-center gap-2 text-[9px] font-bold text-gray-400 truncate">
                                                                            <MapPin size={12} /> {c.address || 'Endereço não informado'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-8 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                                            <button
                                                onClick={() => setShowFullCustomerSearch(false)}
                                                className="flex items-center gap-3 px-10 py-4 bg-secondary dark:bg-gray-700 text-white font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest"
                                            >
                                                <X size={18} /> Cancelar e Voltar
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )
                }
            </AnimatePresence>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={cancelClose}
                onConfirm={confirmClose}
                title="Descartar alterações?"
                description="Você tem alterações não salvas neste orçamento. Se sair agora, perderá todo o progresso."
                confirmText="Sair sem salvar"
                confirmColor="bg-red-600"
                cancelText="Continuar editando"
            />

        </>
    );
}
