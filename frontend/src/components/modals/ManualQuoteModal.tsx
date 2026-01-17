import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { X, Plus, Trash2, Search, Truck, MapPin, RefreshCcw, Scissors, Droplets, Bug, AlertTriangle, Calendar, Minus, CheckCircle, Info, Eye, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ManualQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (quote: any) => void;
}

export default function ManualQuoteModal({ isOpen, onClose, onSuccess }: ManualQuoteModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [activeItemSearch, setActiveItemSearch] = useState<{ index: number, query: string } | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [strategicDiscount, setStrategicDiscount] = useState<number | ''>(0);
    const [creditCardFee, setCreditCardFee] = useState<number | ''>(0); // Taxa de cartão de crédito em %

    // Form State
    const [customer, setCustomer] = useState({
        id: '', // Added for existing customers
        name: '',
        email: '',
        phone: '',
        address: '',
        type: 'AVULSO', // AVULSO ou RECORRENTE
        recurrenceFrequency: 'MENSAL' as 'MENSAL' | 'QUINZENAL' | 'SEMANAL' | null,
    });

    // Search State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchMode, setSearchMode] = useState<'NEW' | 'EXISTING'>('NEW');

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
        type: 'SPA',
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

    const [transportInfo, setTransportInfo] = useState<any>(null);
    const [isCalculatingTransport, setIsCalculatingTransport] = useState(false);
    const [transportType, setTransportType] = useState<'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF'>('ROUND_TRIP');
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
                    console.error('Erro na busca ativa:', error);
                }
            } else if (!query) {
                setSearchResults([]);
                setShowSuggestions(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [customer.name, customer.phone, searchMode]);

    const fetchServices = async () => {
        try {
            const [svcRes, prodRes] = await Promise.all([
                api.get('/services'),
                api.get('/products')
            ]);
            // A API pode retornar array direto ou { items: [...] }
            const svcData = Array.isArray(svcRes.data) ? svcRes.data : (svcRes.data.items || []);
            const prodData = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.items || []);

            console.log('[ManualQuoteModal] Serviços carregados:', svcData.length);
            console.log('[ManualQuoteModal] Produtos carregados:', prodData.length);

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
            const res = await api.post('/maps/calculate', { address: origin });

            // Garantir que temos um número válido para evitar NaN
            const basePrice = Number(res.data?.estimatedPrice || res.data?.total) || 0;
            const km = Number(res.data?.totalKm) || 0;
            const min = Number(res.data?.totalMin) || 0;

            // Acréscimo por pet adicional: +20% por cada pet EXTRA (ex: 2 pets = +20%, 3 pets = +40%)
            const extraPets = Math.max(0, quote.petQuantity - 1);
            const petSurchargeMultiplier = 1 + (extraPets * 0.2);

            const calculatedPrice = basePrice * petSurchargeMultiplier;

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

        // Surcharge pets
        const extraPets = Math.max(0, quote.petQuantity - 1);
        base = base * (1 + (extraPets * 0.2));

        // Desconto
        const final = base * (1 - (discount / 100));

        setTransportInfo({
            ...info,
            estimatedPrice: Number(final.toFixed(2))
        });
    };

    useEffect(() => {
        if (transportInfo) {
            recalculateTransport(transportInfo);
        }
    }, [quote.petQuantity]);

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
        if (!pet.species) return services;

        const pNorm = normalizeSpecies(pet.species);
        const pWeight = parseFloat(pet.weight) || 0;
        const pCoat = (pet.coatType || '').toUpperCase();

        console.log('[Filter] Pet profile:', { species: pNorm, weight: pWeight, coat: pCoat });

        return services.filter(service => {
            const serviceName = (service.name || '').toUpperCase();

            // 1. Filtrar por espécie
            if (service.species) {
                const sNorm = normalizeSpecies(service.species);
                if (sNorm !== pNorm) return false;
            }

            // 2. Filtrar por porte/peso - Se o serviço tem faixa de peso, o pet DEVE estar nessa faixa
            const sMinW = service.minWeight;
            const sMaxW = service.maxWeight;

            if (pWeight > 0) {
                // Serviço tem peso mínimo e pet está abaixo
                if (sMinW !== null && sMinW !== undefined && pWeight < sMinW) return false;
                // Serviço tem peso máximo e pet está acima
                if (sMaxW !== null && sMaxW !== undefined && pWeight > sMaxW) return false;
            }

            // 3. Filtrar por tipo de pelo
            // Verificar se o serviço menciona um tipo de pelo específico no nome
            if (pCoat) {
                // Detectar se o nome do serviço é específico para um tipo de pelo
                const serviceHasCurto = serviceName.includes('CURTO');
                const serviceHasLongo = serviceName.includes('LONGO');
                const serviceHasMedio = serviceName.includes('MEDIO') || serviceName.includes('MÉDIO');
                const serviceHasCoatType = serviceHasCurto || serviceHasLongo || serviceHasMedio;

                // Se o serviço especifica tipo de pelo, verificar se corresponde ao pet
                if (serviceHasCoatType) {
                    const petIsCurto = pCoat.includes('CURTO');
                    const petIsLongo = pCoat.includes('LONGO');
                    const petIsMedio = pCoat.includes('MEDIO') || pCoat.includes('MÉDIO');

                    // Pet curto só vê serviços curto
                    if (petIsCurto && !serviceHasCurto) return false;
                    // Pet longo só vê serviços longo  
                    if (petIsLongo && !serviceHasLongo) return false;
                    // Pet médio só vê serviços médio
                    if (petIsMedio && !serviceHasMedio) return false;
                }
            }

            return true;
        });
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
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...quote.items];
        newItems.splice(index, 1);
        setQuote({ ...quote, items: newItems });
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
        toast.success(`Cliente ${selected.name} selecionado.`);
    };

    const toggleKnotRegion = (region: string) => {
        setPet(prev => ({
            ...prev,
            knotRegions: prev.knotRegions.includes(region)
                ? prev.knotRegions.filter(r => r !== region)
                : [...prev.knotRegions, region]
        }));
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
            const payload = {
                customer: {
                    ...customer,
                    recurrenceFrequency: customer.type === 'RECORRENTE' ? customer.recurrenceFrequency : null
                },
                pet,
                quote: {
                    ...quote,
                    recurrenceFrequency: customer.type === 'RECORRENTE' ? customer.recurrenceFrequency : null,
                    transportOrigin: quote.transportOrigin || customer.address,
                    transportReturnAddress: quote.isReturnSame ? (quote.transportOrigin || customer.address) : quote.transportReturnAddress,
                    hasKnots: pet.hasKnots,
                    knotRegions: pet.knotRegions.join(', '),
                    hasParasites: pet.hasParasites,
                    parasiteTypes: pet.parasiteTypes,
                    wantsMedicatedBath: pet.wantsMedicatedBath,
                    strategicDiscount
                }
            };

            const res = await api.post('/quotes/manual', payload);
            toast.success('Orçamento criado com sucesso! Agora está em status CALCULADO para revisão.');
            onSuccess(res.data);
            onClose();
        } catch (error: any) {
            console.error('Erro ao criar orçamento manual:', error);
            toast.error(error.response?.data?.error || 'Erro ao criar orçamento');
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

    const getDiscountRate = () => {
        if (customer.type === 'AVULSO') return 0;
        if (customer.recurrenceFrequency === 'MENSAL') return 0.05;
        if (customer.recurrenceFrequency === 'QUINZENAL') return 0.07;
        if (customer.recurrenceFrequency === 'SEMANAL') return 0.10;
        return 0;
    };

    const knotItems = getKnotItems();
    const medicatedBathItem = getMedicatedBathItem();
    const allItems = [...quote.items, ...knotItems, ...(medicatedBathItem ? [medicatedBathItem] : [])];

    const totalBase = allItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountRate = getDiscountRate();

    // Descontos separados conforme novas regras (Aplicando também ao transporte se solicitado)
    const serviceDiscount = customer.type === 'RECORRENTE' ? allItems.reduce((acc, item) => {
        // Desconto de recorrência sobre serviços e itens automáticos (incluindo transporte se for RECORRENTE)
        if ((item.serviceId || item.isAutomatic) && !item.productId && discountRate > 0) {
            return acc + (item.price * item.quantity * discountRate);
        }
        return acc;
    }, 0) : 0;

    const productDiscount = customer.type === 'AVULSO' ? allItems.reduce((acc, item) => {
        // Desconto estratégico para AVULSO em todos os itens (SPA + Transporte)
        if (strategicDiscount > 0) {
            return acc + (item.price * item.quantity * (strategicDiscount / 100));
        }
        return acc;
    }, 0) : 0;

    // Subtotal de transporte para exibição
    const currentTransportSubtotal = allItems.filter(item =>
        item.description?.toLowerCase().includes('transporte') || item.description?.includes('🔄')
    ).reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const totalDiscount = serviceDiscount + productDiscount;
    const total = totalBase - totalDiscount;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
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
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white uppercase tracking-tight">Novo Orçamento Manual</h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                                        Crie um orçamento e cadastre cliente/pet simultaneamente • 📅 Gerado em: <span className="text-primary font-black uppercase">{generationTime}</span>
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50/30 dark:bg-gray-900/50">
                                {/* 1. Cliente */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                                    <h3 className="text-lg font-black text-secondary dark:text-white flex items-center gap-3 uppercase tracking-tight">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center font-black">1</div>
                                        Dados do Cliente
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-8 relative">
                                            <div className="flex justify-between items-center mb-2 ml-1">
                                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nome Completo *</label>
                                                {searchMode === 'EXISTING' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setCustomer({ id: '', name: '', email: '', phone: '', address: '', type: 'AVULSO', recurrenceFrequency: 'MENSAL' });
                                                            setSearchMode('NEW');
                                                        }}
                                                        className="text-[9px] font-black text-blue-500 uppercase hover:underline"
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
                                                    className={`w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500 ${searchMode === 'EXISTING' ? 'ring-2 ring-blue-500/20' : ''}`}
                                                    placeholder="Ex: João Silva"
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
                                                            <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Clientes Encontrados:</span>
                                                        </div>
                                                        {searchResults.map((res: any) => (
                                                            <button
                                                                key={res.id}
                                                                type="button"
                                                                onClick={() => handleSelectCustomer(res)}
                                                                className="w-full px-5 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-between border-b border-gray-50 dark:border-gray-700 last:border-none"
                                                            >
                                                                <div>
                                                                    <p className="text-sm font-black text-secondary dark:text-white">{res.name}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{res.phone || res.user?.email}</p>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">Existente</span>
                                                                    <Plus size={14} className="text-blue-500" />
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <div className="md:col-span-4">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo de Orçamento</label>
                                            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                                                <button
                                                    type="button"
                                                    onClick={() => setCustomer({ ...customer, type: 'AVULSO' })}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${customer.type === 'AVULSO' ? 'bg-white dark:bg-gray-600 text-secondary dark:text-white shadow-sm' : 'text-gray-400 dark:text-gray-500'}`}
                                                >
                                                    Avulso
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCustomer({ ...customer, type: 'RECORRENTE' })}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${customer.type === 'RECORRENTE' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400'}`}
                                                >
                                                    Recorrente
                                                </button>
                                            </div>
                                        </div>

                                        {customer.type === 'RECORRENTE' && (
                                            <div className="md:col-span-12 animate-in slide-in-from-top-2">
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
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{freq.label}</span>
                                                            <span className="text-[8px] font-bold opacity-70">{freq.desc}</span>
                                                            <div className={`mt-1 px-2 py-0.5 rounded-lg font-black text-[9px] ${customer.recurrenceFrequency === freq.id ? 'bg-white/20' : 'bg-purple-100 text-purple-600'}`}>
                                                                {freq.discount}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="md:col-span-6">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email *</label>
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
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Telefone</label>
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
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Endereço (Padrão para Transporte)</label>
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

                                {/* 2. Pet */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                                    <h3 className="text-lg font-black text-secondary dark:text-white flex items-center gap-3 uppercase tracking-tight">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-500 flex items-center justify-center font-black">2</div>
                                        Dados do Pet
                                        {customerPets.length > 0 && (
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selecionar:</span>
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
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome do Pet</label>
                                            <input
                                                type="text"
                                                value={pet.name}
                                                onChange={e => setPet({ ...pet, name: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                placeholder="Ex: Rex"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Espécie</label>
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
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Raça</label>
                                            <input
                                                type="text"
                                                value={pet.breed}
                                                onChange={e => setPet({ ...pet, breed: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                placeholder="Ex: Poodle"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Peso (kg)</label>
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
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Pelagem</label>
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
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Observações de Saúde/Comportamento</label>
                                            <input
                                                type="text"
                                                value={pet.observations}
                                                onChange={e => setPet({ ...pet, observations: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-purple-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                placeholder="Ex: Alérgico a perfume, morde se tocar na calda..."
                                            />
                                        </div>
                                    </div>

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
                                                        <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight">O Pet possui nós?</span>
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
                                                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest ml-1">Selecione as Regiões afetadas:</p>
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
                                                                className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all border ${pet.knotRegions.includes(region.toLowerCase()) ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-orange-100 text-orange-400 hover:bg-orange-50'}`}
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
                                                            <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight">Presença de Parasitas?</span>
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
                                                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${pet.parasiteTypes === type ? 'bg-red-500 border-red-500 text-white shadow-md' : 'bg-white border-red-100 text-red-300 hover:bg-red-50'}`}
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
                                                            <span className="text-sm font-black text-secondary dark:text-white uppercase tracking-tight">Banho Medicamentoso?</span>
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
                                </section>

                                {/* 3. Logística de Transporte */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-secondary dark:text-white flex items-center gap-3 uppercase tracking-tight">
                                            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">3</div>
                                            Logística (Transporte)
                                        </h3>
                                        <div className="px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-2">
                                            <span className="text-[10px] font-black text-orange-600 uppercase">Incluir Transporte?</span>
                                            <button
                                                type="button"
                                                onClick={() => setQuote({ ...quote, type: quote.type === 'SPA_TRANSPORTE' ? 'SPA' : 'SPA_TRANSPORTE' })}
                                                className={`w-10 h-6 rounded-full relative transition-all ${quote.type.includes('TRANSPORTE') ? 'bg-orange-500' : 'bg-gray-200'}`}
                                            >
                                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${quote.type.includes('TRANSPORTE') ? 'left-4.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {quote.type.includes('TRANSPORTE') && (
                                        <div className="space-y-6 animate-in fade-in duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Origem (Busca)</label>
                                                        <input
                                                            type="text"
                                                            value={quote.transportOrigin || customer.address}
                                                            onChange={e => setQuote({ ...quote, transportOrigin: e.target.value })}
                                                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-2xl px-5 py-4 font-bold text-secondary dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-500"
                                                            placeholder="Endereço de coleta..."
                                                        />
                                                    </div>
                                                    <div className="p-5 bg-orange-50/30 rounded-[32px] border border-orange-100/50">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">Retorno no mesmo endereço?</span>
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
                                                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 block ml-1">Destino do Retorno</label>
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
                                                </div>

                                                <div className="space-y-6">
                                                    <div className="flex flex-col gap-4">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Período Preferencial</label>
                                                        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                                            {['MANHA', 'TARDE', 'NOITE'].map((p) => (
                                                                <button
                                                                    key={p}
                                                                    type="button"
                                                                    onClick={() => setQuote({ ...quote, transportPeriod: p as any })}
                                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${quote.transportPeriod === p ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:text-secondary'}`}
                                                                >
                                                                    {p === 'MANHA' ? 'Manhã' : p === 'TARDE' ? 'Tarde' : 'Noite'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 mb-2 block">Horário Leva (Busca)</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={quote.transportLevaAt}
                                                                onChange={e => setQuote({ ...quote, transportLevaAt: e.target.value })}
                                                                className="w-full bg-orange-50/50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-secondary outline-none focus:ring-2 focus:ring-orange-500/20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black text-teal-500 uppercase tracking-widest ml-1 mb-2 block">Horário Traz (Entrega)</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={quote.transportTrazAt}
                                                                onChange={e => setQuote({ ...quote, transportTrazAt: e.target.value })}
                                                                className="w-full bg-teal-50/50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-secondary outline-none focus:ring-2 focus:ring-teal-500/20"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-[32px] border border-gray-100 dark:border-gray-600">
                                                        <span className="text-secondary dark:text-white font-black text-[10px] uppercase tracking-widest ml-1">Qtd. de Pets</span>
                                                        <div className="flex items-center gap-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-2xl shadow-sm">
                                                            <button
                                                                type="button"
                                                                onClick={() => setQuote({ ...quote, petQuantity: Math.max(1, quote.petQuantity - 1) })}
                                                                className="p-1 text-gray-400 hover:text-secondary"
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                            <span className="font-black text-secondary dark:text-white min-w-[20px] text-center">{quote.petQuantity}</span>
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

                                            {/* TIPO DE TRANSPORTE (AGORA ANTES DO CÁLCULO) */}
                                            <div className="space-y-4 mb-4">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Tipo de Transporte</label>
                                                <div className="flex bg-gray-50 dark:bg-gray-700 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-600 gap-2">
                                                    {[
                                                        { value: 'ROUND_TRIP', label: '🔄 Leva e Traz' },
                                                        { value: 'PICK_UP', label: '📦 Só Leva' },
                                                        { value: 'DROP_OFF', label: '🏠 Só Traz' }
                                                    ].map(type => (
                                                        <button
                                                            key={type.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setTransportType(type.value as any);
                                                                // Removido o cálculo automático de 50%. 
                                                                // O operador altera o valor se desejar.
                                                            }}
                                                            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${transportType === type.value
                                                                ? 'bg-orange-500 text-white shadow-lg'
                                                                : 'bg-white dark:bg-gray-600 text-gray-400 dark:text-gray-300 border border-transparent hover:border-orange-200 dark:hover:bg-gray-500'
                                                                }`}
                                                        >
                                                            {type.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between gap-6 overflow-hidden relative">
                                                <div className="relative z-10">
                                                    <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase flex items-center gap-2 mb-1"><RefreshCcw size={14} /> Cálculo Inteligente</h4>
                                                    <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-400/70 max-w-[300px]">Cálculo automático baseado na distância entre a coleta e a 7Pet via Google Maps.</p>
                                                    {transportInfo && transportInfo.legs && (
                                                        <div className="mt-4 space-y-4 animate-in slide-in-from-left">
                                                            {/* Grade de Pernadas Detalhada */}
                                                            <div className="space-y-3">
                                                                {[
                                                                    { id: 'largada', label: '🚀 Largada (Loja -> Coleta)', color: 'bg-blue-50 text-blue-600', showMin: false },
                                                                    { id: 'leva', label: '📦 Leva (Coleta -> Loja)', color: 'bg-green-50 text-green-600', showMin: true },
                                                                    { id: 'traz', label: '🏠 Traz (Loja -> Entrega)', color: 'bg-purple-50 text-purple-600', showMin: true },
                                                                    { id: 'retorno', label: '🔄 Retorno (Entrega -> Loja)', color: 'bg-orange-50 text-orange-600', showMin: false }
                                                                ].map(leg => (
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
                                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${leg.color}`}>{leg.label}</span>
                                                                        </div>
                                                                        <div className={`flex items-center gap-3 ${!transportInfo.legs[leg.id].active && 'pointer-events-none'}`}>
                                                                            <div className="w-20">
                                                                                <label className="text-[7px] font-black text-gray-400 uppercase block mb-0.5">KM</label>
                                                                                <input
                                                                                    type="number"
                                                                                    step="0.1"
                                                                                    value={transportInfo.legs[leg.id].km}
                                                                                    onChange={e => {
                                                                                        const next = { ...transportInfo, legs: { ...transportInfo.legs, [leg.id]: { ...transportInfo.legs[leg.id], km: e.target.value } } };
                                                                                        setTransportInfo(next);
                                                                                        recalculateTransport(next);
                                                                                    }}
                                                                                    className="w-full text-[10px] font-black text-secondary dark:text-white bg-white dark:bg-gray-700 rounded-lg px-2 py-1 outline-none border border-gray-100 dark:border-gray-600 focus:border-blue-200"
                                                                                />
                                                                            </div>
                                                                            {leg.showMin && (
                                                                                <div className="w-20">
                                                                                    <label className="text-[7px] font-black text-gray-400 uppercase block mb-0.5">MIN</label>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={transportInfo.legs[leg.id].min}
                                                                                        onChange={e => {
                                                                                            const next = { ...transportInfo, legs: { ...transportInfo.legs, [leg.id]: { ...transportInfo.legs[leg.id], min: e.target.value } } };
                                                                                            setTransportInfo(next);
                                                                                            recalculateTransport(next);
                                                                                        }}
                                                                                        className="w-full text-[10px] font-black text-secondary dark:text-white bg-white dark:bg-gray-700 rounded-lg px-2 py-1 outline-none border border-gray-100 dark:border-gray-600 focus:border-blue-200"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Desconto Geral */}
                                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30 shadow-sm w-full">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-[8px] font-black text-blue-400 dark:text-blue-300 uppercase tracking-widest">Desconto no Transporte (%)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={transportInfo.discountPercent}
                                                                        onChange={e => {
                                                                            const next = { ...transportInfo, discountPercent: e.target.value };
                                                                            setTransportInfo(next);
                                                                            recalculateTransport(next);
                                                                        }}
                                                                        className="w-16 text-right text-xs font-black text-blue-600 dark:text-blue-400 outline-none bg-transparent"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Valor Editável e Info */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1">
                                                                    <label className="text-[9px] font-black text-blue-600 uppercase mb-1 block ml-1">Valor Final Sugerido</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-black text-xs">R$</span>
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
                                                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 rounded-xl font-black text-lg text-blue-600 dark:text-blue-400 border-2 border-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                {transportInfo.settings && (
                                                                    <div className="px-4 py-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-xl text-[8px] leading-tight space-y-1.5 border border-blue-200 dark:border-blue-800">
                                                                        {quote.petQuantity > 1 && <div className="font-bold text-blue-600 dark:text-blue-300">+{(quote.petQuantity - 1) * 20}% Pets Adic.</div>}
                                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                                            <span className="text-blue-500 font-black">R$/KM:</span>
                                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-black text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                                                {((transportInfo.settings.kmPriceLeva + transportInfo.settings.kmPriceTraz) / 2).toFixed(2)}
                                                                            </span>
                                                                            <Info size={10} className="text-gray-400" />
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                                            <span className="text-blue-500 font-black">R$/Min:</span>
                                                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-black text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
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

                                                            {/* Botão Incluir */}
                                                            <button
                                                                type="button"
                                                                onClick={handleAddTransportToQuote}
                                                                className="w-full py-3 bg-blue-500 text-white rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                                                            >
                                                                <CheckCircle size={16} /> Incluir no Orçamento
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={isCalculatingTransport}
                                                    onClick={handleCalculateTransport}
                                                    className="relative z-10 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50"
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
                                    )}
                                </section>

                                {/* 4. Itens do Orçamento */}
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-black text-secondary dark:text-white flex items-center gap-3 uppercase tracking-tight">
                                            <div className="w-10 h-10 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center font-black">4</div>
                                            Itens do Orçamento
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => handleAddItem()}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
                                        >
                                            <Plus size={14} /> Adicionar Item
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {quote.items.map((item, idx) => (
                                            <div key={idx} className="group relative flex flex-wrap md:flex-nowrap gap-4 items-end bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-800 hover:bg-white dark:hover:bg-gray-700 transition-all">
                                                <div className="flex-1 min-w-[200px]">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Serviço / Descrição</label>
                                                    <div className="relative">
                                                        {!item.isManual ? (
                                                            <>
                                                                <select
                                                                    value={item.serviceId || item.productId || ''}
                                                                    onChange={e => handleUpdateItem(idx, 'serviceId', e.target.value)}
                                                                    className={`w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black ${(!item.serviceId && !item.productId) ? 'text-gray-300' : 'text-secondary dark:text-white'} outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none`}
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
                                                                    className="w-full bg-blue-50/50 dark:bg-blue-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-xl px-4 py-3 text-xs font-black text-blue-600 dark:text-blue-400 outline-none shadow-sm focus:border-blue-500 transition-all"
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
                                                                                            <p className="text-xs font-black text-secondary dark:text-white group-hover:text-blue-600">{match.name}</p>
                                                                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                                                                                {match.basePrice !== undefined ? '🛠️ Serviço' : '📦 Produto'}
                                                                                                {match.category && ` • ${match.category}`}
                                                                                            </p>
                                                                                        </div>
                                                                                        <span className="text-xs font-black text-blue-500">R$ {(match.price || match.basePrice || 0).toFixed(2)}</span>
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
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Qtd</label>
                                                    <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleUpdateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                                            className="p-3 text-gray-300 hover:text-secondary"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="flex-1 text-center font-black text-secondary dark:text-white text-xs">{item.quantity}</span>
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
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Preço Unit.</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-[10px] font-black">R$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.price ?? ''}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                handleUpdateItem(idx, 'price', val === '' ? 0 : parseFloat(val));
                                                            }}
                                                            className="w-full bg-white dark:bg-gray-800 border-none rounded-xl pl-10 pr-4 py-3 text-xs font-black text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-green-500/20 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}

                                        {quote.items.length === 0 && (
                                            <div className="text-center py-12 bg-gray-50/50 dark:bg-gray-700/50 border-2 border-dashed border-gray-100 dark:border-gray-600 rounded-3xl group hover:border-blue-200 transition-all cursor-pointer" onClick={() => handleAddItem()}>
                                                <div className="w-12 h-12 bg-white dark:bg-gray-600 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-400 mx-auto mb-4 group-hover:text-blue-500 transition-all">
                                                    <Plus size={24} />
                                                </div>
                                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhum item adicionado</p>
                                                <p className="text-[10px] font-bold text-gray-300">Clique para adicionar o primeiro serviço</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Subsessões de Produtos */}
                                    <div className="mt-6 space-y-4">
                                        <h4 className="text-sm font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                            <span className="w-6 h-6 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center text-xs">📦</span>
                                            Produtos Inteligentes (baseados no perfil do pet)
                                        </h4>

                                        {/* Produto de Banho */}
                                        {(() => {
                                            const prodCats = getCategorizedProducts();
                                            return prodCats.banho.length > 0 && (
                                                <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                                    <label className="block text-[9px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest mb-2 ml-1">
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
                                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                                                    <label className="block text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest mb-2 ml-1">
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
                                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-amber-500/20 transition-all"
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
                                                    <label className="block text-[9px] font-black text-purple-700 dark:text-purple-300 uppercase tracking-widest mb-2 ml-1">
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
                                                        className="w-full bg-white dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-xs font-black text-secondary dark:text-white outline-none shadow-sm focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                                <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                                    <h3 className="text-lg font-black text-secondary dark:text-white flex items-center gap-3 uppercase tracking-tight">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">5</div>
                                        Previsão de Atendimento
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data e Hora Prevista</label>
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
                                                    <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
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
                                                        className="w-20 text-center px-3 py-2 bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 rounded-xl font-black text-purple-600 dark:text-purple-400 outline-none focus:border-purple-500 transition-all"
                                                    />
                                                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">%</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 max-w-md">
                                            <AlertTriangle className="text-yellow-600 shrink-0" size={24} />
                                            <p className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400">
                                                <span className="font-black uppercase block mb-1">Nota para o Operador:</span>
                                                Fatores como desembolo (nós) e transporte calculado via Maps serão processados automaticamente ao salvar, podendo alterar o valor total final se não incluídos manualmente.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex flex-col items-end mb-1 space-y-0.5">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total Parcial Estimado</span>
                                                {serviceDiscount > 0 && (
                                                    <span className="text-[10px] font-black text-green-500 uppercase">
                                                        Desc. Recorrência ({customer.recurrenceFrequency}): - R$ {serviceDiscount.toFixed(2)}
                                                    </span>
                                                )}
                                                {productDiscount > 0 && (
                                                    <span className="text-[10px] font-black text-purple-500 uppercase">
                                                        Desc. Estratégico (Produtos): - R$ {productDiscount.toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-4xl font-black text-secondary dark:text-white tabular-nums flex items-baseline gap-1">
                                                <span className="text-lg opacity-30">R$</span> {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Conferência do Orçamento</h2>
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
                                        <h3 className="text-sm font-black text-blue-800 dark:text-blue-200 uppercase mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xs font-black">1</div>
                                            Cliente
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Nome:</span> <span className="font-black text-secondary dark:text-white">{customer.name}</span></div>
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Email:</span> <span className="text-secondary dark:text-white">{customer.email}</span></div>
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Telefone:</span> <span className="text-secondary dark:text-white">{customer.phone || 'Não informado'}</span></div>
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Tipo:</span> <span className={`px-2 py-0.5 rounded text-xs font-black ${customer.type === 'RECORRENTE' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700'}`}>{customer.type}</span></div>
                                            {customer.type === 'RECORRENTE' && (
                                                <div className="col-span-2"><span className="font-bold text-gray-600 dark:text-gray-400">Frequência:</span> <span className="font-black text-purple-600 dark:text-purple-400">{customer.recurrenceFrequency}</span></div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Pet */}
                                    <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                        <h3 className="text-sm font-black text-purple-800 dark:text-purple-200 uppercase mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-purple-500 text-white rounded-lg flex items-center justify-center text-xs font-black">2</div>
                                            Pet
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Nome:</span> <span className="font-black text-secondary dark:text-white">{pet.name}</span></div>
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Espécie:</span> <span className="text-secondary dark:text-white">{pet.species}</span></div>
                                            {pet.breed && <div><span className="font-bold text-gray-600 dark:text-gray-400">Raça:</span> <span className="text-secondary dark:text-white">{pet.breed}</span></div>}
                                            {pet.weight && <div><span className="font-bold text-gray-600 dark:text-gray-400">Peso:</span> <span className="text-secondary dark:text-white">{pet.weight} kg</span></div>}
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Pelagem:</span> <span className="text-secondary dark:text-white">{pet.coatType}</span></div>
                                            <div><span className="font-bold text-gray-600 dark:text-gray-400">Temperamento:</span> <span className="text-secondary dark:text-white">{pet.temperament}</span></div>
                                        </div>
                                    </div>

                                    {/* 3. Serviços SPA */}
                                    {(() => {
                                        const spaItems = allItems.filter(item =>
                                            !item.description?.toLowerCase().includes('transporte') &&
                                            !item.description?.includes('🔄') &&
                                            !item.description?.includes('📦') &&
                                            !item.description?.includes('🏠')
                                        );
                                        const spaSubtotal = spaItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                                        // Desconto de recorrência sobre serviços (Apenas para RECORRENTE)
                                        const recurrenceDiscountAmount = customer.type === 'RECORRENTE' ? spaItems.reduce((acc, item) => {
                                            // Se for serviço (tem serviceId ou é automático sem productId)
                                            if ((item.serviceId || item.isAutomatic) && !item.productId && discountRate > 0) {
                                                return acc + (item.price * item.quantity * discountRate);
                                            }
                                            return acc;
                                        }, 0) : 0;

                                        // Desconto estratégico (Manual - apenas para AVULSO conforme regra do usuário)
                                        const strategicDiscountAmount = customer.type === 'AVULSO' ? spaItems.reduce((acc, item) => {
                                            // Aplica o desconto estratégico no subtotal do SPA para AVULSO
                                            if (strategicDiscount > 0) {
                                                return acc + (item.price * item.quantity * (strategicDiscount / 100));
                                            }
                                            return acc;
                                        }, 0) : 0;

                                        const totalSpaDiscount = recurrenceDiscountAmount + strategicDiscountAmount;
                                        const spaTotal = spaSubtotal - totalSpaDiscount;

                                        if (spaSubtotal === 0) return null;

                                        return (
                                            <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
                                                <h3 className="text-sm font-black text-green-800 dark:text-green-200 uppercase mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center text-xs font-black">3</div>
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
                                                            <div className="text-right">
                                                                <p className="font-black text-sm text-secondary dark:text-white">R$ {(item.price * item.quantity).toFixed(2)}</p>
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
                                                        <span className="font-black text-secondary dark:text-white">R$ {spaSubtotal.toFixed(2)}</span>
                                                    </div>
                                                    {recurrenceDiscountAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-green-600 dark:text-green-400 font-bold">Desconto Recorrência ({(discountRate * 100).toFixed(0)}%):</span>
                                                            <span className="font-black text-green-600 dark:text-green-400">- R$ {recurrenceDiscountAmount.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    {strategicDiscountAmount > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-purple-600 dark:text-purple-400 font-bold">Desconto Produtos ({strategicDiscount}%):</span>
                                                            <span className="font-black text-purple-600 dark:text-purple-400">- R$ {strategicDiscountAmount.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between pt-2 border-t-2 border-green-300 dark:border-green-700">
                                                        <span className="font-black text-green-800 dark:text-green-200 uppercase">Total SPA (com desconto):</span>
                                                        <span className="font-black text-lg text-green-800 dark:text-green-200">R$ {spaTotal.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 4. Serviços de Transporte */}
                                    {(() => {
                                        const transportItems = allItems.filter(item =>
                                            item.description?.toLowerCase().includes('transporte') ||
                                            item.description?.includes('🔄') ||
                                            item.description?.includes('📦') ||
                                            item.description?.includes('🏠')
                                        );
                                        const transportSubtotal = transportItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                                        // Desconto no transporte conforme tipo de cliente
                                        const transportRecurrenceDiscount = customer.type === 'RECORRENTE' ? (transportSubtotal * discountRate) : 0;
                                        const transportStrategicDiscount = customer.type === 'AVULSO' ? (transportSubtotal * (strategicDiscount / 100)) : 0;

                                        // Usar o maior desconto ou o de transporte específico se houver
                                        const transportDiscount = Math.max(
                                            transportRecurrenceDiscount + transportStrategicDiscount,
                                            transportInfo?.discountPercent ? (transportSubtotal * (transportInfo.discountPercent / 100)) : 0
                                        );
                                        const transportTotal = transportSubtotal - transportDiscount;

                                        if (transportSubtotal === 0) return null;

                                        return (
                                            <div className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                                <h3 className="text-sm font-black text-orange-800 dark:text-orange-200 uppercase mb-3 flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-orange-500 text-white rounded-lg flex items-center justify-center text-xs font-black">4</div>
                                                    Serviço Leva & Traz
                                                </h3>

                                                {/* Linha única com valor final */}
                                                <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/40 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-bold text-sm text-orange-800 dark:text-orange-200">Leva e Traz</p>
                                                        <p className="text-[9px] text-gray-500">Valor com desconto aplicado</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-lg text-orange-800 dark:text-orange-200">R$ {transportTotal.toFixed(2)}</p>
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
                                                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">R$ {total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 6. Taxa de Cartão de Crédito */}
                                    <div className="p-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                        <h3 className="text-sm font-black text-indigo-800 dark:text-indigo-200 uppercase mb-3 flex items-center gap-2">
                                            <div className="w-6 h-6 bg-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-black">💳</div>
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
                                                        className="w-24 text-center px-3 py-2 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl font-black text-indigo-600 dark:text-indigo-400 outline-none focus:border-indigo-500 transition-all"
                                                        placeholder="0.0"
                                                    />
                                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">%</span>
                                                </div>
                                            </div>
                                            {creditCardFee > 0 && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1">Valor da Taxa</p>
                                                    <p className="text-xl font-black text-indigo-700 dark:text-indigo-300">+ R$ {(total * (creditCardFee / 100)).toFixed(2)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 7. TOTAL FINAL DO ORÇAMENTO */}
                                    <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl border-4 border-blue-400 shadow-2xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-black text-white uppercase tracking-widest mb-1">VALOR TOTAL FINAL</p>
                                                {creditCardFee > 0 && (
                                                    <p className="text-[10px] text-blue-100">Inclui taxa de cartão ({creditCardFee}%)</p>
                                                )}
                                                {totalDiscount > 0 && (
                                                    <p className="text-[10px] text-green-300 font-bold mt-1">✓ Economizou R$ {totalDiscount.toFixed(2)}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-white drop-shadow-lg">
                                                    R$ {(total + (total * (creditCardFee / 100))).toFixed(2)}
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
                </>
            )}
        </AnimatePresence>
    );
}
