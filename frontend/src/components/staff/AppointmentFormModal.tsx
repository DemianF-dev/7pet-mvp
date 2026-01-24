import { useState, useEffect } from 'react';
import { X, Search, User, Dog, Calendar, Clock, MapPin, Save, Copy, CheckCircle, Layout, CalendarDays, PlusCircle, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PastDateConfirmModal from '../PastDateConfirmModal';

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
        scheduledAt?: string;
        transportAt?: string;
        desiredAt?: string;
        category?: 'SPA' | 'LOGISTICA' | 'SPA_TRANSPORTE';
        transportOrigin?: string;
        transportDestination?: string;
        transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
    };
}

export default function AppointmentFormModal({ isOpen, onClose, onSuccess, appointment, isCopy, preFill }: ModalProps) {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState<any[]>([]);
    const [showSuccessState, setShowSuccessState] = useState(false);
    const [pets, setPets] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);

    // DEBUG: Log props on render
    console.log('AppointmentFormModal RENDER', { isOpen, hasPreFill: !!preFill, preFillData: preFill });

    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [staffUsers, setStaffUsers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        customerId: '',
        petId: '',
        serviceIds: [] as string[],
        startAt: '',
        logisticStartAt: '',
        performerId: '',
        agendaSPA: false,
        agendaLogistica: false,
        transport: {
            origin: '',
            destination: '7Pet',
            requestedPeriod: 'MANHA' as 'MANHA' | 'TARDE' | 'NOITE'
        },
        pickupProviderId: '',
        dropoffProviderId: '',
        transportSamePerformer: true // Novo estado para toggle
    });

    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // ⚠️ NOVO: Estados para validação de data passada
    const [showPastDateModal, setShowPastDateModal] = useState(false);
    const [pendingSubmitData, setPendingSubmitData] = useState<any>(null);

    // 1. Fetch Basic Data on Mount/Open
    useEffect(() => {
        if (isOpen) {
            // ALWAYS fetch when modal opens to ensure fresh data (especially services)
            fetchBasicData();
        }
    }, [isOpen]);

    // 2. Fetch Specific Customer for Pre-fill if needed
    useEffect(() => {
        if (isOpen && preFill?.customerId && customers.length > 0) {
            const loaded = (customers || []).find(c => c?.id === preFill.customerId);
            if (!loaded) {
                // Fetch individually
                api.get(`/customers/${preFill.customerId}`)
                    .then(res => {
                        if (res.data) {
                            setCustomers(prev => [...prev, res.data]);
                        }
                    })
                    .catch(err => console.error('Error fetching specific pre-fill customer:', err));
            }
        }
    }, [isOpen, preFill?.customerId, customers.length]);

    // 3. Initialize Form State from Props (Appointment or PreFill)
    useEffect(() => {
        if (!isOpen) return;

        if (appointment) {
            console.log('Initializing from APPOINTMENT', appointment);
            // const startAt = formatDateForInput(appointment.startAt); // Removed this line

            setFormData({
                customerId: appointment.customerId || '',
                petId: appointment.petId || '',
                serviceIds: (appointment.services || []).map((s: any) => s?.id).filter((id: string) => id),
                startAt: appointment.category === 'SPA' ? formatDateForInput(appointment.startAt) : '',
                logisticStartAt: appointment.category === 'LOGISTICA' ? formatDateForInput(appointment.startAt) : '',
                agendaSPA: appointment.category === 'SPA' || appointment.category === 'SPA_TRANSPORTE',
                agendaLogistica: appointment.category === 'LOGISTICA' || appointment.category === 'SPA_TRANSPORTE',
                performerId: appointment.category === 'SPA' ? (appointment.performerId || '') : '',
                // Logic for logistics provider initialization
                pickupProviderId: appointment.pickupProviderId || (appointment.category === 'LOGISTICA' ? appointment.performerId : '') || '',
                dropoffProviderId: appointment.dropoffProviderId || (appointment.category === 'LOGISTICA' ? appointment.performerId : '') || '',
                transportSamePerformer: (appointment.pickupProviderId === appointment.dropoffProviderId) || (!appointment.pickupProviderId && !appointment.dropoffProviderId),
                transport: appointment.transport ? {
                    origin: appointment.transport.origin || '',
                    destination: appointment.transport.destination || '7Pet',
                    requestedPeriod: appointment.transport.requestedPeriod || 'MANHA'
                } : { origin: '', destination: '7Pet', requestedPeriod: 'MANHA' },
            });
            // We set selectedCustomer in effect #4 based on customerId
        } else if (preFill) {
            console.log('Initializing from PREFILL', preFill);
            console.log('🔍 DEBUG preFill.serviceIds:', preFill.serviceIds);
            console.log('🔍 DEBUG preFill.items:', preFill.items);
            const spaStartAt = formatDateForInput(preFill.scheduledAt || preFill.startAt);
            const logisticStartAt = formatDateForInput(preFill.transportAt || preFill.startAt);

            // Tentar encontrar profissionais específicos nos itens do orçamento
            // O performerId padrão costuma ser o do SPA (primeiro item de serviço)
            const performerId = preFill.items?.find(i => i.performerId && i.serviceId)?.performerId || '';

            // Para o transporte, procuramos itens que podem ser de logística (descrição contém transporte ou performer diferente)
            // Ou simplesmente pegamos o último se houver mais de um e o primeiro for SPA
            const performers = preFill.items?.filter(i => i.performerId).map(i => i.performerId) || [];
            const logisticPerformerId = performers.length > 1 ? performers[performers.length - 1] : (preFill.category === 'LOGISTICA' ? performers[0] : '');

            // Detectar corretamente o tipo de agenda baseado na categoria
            const isSpaTransporte = preFill.category === 'SPA_TRANSPORTE';
            const isTransporte = preFill.category === 'LOGISTICA';
            const isSpa = preFill.category === 'SPA' || isSpaTransporte;
            const hasLogistica = isTransporte || isSpaTransporte;

            setFormData({
                customerId: preFill.customerId || '',
                petId: preFill.petId || '',
                serviceIds: preFill.serviceIds || [],
                startAt: spaStartAt,
                logisticStartAt: logisticStartAt,
                agendaSPA: isSpa,
                agendaLogistica: hasLogistica,
                performerId,
                pickupProviderId: logisticPerformerId || '',
                dropoffProviderId: logisticPerformerId || '',
                transportSamePerformer: true,
                transport: {
                    origin: preFill.transportOrigin || '',
                    destination: preFill.transportDestination || '7Pet',
                    requestedPeriod: preFill.transportPeriod || 'MANHA'
                }
            });

            // FIX: Fetch and set selectedCustomer immediately to avoid empty UI
            // First check if customer is already in the loaded list
            const existingCustomer = (customers || []).find(c => c?.id === preFill.customerId);
            if (existingCustomer) {
                console.log('Setting selectedCustomer from existing list:', existingCustomer.name);
                setSelectedCustomer(existingCustomer);
                setPets(existingCustomer.pets || []);
            } else if (preFill.customerId) {
                // Fetch customer data if not in list
                console.log('Fetching customer for preFill:', preFill.customerId);
                api.get(`/customers/${preFill.customerId}`)
                    .then(res => {
                        if (res.data) {
                            console.log('Loaded customer for preFill:', res.data.name);
                            setSelectedCustomer(res.data);
                            setPets(res.data.pets || []);
                            // Also add to customers list to prevent refetching
                            setCustomers(prev => {
                                const exists = prev.find(c => c?.id === res.data.id);
                                return exists ? prev : [...prev, res.data];
                            });
                        }
                    })
                    .catch(err => console.error('Error fetching pre-fill customer:', err));
            }
        } else {
            // Reset
            setFormData({
                customerId: '',
                petId: '',
                serviceIds: [],
                startAt: '',
                logisticStartAt: '',
                agendaSPA: false,
                agendaLogistica: false,
                performerId: '',
                transport: { origin: '', destination: '7Pet', requestedPeriod: 'MANHA' },
                pickupProviderId: '',
                dropoffProviderId: '',
                transportSamePerformer: true
            });
            setSelectedCustomer(null);
            setPets([]);
        }
    }, [isOpen, appointment, preFill]);

    // 4. Sync Customer Object and Pets when customerId changes or customers list updates
    useEffect(() => {
        if (!isOpen || !formData.customerId) {
            if (!formData.customerId) {
                setSelectedCustomer(null);
                setPets([]);
            }
            return;
        }

        const found = (customers || []).find(c => c?.id === formData.customerId);
        if (found) {
            // Only update if actually different to prevent loops
            if (found.id !== selectedCustomer?.id) {
                console.log('Syncing Customer & Pets for:', found.name);
                setSelectedCustomer(found);
                setPets(found.pets || []);

                // If petId is set but not in list (rare), it might be valid but we just loaded pets. 
                // We trust the form state's petId usually.
            }
        }
    }, [isOpen, formData.customerId, customers, selectedCustomer?.id]);

    // 5. Intelligent Matching: If preFill has items without serviceIds, try to match by name
    useEffect(() => {
        if (!isOpen || !preFill || services.length === 0) return;

        // Check for items that don't have IDs but match a service name
        const itemsWithoutId = preFill.items?.filter(i => !i.serviceId) || [];
        if (itemsWithoutId.length === 0) return;

        const matchedIds: string[] = [];
        itemsWithoutId.forEach(item => {
            const match = services.find(s => s.name.toLowerCase() === item.description.toLowerCase());
            if (match) {
                matchedIds.push(match.id);
            }
        });

        if (matchedIds.length > 0) {
            console.log('[ApptModal] Auto-matched services from Quote items:', matchedIds);
            setFormData(prev => {
                const unique = Array.from(new Set([...prev.serviceIds, ...matchedIds]));
                if (unique.length !== prev.serviceIds.length) {
                    return { ...prev, serviceIds: unique };
                }
                return prev;
            });
        }
    }, [isOpen, preFill, services]);


    // Helpers
    const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) {
            console.log('🔍 formatDateForInput: received empty/null dateStr');
            return '';
        }
        try {
            console.log('🔍 formatDateForInput: raw input =', dateStr);
            const date = new Date(dateStr);

            if (isNaN(date.getTime())) {
                console.error('🔍 formatDateForInput: Invalid Date object created from', dateStr);
                return '';
            }

            // Format to YYYY-MM-DDTHH:mm
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');

            const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
            console.log('🔍 formatDateForInput: result =', formatted);
            return formatted;
        } catch (e) {
            console.error('🔍 formatDateForInput error:', e);
        }
        return '';
    };

    const fetchBasicData = async () => {
        try {
            setIsLoading(true);

            // Using individual try-catches or separate awaits to prevent one failure from blocking others
            // Especially important because /management/users might be restricted for some roles
            const customersPromise = api.get('/customers').catch(e => { console.error('Error fetching customers:', e); return { data: [] }; });
            const servicesPromise = api.get('/services').catch(e => { console.error('Error fetching services:', e); return { data: [] }; });
            const usersPromise = api.get('/management/users').catch(e => { console.error('Error fetching users:', e); return { data: [] }; });

            const [custRes, servRes, usersRes] = await Promise.all([
                customersPromise,
                servicesPromise,
                usersPromise
            ]);

            setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data.data || []));
            setServices(Array.isArray(servRes.data) ? servRes.data : (servRes.data.data || []));
            setStaffUsers(Array.isArray(usersRes.data) ? usersRes.data.filter((u: any) => ['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER'].includes(u.role)) : []);
        } catch (error) {
            console.error('Erro ao buscar dados iniciais:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectCustomer = (customer: any) => {
        if (!customer) return;
        setSelectedCustomer(customer);
        setFormData(prev => ({ ...prev, customerId: customer.id || '', petId: '' }));
        // Effect #4 will handle pets, but setting immediately is also fine for responsiveness
        setPets(customer.pets || []);
        setSearchQuery('');
    };

    // ⚠️ NOVO: Handler para confirmar agendamento no passado
    const handleConfirmPastDate = async () => {
        setShowPastDateModal(false);
        if (!pendingSubmitData) return;

        setIsLoading(true);
        try {
            // Reenviar cada agendamento com flag de override
            for (const appointmentData of pendingSubmitData) {
                const dataWithOverride = {
                    ...appointmentData,
                    overridePastDateCheck: true // Flag que permite agendamento no passado
                };
                await api.post('/appointments', dataWithOverride);
            }
            onSuccess();
            setShowSuccessState(true);
            setPendingSubmitData(null);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao processar agendamento');
            setPendingSubmitData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação: Cliente e Pet são obrigatórios
        if (!formData.customerId) {
            alert('Por favor, selecione um cliente.');
            return;
        }
        if (!formData.petId) {
            alert('Por favor, selecione um pet.');
            return;
        }

        // Validação: pelo menos uma agenda deve estar selecionada
        if (!formData.agendaSPA && !formData.agendaLogistica) {
            alert('Selecione pelo menos uma agenda de destino (SPA ou Logística)');
            return;
        }

        const msg = isCopy ? 'Deseja criar este novo agendamento por cópia?' : appointment ? 'Deseja salvar as alterações neste agendamento?' : 'Confirmar novo agendamento?';
        if (!window.confirm(msg)) return;
        setIsLoading(true);
        try {
            // Se editando um appointment existente, apenas atualiza
            if (appointment && !isCopy) {
                // Para edição, usar a primeira agenda selecionada
                const category = formData.agendaSPA ? 'SPA' : 'LOGISTICA';
                const data = {
                    ...formData,
                    startAt: appointment.category === 'LOGISTICA' ? formData.logisticStartAt : formData.startAt,
                    performerId: (appointment.category === 'LOGISTICA')
                        ? (formData.pickupProviderId || undefined) // Leva as primary performer for logistics
                        : (formData.performerId || undefined),
                    pickupProviderId: formData.pickupProviderId || undefined,
                    dropoffProviderId: formData.dropoffProviderId || undefined,
                    category,
                    transport: formData.agendaLogistica ? formData.transport : undefined
                };
                await api.patch(`/appointments/${appointment.id}`, data);
            } else {
                // Criação de novos appointments
                const appointmentsToCreate = [];

                if (formData.agendaSPA) {
                    // Fitrar apenas serviços que NÃO são de logística para a agenda SPA
                    const spaServiceIds = formData.serviceIds.filter(id => {
                        const s = services.find(serv => serv.id === id);
                        return !s?.category || s.category.toUpperCase() !== 'LOGISTICA';
                    });

                    appointmentsToCreate.push({
                        customerId: formData.customerId,
                        petId: formData.petId,
                        serviceIds: spaServiceIds,
                        performerId: formData.performerId, // Profissional do SPA
                        startAt: formData.startAt, // Horário do SPA
                        category: 'SPA',
                        quoteId: preFill?.quoteId
                    });
                }

                if (formData.agendaLogistica) {
                    // Filtrar apenas serviços de logística para a agenda Logística
                    const logServiceIds = formData.serviceIds.filter(id => {
                        const s = services.find(serv => serv.id === id);
                        return s?.category && s.category.toUpperCase() === 'LOGISTICA';
                    });

                    appointmentsToCreate.push({
                        customerId: formData.customerId,
                        petId: formData.petId,
                        serviceIds: logServiceIds,
                        performerId: formData.pickupProviderId || formData.performerId, // Use Pickup as main Performer
                        pickupProviderId: formData.pickupProviderId || undefined,
                        dropoffProviderId: formData.dropoffProviderId || undefined,
                        startAt: formData.logisticStartAt || formData.startAt, // Horário da Logística
                        category: 'LOGISTICA',
                        transport: formData.transport,
                        quoteId: preFill?.quoteId
                    });
                }

                // Criar todos os appointments individualmente para maior controle
                for (const appointmentData of appointmentsToCreate) {
                    try {
                        const cleanedData = {
                            ...appointmentData,
                            performerId: appointmentData.performerId || undefined,
                            serviceIds: appointmentData.serviceIds?.filter((id: string) => id) || []
                        };
                        await api.post('/appointments', cleanedData);
                    } catch (err: any) {
                        console.error(`Erro ao criar agendamento ${appointmentData.category}:`, err);
                        // Se for um erro de conflito mas o primeiro já foi criado, podemos avisar
                        if (err.response?.status === 400 && err.response?.data?.error?.includes('conflito')) {
                            console.warn('Conflito detectado, mas continuando para o próximo...');
                        } else {
                            throw err; // Re-throw se for um erro crítico
                        }
                    }
                }
            }
            onSuccess();
            setShowSuccessState(true);
        } catch (error: any) {
            // ⚠️ TRATAMENTO ESPECIAL: Data no passado
            if (error.response?.data?.code === 'PAST_DATE_WARNING') {
                // Salvar dados para reenvio após confirmação
                const appointmentsToCreate = [];

                if (formData.agendaSPA) {
                    const spaServiceIds = formData.serviceIds.filter(id => {
                        const s = services.find(serv => serv.id === id);
                        return !s?.category || s.category.toUpperCase() !== 'LOGISTICA';
                    });

                    appointmentsToCreate.push({
                        customerId: formData.customerId,
                        petId: formData.petId,
                        serviceIds: spaServiceIds,
                        performerId: formData.performerId,
                        startAt: formData.startAt,
                        category: 'SPA',
                        quoteId: preFill?.quoteId
                    });
                }

                if (formData.agendaLogistica) {
                    const logServiceIds = formData.serviceIds.filter(id => {
                        const s = services.find(serv => serv.id === id);
                        return s?.category && s.category.toUpperCase() === 'LOGISTICA';
                    });

                    appointmentsToCreate.push({
                        customerId: formData.customerId,
                        petId: formData.petId,
                        serviceIds: logServiceIds,
                        performerId: formData.pickupProviderId || formData.performerId,
                        pickupProviderId: formData.pickupProviderId || undefined,
                        dropoffProviderId: formData.dropoffProviderId || undefined,
                        startAt: formData.logisticStartAt || formData.startAt,
                        category: 'LOGISTICA',
                        transport: formData.transport,
                        quoteId: preFill?.quoteId
                    });
                }

                setPendingSubmitData(appointmentsToCreate);
                setShowPastDateModal(true);
                setIsLoading(false);
                return; // Não mostra erro ainda, aguarda confirmação
            }

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

                {showSuccessState ? (
                    <div className="p-10 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 shadow-inner">
                            <CheckCircle size={56} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-secondary">Agendamento Realizado!</h3>
                            <p className="text-gray-400 font-medium mt-2">O compromisso foi registrado com sucesso na agenda.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                            <button
                                onClick={() => {
                                    onClose();
                                    setShowSuccessState(false);
                                    const path = formData.agendaLogistica ? '/staff/transport' : '/staff/kanban';
                                    navigate(path);
                                }}
                                className="flex items-center justify-center gap-3 p-5 bg-secondary text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-secondary/20"
                            >
                                <CalendarDays size={20} /> Ver Agenda
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessState(false);
                                    setFormData({
                                        customerId: '',
                                        petId: '',
                                        serviceIds: [],
                                        startAt: '',
                                        logisticStartAt: '',
                                        agendaSPA: false,
                                        agendaLogistica: false,
                                        performerId: '',
                                        pickupProviderId: '',
                                        dropoffProviderId: '',
                                        transportSamePerformer: true,
                                        transport: { origin: '', destination: '7Pet', requestedPeriod: 'MANHA' }
                                    });
                                    setSelectedCustomer(null);
                                }}
                                className="flex items-center justify-center gap-3 p-5 bg-primary text-white rounded-[24px] font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                <PlusCircle size={20} /> Novo Agendamento
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                onClose();
                                setShowSuccessState(false);
                            }}
                            className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-secondary transition-colors pt-4"
                        >
                            Fechar Janela
                        </button>
                    </div>
                ) : (
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
                                                {(filteredCustomers || []).map(c => c && (
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
                                            {selectedCustomer?.name ? selectedCustomer.name[0] : 'C'}
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
                                    {(pets || []).map(p => p && (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                                    <Calendar size={16} /> Serviços
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-2xl bg-gray-50/50">
                                    {isLoading && services.length === 0 ? (
                                        <div className="p-8 flex flex-col items-center justify-center space-y-2">
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Carregando...</span>
                                        </div>
                                    ) : (
                                        // Filter services logic: If preFill exists, only show matched services. Else show all.
                                        (services || [])
                                            .filter(s => !preFill?.quoteId || formData.serviceIds.includes(s.id))
                                            .length === 0 ? (
                                            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                                <p className="text-xs font-medium text-gray-400">
                                                    Este agendamento está restrito aos itens do orçamento.
                                                </p>
                                                <p className="text-[10px] text-gray-300 mt-1">
                                                    Para adicionar outros serviços, edite o orçamento primeiro.
                                                </p>
                                            </div>
                                        ) : (services || [])
                                            .filter(s => !preFill?.quoteId || formData.serviceIds.includes(s.id))
                                            .map(s => s && (
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
                                                            // Only allow unchecked if not forced by quote (though UI hides others, unchecking is allowed but maybe we should warn?)
                                                            // For now, allow unchecking existing ones but since we hide others, they can't add new ones.
                                                            // This matches the user request "only pull services from quote".
                                                            const current = formData.serviceIds;
                                                            if (e.target.checked) {
                                                                // logic...
                                                                const newServiceIds = [...current, s.id];
                                                                const updates: any = { serviceIds: newServiceIds };
                                                                if (!formData.performerId && s.responsibleId) {
                                                                    updates.performerId = s.responsibleId;
                                                                }
                                                                setFormData({ ...formData, ...updates });
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
                                            ))
                                    )}
                                </div>
                            </div>

                            {/* Professional Selection - SPA */}
                            {formData.agendaSPA && (
                                <div className="space-y-3 md:col-span-2 pt-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-bold text-primary uppercase flex items-center gap-2">
                                        <User size={16} /> Responsável SPA
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, performerId: '' })}
                                            className={`p-3 rounded-2xl border text-left transition-all ${!formData.performerId ? 'bg-primary/5 border-primary/30 shadow-md ring-2 ring-primary/10' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                                        >
                                            <div className="text-xs font-black text-gray-400 uppercase mb-1">Rotativo</div>
                                            <div className={`font-bold text-sm ${!formData.performerId ? 'text-primary' : 'text-gray-400'}`}>Ninguém fixo</div>
                                        </button>
                                        {(staffUsers || [])
                                            .filter(u => u.isEligible !== false && u.division === 'SPA')
                                            .map(u => u && (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, performerId: u.id })}
                                                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${formData.performerId === u.id ? 'bg-white border-transparent shadow-xl ring-2 ring-primary/20' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}
                                                    style={formData.performerId === u.id ? { borderLeft: `6px solid ${u.color || '#3B82F6'}` } : {}}
                                                >
                                                    <div className="text-[10px] font-black text-gray-400 uppercase mb-0.5">{u.role}</div>
                                                    <div className={`font-bold text-sm truncate ${formData.performerId === u.id ? 'text-secondary' : 'text-gray-400'}`}>{u.name}</div>
                                                    {formData.performerId === u.id && (
                                                        <div className="absolute top-2 right-2 text-primary">
                                                            <CheckCircle size={14} />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Professional Selection - Logística */}
                            {formData.agendaLogistica && (
                                <div className="space-y-6 md:col-span-2 pt-2 animate-in slide-in-from-top-2 duration-300">

                                    {/* Header logic */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-orange-500 uppercase flex items-center gap-2">
                                            <Truck size={16} /> Responsáveis Logística (Leva & Traz)
                                        </label>

                                        <label className="flex items-center gap-2 cursor-pointer bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                className="rounded text-orange-500 focus:ring-orange-500"
                                                checked={formData.transportSamePerformer}
                                                onChange={(e) => {
                                                    const isSame = e.target.checked;
                                                    setFormData({
                                                        ...formData,
                                                        transportSamePerformer: isSame,
                                                        dropoffProviderId: isSame ? formData.pickupProviderId : formData.dropoffProviderId
                                                    });
                                                }}
                                            />
                                            <span className="text-xs font-bold text-orange-700">Mesmo Motorista</span>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-orange-50/30 rounded-[32px] border border-orange-100">
                                        {/* LEVA */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-500" /> Motorista LEVA (Coleta)
                                            </label>
                                            <select
                                                required
                                                value={formData.pickupProviderId}
                                                onChange={(e) => {
                                                    const newVal = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        pickupProviderId: newVal,
                                                        // Sync if toggle is ON
                                                        dropoffProviderId: prev.transportSamePerformer ? newVal : prev.dropoffProviderId
                                                    }));
                                                }}
                                                className="w-full bg-white border-white rounded-xl px-4 py-3 text-sm font-bold text-secondary focus:ring-2 focus:ring-orange-500/20 shadow-sm"
                                            >
                                                <option value="">Selecione o Motorista...</option>
                                                {(staffUsers || [])
                                                    .filter(u => u.isEligible !== false && (u.division === 'LOGISTICA' || u.division === 'OPERACIONAL'))
                                                    .map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>

                                        {/* TRAZ */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-orange-600/60 uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" /> Motorista TRAZ (Entrega)
                                            </label>
                                            <select
                                                required
                                                disabled={formData.transportSamePerformer}
                                                value={formData.dropoffProviderId}
                                                onChange={(e) => setFormData({ ...formData, dropoffProviderId: e.target.value })}
                                                className={`w-full border-white rounded-xl px-4 py-3 text-sm font-bold shadow-sm transition-all
                                                    ${formData.transportSamePerformer
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                                                        : 'bg-white text-secondary focus:ring-2 focus:ring-orange-500/20'}`}
                                            >
                                                <option value="">{formData.transportSamePerformer ? '(Mesmo do Leva)' : 'Selecione o Motorista...'}</option>
                                                {(staffUsers || [])
                                                    .filter(u => u.isEligible !== false && (u.division === 'LOGISTICA' || u.division === 'OPERACIONAL'))
                                                    .map(u => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Removed the single "Data e Horário" input */}

                        {/* Data e Hora SPA */}
                        {formData.agendaSPA && (
                            <div>
                                <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-2 px-1">
                                    Data/Hora SPA (Início do Serviço)
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    <input
                                        type="datetime-local"
                                        required
                                        step="900"
                                        value={formData.startAt}
                                        onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Data e Hora Logística */}
                        {formData.agendaLogistica && (
                            <div>
                                <label className="block text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] mb-2 px-1">
                                    Data/Hora Logística (Coleta na Casa)
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    <input
                                        type="datetime-local"
                                        required
                                        step="900"
                                        value={formData.logisticStartAt || formData.startAt}
                                        onChange={(e) => setFormData({ ...formData, logisticStartAt: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-4 text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2">
                                <Layout size={16} /> Agendas de Destino
                            </label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:bg-gray-50 bg-white">
                                    <input
                                        type="checkbox"
                                        checked={formData.agendaSPA}
                                        onChange={(e) => setFormData({ ...formData, agendaSPA: e.target.checked })}
                                        className="w-5 h-5 text-primary rounded focus:ring-primary accent-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-secondary">Agenda SPA</div>
                                        <div className="text-xs text-gray-400">Serviços de banho, tosa e estética</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all hover:bg-gray-50 bg-white">
                                    <input
                                        type="checkbox"
                                        checked={formData.agendaLogistica}
                                        onChange={(e) => setFormData({ ...formData, agendaLogistica: e.target.checked })}
                                        className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 accent-orange-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-secondary">Agenda Logística</div>
                                        <div className="text-xs text-gray-400">Transporte (Leva e Traz)</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Transport Fields - shown when Logística is selected */}
                        <AnimatePresence>
                            {formData.agendaLogistica && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="bg-gray-50 p-6 rounded-3xl space-y-4 border border-gray-100">
                                        <h4 className="text-sm font-bold text-secondary flex items-center gap-2">
                                            <MapPin size={16} className="text-orange-500" />
                                            Detalhes do Transporte
                                        </h4>
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
                                                {['MANHA', 'TARDE', 'NOITE'].map(period => (
                                                    <button
                                                        key={period}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, transport: { ...formData.transport, requestedPeriod: period as any } })}
                                                        className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${formData.transport.requestedPeriod === period ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-400 border-gray-100'}`}
                                                    >
                                                        {period === 'MANHA' ? 'Manhã' : period === 'TARDE' ? 'Tarde' : 'Noite'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
                )}
            </motion.div>

            {/* ⚠️ NOVO: Modal de Confirmação de Data Passada */}
            <PastDateConfirmModal
                isOpen={showPastDateModal}
                appointmentDate={
                    pendingSubmitData && pendingSubmitData[0]?.startAt
                        ? new Date(pendingSubmitData[0].startAt).toISOString()
                        : new Date().toISOString()
                }
                onConfirm={handleConfirmPastDate}
                onCancel={() => {
                    setShowPastDateModal(false);
                    setPendingSubmitData(null);
                }}
            />
        </div>
    );
}
