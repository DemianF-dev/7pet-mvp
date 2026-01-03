import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Save,
    Trash2,
    Plus,
    CheckCircle2,
    Send,
    Calculator,
    AlertCircle,
    User,
    Dog,
    ChevronLeft,
    History,
    CalendarDays,
    Calendar,
    X,
    RefreshCcw,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';
import AuditLogModal from '../../components/AuditLogModal';
import CustomerDetailsModal from '../../components/staff/CustomerDetailsModal';
import AppointmentDetailsModal from '../../components/staff/AppointmentDetailsModal';
import { useAuthStore } from '../../store/authStore';
import { getQuoteStatusColor } from '../../utils/statusColors';
import { useApproveAndSchedule } from '../../hooks/useQuotes';

interface QuoteItem {
    id?: string;
    description: string;
    quantity: number;
    price: number;
    serviceId?: string;
    performerId?: string;
}

interface Quote {
    id: string;
    customerId: string;
    customer: { name: string; email: string; phone?: string };
    status: string;
    totalAmount: number;
    createdAt: string;
    seqId?: number;
    items: QuoteItem[];
    petId?: string;
    pet?: {
        name: string;
        species: string;
        breed: string;
        weight?: number;
        coatType?: string;
        temperament?: string;
        age?: string;
        observations?: string;
        healthIssues?: string;
        allergies?: string;
        hasKnots?: boolean;
        hasMattedFur?: boolean;
    };
    desiredAt?: string;
    scheduledAt?: string;
    transportAt?: string;
    notes?: string;
    type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';
    transportPeriod?: 'MANHA' | 'TARDE' | 'NOITE';
    transportOrigin?: string;
    transportDestination?: string;
    hasKnots?: boolean;
    knotRegions?: string;
    hairLength?: string;
    hasParasites?: boolean;
    appointments?: {
        id: string;
        startAt: string;
        status: string;
        category: string;
    }[];
}

interface QuoteEditorProps {
    quoteId?: string;
    onClose?: () => void;
    onUpdate?: () => void;
    onSchedule?: (quoteData: any) => void;
}

export default function QuoteEditor({ quoteId, onClose, onUpdate, onSchedule }: QuoteEditorProps = {}) {
    const { id: paramId } = useParams();
    const id = quoteId || paramId;
    const navigate = useNavigate();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [items, setItems] = useState<QuoteItem[]>([]);
    const [customerModalId, setCustomerModalId] = useState<string | null>(null);
    const [status, setStatus] = useState('');
    const [notes, setNotes] = useState('');
    const [desiredAt, setDesiredAt] = useState('');
    const [scheduledAt, setScheduledAt] = useState('');
    const [transportAt, setTransportAt] = useState('');
    const [showAuditLog, setShowAuditLog] = useState(false);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [serviceSearch, setServiceSearch] = useState<{ [key: number]: string }>({});
    const [showServiceDropdown, setShowServiceDropdown] = useState<{ [key: number]: boolean }>({});
    const [staffUsers, setStaffUsers] = useState<any[]>([]);
    const { user } = useAuthStore();
    const approveAndScheduleMutation = useApproveAndSchedule();

    // Appointment View/Selection State
    const [appointmentSelectionQuote, setAppointmentSelectionQuote] = useState<Quote | null>(null);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [viewAppointmentData, setViewAppointmentData] = useState<any>(null);

    // Transport Calculation State
    const [transportAddress, setTransportAddress] = useState('');
    const [transportDestinationAddress, setTransportDestinationAddress] = useState('');
    const [hasDifferentReturnAddress, setHasDifferentReturnAddress] = useState(false);
    const [transportType, setTransportType] = useState<'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF'>('ROUND_TRIP');
    const [transportCalculation, setTransportCalculation] = useState<any | null>(null);
    const [isCalculatingTransport, setIsCalculatingTransport] = useState(false);

    const isModal = !!quoteId;

    useEffect(() => {
        if (id) fetchQuote();
        fetchServices();
    }, [id]);

    const fetchServices = async () => {
        try {
            console.log('[AUTOCOMPLETE] Buscando serviços...');
            const [servicesRes, usersRes] = await Promise.all([
                api.get('/services'),
                api.get('/management/users')
            ]);
            console.log('[AUTOCOMPLETE] Serviços carregados:', servicesRes.data.length);
            setAvailableServices(servicesRes.data);
            setStaffUsers((usersRes.data || []).filter((u: any) =>
                u && ['OPERACIONAL', 'GESTAO', 'ADMIN', 'SPA', 'MASTER'].includes(u.role)
            ));
        } catch (error) {
            console.error('[AUTOCOMPLETE] Erro ao buscar serviços/usuários:', error);
        }
    };

    const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            console.error('Date error', e);
        }
        return '';
    };

    const fetchQuote = async () => {
        try {
            const response = await api.get(`/quotes/${id}`);
            const q = response.data;
            setQuote(q);
            setItems(q.items);
            setStatus(q.status);
            setNotes(q.notes || '');

            // Initialize transport address if available
            if (q.transportOrigin) {
                setTransportAddress(q.transportOrigin);
            }

            if (q.desiredAt) {
                const date = new Date(q.desiredAt);
                date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
                setDesiredAt(formatDateForInput(q.desiredAt));
            }
            if (q.scheduledAt) {
                setScheduledAt(formatDateForInput(q.scheduledAt));
            }
            if (q.transportAt) {
                setTransportAt(formatDateForInput(q.transportAt));
            }
        } catch (error) {
            console.error('Erro ao buscar orçamento:', error);
            toast.error('Erro ao carregar orçamento');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCalculateTransport = async () => {
        if (!transportAddress.trim()) {
            toast.error('Por favor, insira o endereço de origem');
            return;
        }

        setIsCalculatingTransport(true);
        try {
            const response = await api.post(`/quotes/${id}/calculate-transport`, {
                address: transportAddress,
                destinationAddress: hasDifferentReturnAddress ? transportDestinationAddress : undefined,
                type: transportType
            });
            setTransportCalculation(response.data);
            toast.success('Transporte calculado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao calcular transporte:', error);
            const message = error.response?.data?.details || error.response?.data?.error || 'Erro ao calcular transporte';
            toast.error(message);
        } finally {
            setIsCalculatingTransport(false);
        }
    };

    const handleApplyTransport = () => {
        if (!transportCalculation) return;

        const description = `Transporte (Leva e Traz) - ${transportCalculation.totalDistance}`;
        const price = transportCalculation.total;

        // Check if item already exists
        const existingIndex = items.findIndex(i => i.description.toLowerCase().includes('transporte'));

        let newItems = [...items];
        if (existingIndex >= 0) {
            if (window.confirm('Já existe um item de transporte. Deseja atualizar o valor?')) {
                newItems[existingIndex] = { ...newItems[existingIndex], price, description, quantity: 1 };
            } else {
                return;
            }
        } else {
            newItems.push({ description, quantity: 1, price });
        }

        setItems(newItems);
        toast.success('Valor do transporte aplicado aos itens!');
    };

    const handleLegChange = (leg: string, field: string, value: string) => {
        if (!transportCalculation) return;

        const newCalculation = { ...transportCalculation };
        if (!newCalculation.breakdown[leg]) return;

        // Allow editing
        newCalculation.breakdown[leg][field] = value;

        // Auto-recalculate price if distance or duration changes
        if (field === 'distance' || field === 'duration') {
            const settings = transportCalculation.settings;
            if (settings) {
                // Parse values (remove km, min, replace comma)
                const numericVal = parseFloat(value.replace(/[^0-9,.]/g, '').replace(',', '.'));

                if (!isNaN(numericVal)) {
                    // Get rates based on leg
                    const suffix = leg.charAt(0).toUpperCase() + leg.slice(1); // Largada, Leva...
                    const kmPrice = settings[`kmPrice${suffix}`] || 0;
                    const minPrice = settings[`minPrice${suffix}`] || 0;
                    const handling = settings[`handlingTime${suffix}`] || 0;

                    // We need both dist and dur to calculate. 
                    // If we are editing distance, we use curr duration.
                    let dist = field === 'distance' ? numericVal : parseFloat(newCalculation.breakdown[leg].distance.replace(/[^0-9,.]/g, '').replace(',', '.'));
                    let dur = field === 'duration' ? numericVal : parseFloat(newCalculation.breakdown[leg].duration.replace(/[^0-9,.]/g, '').replace(',', '.'));

                    if (!isNaN(dist) && !isNaN(dur)) {
                        // Formula: (Dist * KmPrice) + ((Dur + Handling) * MinPrice)
                        const newPrice = (dist * kmPrice) + ((dur + handling) * minPrice);
                        newCalculation.breakdown[leg].price = newPrice.toFixed(2);
                    }
                }
            }
        }

        recalculateTotal(newCalculation);
        setTransportCalculation(newCalculation);
    };

    const recalculateTotal = (calc: any) => {
        let total = 0;
        ['largada', 'leva', 'traz', 'retorno'].forEach(leg => {
            if (calc.breakdown[leg]) {
                const price = typeof calc.breakdown[leg].price === 'string' ? parseFloat(calc.breakdown[leg].price) : calc.breakdown[leg].price;
                if (!isNaN(price)) total += price;
            }
        });
        calc.total = total;
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, price: 0 }]);
    };

    const handleApproveAndSchedule = async () => {
        if (!id) return;

        // Pick primary performer if available
        const performerId = items.find(it => it.performerId)?.performerId;

        if (!window.confirm('Deseja Aprovar e Agendar este orçamento automaticamente? Isso criará agendamentos confirmados e notificará o cliente.')) return;

        approveAndScheduleMutation.mutate({
            quoteId: id,
            performerId
        }, {
            onSuccess: () => {
                navigate('/staff/quotes');
            }
        });
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const getFilteredServices = (searchTerm: string) => {
        console.log('[AUTOCOMPLETE] getFilteredServices chamado:', {
            searchTerm,
            hasQuote: !!quote,
            hasPet: !!quote?.pet,
            petSpecies: quote?.pet?.species,
            totalServices: availableServices.length
        });

        if (!searchTerm) {
            console.log('[AUTOCOMPLETE] Sem termo de busca');
            return [];
        }

        // Permitir busca mesmo sem pet associado
        if (!quote?.pet) {
            console.log('[AUTOCOMPLETE] Sem pet, mostrando todos');
            const results = availableServices.filter(service =>
                service.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 8);
            console.log('[AUTOCOMPLETE] Resultados sem filtro de espécie:', results.length);
            return results;
        }

        const petSpecies = quote.pet.species;
        const results = availableServices.filter(service => {
            const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSpecies = service.species === petSpecies || service.species === 'Ambos';
            return matchesSearch && matchesSpecies;
        }).slice(0, 8);

        console.log('[AUTOCOMPLETE] Resultados filtrados para', petSpecies, ':', results.length);
        return results;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.service-dropdown-container')) {
                setShowServiceDropdown({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = async (silent = false) => {
        if (!silent && !window.confirm('Deseja salvar as alterações neste orçamento?')) return;

        setIsSaving(true);
        try {
            // Auto-link items to services by name if missing ID
            const linkedItems = items.map(item => {
                if (!item.serviceId && item.description) {
                    const match = availableServices.find(s => s.name.toLowerCase() === item.description.toLowerCase());
                    if (match) {
                        console.log(`[QuoteSave] Auto-linked item "${item.description}" to Service ID ${match.id}`);
                        return { ...item, serviceId: match.id, performerId: item.performerId || match.responsibleId || undefined };
                    }
                }
                return item;
            });

            await api.patch(`/quotes/${id}`, {
                items: linkedItems,
                totalAmount,
                status,
                notes,
                desiredAt: desiredAt ? new Date(desiredAt).toISOString() : undefined,
                scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                transportAt: transportAt ? new Date(transportAt).toISOString() : undefined
            });
            if (!silent) toast.success('Orçamento salvo com sucesso!');

            if (onUpdate) onUpdate();
            if (onClose && !silent) onClose(); // Only close if explicit save, maybe? Or keep open? User preference usually is "Save & Close". I'll close.
            else fetchQuote();

        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar orçamento');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToClient = async () => {
        if (!window.confirm('Isso enviará o orçamento validado para o cliente aprovar. Continuar?')) return;

        setIsSaving(true);
        try {
            // Sanitize items for NaN and ensure correct types
            // Sanitize items for NaN and ensure correct types
            const sanitizedItems = items.map(it => {
                // Auto-link logic for Send action too
                let serviceId = it.serviceId;
                let performerId = it.performerId;

                if (!serviceId && it.description) {
                    const match = availableServices.find(s => s.name.toLowerCase() === it.description.toLowerCase());
                    if (match) {
                        serviceId = match.id;
                        performerId = performerId || match.responsibleId || undefined;
                    }
                }

                return {
                    ...it,
                    serviceId,
                    performerId,
                    quantity: isNaN(it.quantity) ? 1 : Number(it.quantity),
                    price: isNaN(it.price) ? 0 : Number(it.price)
                };
            });

            // Primeiro salva as alterações
            await api.patch(`/quotes/${id}`, {
                items: sanitizedItems,
                totalAmount: sanitizedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0),
                status: 'ENVIADO',
                notes,
                desiredAt: desiredAt ? new Date(desiredAt).toISOString() : undefined,
                scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                transportAt: transportAt ? new Date(transportAt).toISOString() : undefined
            });
            toast.success('Orçamento enviado ao cliente!');

            if (onUpdate) onUpdate();
            if (onClose) onClose();
            else navigate('/staff/quotes');

        } catch (error) {
            console.error('Erro ao enviar:', error);
            toast.error('Erro ao enviar orçamento');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center ${isModal ? 'h-[400px]' : 'min-h-screen bg-gray-50'}`}>
                <Calculator className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!quote) return null;

    const content = (
        <>
            {/* Header Novo - Estrutura Superior */}
            <header className="mb-10 bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>

                {!isModal && (
                    <div className="mb-6">
                        <Breadcrumbs />
                    </div>
                )}
                <div className="relative z-10 flex flex-col gap-8">
                    {/* Topo: Cliente, ID e Ações Rápidas */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            {!isModal && <BackButton className="" />}
                            {isModal && (
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
                                    <ChevronLeft size={24} className="text-secondary" />
                                </button>
                            )}
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        OR-{String(quote.seqId || 0).padStart(4, '0')}
                                    </span>
                                    {quote.status === 'AGENDADO' && quote.appointments && quote.appointments.length > 0 ? (
                                        <button
                                            onClick={async () => {
                                                if (quote.appointments!.length === 1) {
                                                    try {
                                                        const res = await api.get(`/appointments/${quote.appointments![0].id}`);
                                                        setViewAppointmentData(res.data);
                                                        setSelectedAppointmentId(quote.appointments![0].id);
                                                    } catch (err) {
                                                        console.error('Erro ao buscar agendamento', err);
                                                        toast.error('Erro ao carregar agendamento');
                                                    }
                                                } else {
                                                    setAppointmentSelectionQuote(quote);
                                                }
                                            }}
                                            className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest hover:ring-2 hover:ring-offset-1 hover:ring-green-500 transition-all cursor-pointer ${getQuoteStatusColor(quote.status)}`}
                                        >
                                            {quote.status}
                                        </button>
                                    ) : (
                                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${getQuoteStatusColor(quote.status)}`}>
                                            {quote.status}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-3xl font-black text-secondary mt-2">
                                    {quote.customer.name}
                                </h1>
                                <button
                                    onClick={() => setCustomerModalId(quote.customerId)}
                                    className="text-xs font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1 mt-1"
                                >
                                    <User size={12} /> Ver ficha completa do cliente
                                </button>
                                <button
                                    onClick={() => setShowAuditLog(true)}
                                    className="text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1 mt-1"
                                >
                                    <History size={12} /> Ver histórico de alterações
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {(quote.status !== 'AGENDADO' && quote.status !== 'ENCERRADO' && quote.status !== 'APROVADO') && (
                                <button
                                    onClick={handleApproveAndSchedule}
                                    disabled={approveAndScheduleMutation.isPending}
                                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {approveAndScheduleMutation.isPending ? (
                                        <RefreshCcw size={16} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={16} />
                                    )}
                                    Aprovar & Agendar
                                </button>
                            )}
                            {quote.status === 'APROVADO' && onSchedule && (
                                <button
                                    onClick={() => onSchedule({
                                        ...quote,
                                        items,
                                        notes,
                                        desiredAt,
                                        scheduledAt,
                                        transportAt
                                    })}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                                >
                                    <Calendar size={16} /> Agendar Agora
                                </button>
                            )}
                            <button
                                onClick={() => handleSave()}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-2xl shadow-sm border border-gray-200 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
                            >
                                <Save size={16} /> Salvar Alterações
                            </button>
                            <button
                                onClick={handleSendToClient}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
                            >
                                <Send size={16} /> Validar & Enviar
                            </button>
                        </div>
                    </div>

                    {/* Grid de Detalhes Variáveis de Custo */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-secondary font-black text-sm uppercase tracking-widest">
                            <Calculator size={16} className="text-primary" />
                            Variáveis de Precificação
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {/* Pet Básico */}
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pet</p>
                                <div className="flex items-center gap-2">
                                    <Dog size={16} className="text-gray-400" />
                                    <span className="font-black text-secondary">{quote.pet?.name || 'N/A'}</span>
                                    <span className="text-xs text-gray-400">({quote.pet?.breed || 'SRD'} - {quote.pet?.age || 'Idade N/A'})</span>
                                </div>
                                {quote.pet?.observations && (
                                    <p className="text-xs text-red-400 mt-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                        ⚠️ Obs: {quote.pet.observations}
                                    </p>
                                )}
                            </div>

                            {/* Pelagem & Nós */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
                                <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 rounded-bl-2xl -mr-1 -mt-1 group-hover:bg-blue-100 transition-colors"></div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Pelagem</p>
                                <p className="font-bold text-secondary text-sm">{quote.hairLength || quote.pet?.coatType || 'Não inf.'}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {quote.hasKnots ? (
                                        <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">Com Nós</span>
                                    ) : (
                                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-black rounded uppercase">Sem Nós</span>
                                    )}
                                    {quote.knotRegions && <span className="text-[9px] text-gray-400 block w-full truncate" title={quote.knotRegions}>{quote.knotRegions}</span>}
                                </div>
                            </div>

                            {/* Peso & Porte */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Peso/Porte</p>
                                <p className="font-bold text-secondary text-sm">{quote.pet?.weight ? `${quote.pet.weight} kg` : 'N/A'}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{quote.pet?.weight && quote.pet.weight < 10 ? 'Pequeno' : quote.pet?.weight && quote.pet.weight < 25 ? 'Médio' : 'Grande'}</p>
                            </div>

                            {/* Transporte */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Transporte</p>
                                {quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE' ? (
                                    <>
                                        <p className="font-bold text-secondary text-sm">Leva e Traz</p>
                                        <p className="text-[10px] text-purple-500 font-black mt-1 uppercase">{quote.transportPeriod || 'Período N/A'}</p>
                                    </>
                                ) : (
                                    <p className="font-bold text-gray-400 text-sm">Próprio Meio</p>
                                )}
                            </div>

                            {/* Saúde/Vermes */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Saúde</p>
                                {quote.hasParasites || (quote.pet?.healthIssues && quote.pet.healthIssues.toLowerCase().includes('pulga')) ? (
                                    <p className="font-bold text-red-500 text-sm flex items-center gap-1"><AlertCircle size={12} /> Parasitas</p>
                                ) : (
                                    <p className="font-bold text-green-500 text-sm flex items-center gap-1"><CheckCircle2 size={12} /> Sem observações</p>
                                )}
                                <p className="text-[9px] text-gray-400 mt-1">Vacinas: Verif. Carteira</p>
                            </div>

                            {/* Temperamento */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                                <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2">Temperamento</p>
                                <p className="font-bold text-secondary text-sm">{quote.pet?.temperament || 'Não inf.'}</p>
                            </div>

                            {/* Datas e Horários */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm col-span-2 md:col-span-3 lg:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Preferência do Cliente */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle size={10} className="text-orange-400" />
                                        Preferência Cliente
                                    </p>
                                    <input
                                        type="datetime-local"
                                        value={desiredAt}
                                        onChange={(e) => setDesiredAt(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                {/* Sugestão SPA */}
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <CalendarDays size={10} />
                                        Sugestão SPA (Operador)
                                    </p>
                                    <input
                                        type="datetime-local"
                                        value={scheduledAt}
                                        onChange={(e) => setScheduledAt(e.target.value)}
                                        className="w-full bg-primary/5 border-none rounded-xl text-xs font-bold text-primary focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                {/* Sugestão Transporte */}
                                {(quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE') && (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                            <Calculator size={10} />
                                            Sugestão Transp. (Operador)
                                        </p>
                                        <input
                                            type="datetime-local"
                                            value={transportAt}
                                            onChange={(e) => setTransportAt(e.target.value)}
                                            className="w-full bg-purple-50 border-none rounded-xl text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-200"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-secondary">Itens e Serviços</h3>
                            <button
                                onClick={handleAddItem}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-all text-sm"
                            >
                                <Plus size={16} /> Adicionar Item
                            </button>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 relative group"
                                >
                                    <div className="md:col-span-4 relative service-dropdown-container">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Descrição / Serviço</label>
                                        <input
                                            type="text"
                                            value={serviceSearch[index] !== undefined ? serviceSearch[index] : item.description}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                console.log('[AUTOCOMPLETE] Input onChange:', value);
                                                setServiceSearch({ ...serviceSearch, [index]: value });
                                                handleItemChange(index, 'description', value);
                                                const shouldShow = value.length > 0;
                                                console.log('[AUTOCOMPLETE] Definindo dropdown visível:', shouldShow);
                                                setShowServiceDropdown({ ...showServiceDropdown, [index]: shouldShow });
                                            }}
                                            onFocus={() => {
                                                const currentValue = serviceSearch[index] !== undefined ? serviceSearch[index] : item.description;
                                                if (currentValue && currentValue.length > 0) {
                                                    setShowServiceDropdown({ ...showServiceDropdown, [index]: true });
                                                }
                                            }}
                                            className="w-full bg-white border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                            placeholder="Digite para buscar serviços..."
                                        />

                                        {/* Dropdown de Serviços */}
                                        {showServiceDropdown[index] && (
                                            <div className="absolute z-[9999] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                                {getFilteredServices(serviceSearch[index] || item.description).length > 0 ? (
                                                    getFilteredServices(serviceSearch[index] || item.description).map(service => (
                                                        <button
                                                            key={service.id}
                                                            type="button"
                                                            onClick={() => {
                                                                handleItemChange(index, 'description', service.name);
                                                                handleItemChange(index, 'price', service.basePrice);
                                                                handleItemChange(index, 'serviceId', service.id);
                                                                handleItemChange(index, 'performerId', service.responsibleId || '');
                                                                setServiceSearch({ ...serviceSearch, [index]: service.name });
                                                                setShowServiceDropdown({ ...showServiceDropdown, [index]: false });
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">{service.name}</p>
                                                                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-2">
                                                                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded-md">{service.species}</span>
                                                                    {service.category && <span className="text-primary/60">{service.category}</span>}
                                                                </p>
                                                            </div>
                                                            <span className="text-sm font-black text-primary ml-4 whitespace-nowrap">
                                                                R$ {service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center">
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Nenhum serviço encontrado</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Profissional Responsável</label>
                                        <select
                                            value={item.performerId || ''}
                                            onChange={(e) => handleItemChange(index, 'performerId', e.target.value)}
                                            className="w-full bg-white border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                        >
                                            <option value="">Nenhum (Rotativo)</option>
                                            {(staffUsers || []).map(u => u && (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Qtd</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                            className="w-full bg-white border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-center"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-2">Preço Unit.</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs font-serif">R$</span>
                                            <input
                                                type="number"
                                                value={item.price}
                                                step="0.01"
                                                onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                                                className="w-full bg-white border-transparent rounded-2xl pl-12 pr-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-1 flex items-end justify-center pb-2">
                                        <button
                                            onClick={() => handleRemoveItem(index)}
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}

                            {items.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-[32px] text-gray-400 italic">
                                    Nenhum item adicionado.
                                </div>
                            )}
                        </div>

                        {/* Transport Calculation Section */}
                        {(quote?.type === 'SPA_TRANSPORTE' || quote?.type === 'TRANSPORTE') && (
                            <div className="mt-10 pt-8 border-t border-gray-100">
                                <h3 className="text-lg font-black text-secondary mb-4 flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                                        <Calculator size={20} />
                                    </div>
                                    Cálculo de Transporte (Leva e Traz)
                                </h3>

                                <div className="bg-purple-50 p-6 rounded-[32px] border border-purple-100">

                                    {/* Transport Type Selector */}
                                    <div className="flex flex-wrap gap-4 mb-6">
                                        <button
                                            onClick={() => setTransportType('ROUND_TRIP')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${transportType === 'ROUND_TRIP' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-gray-500 border-transparent hover:bg-purple-50 hover:text-purple-600'}`}
                                        >
                                            Leva e Traz (Completo)
                                        </button>
                                        <button
                                            onClick={() => setTransportType('PICK_UP')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${transportType === 'PICK_UP' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-gray-500 border-transparent hover:bg-purple-50 hover:text-purple-600'}`}
                                        >
                                            Apenas Busca (Ida)
                                        </button>
                                        <button
                                            onClick={() => setTransportType('DROP_OFF')}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${transportType === 'DROP_OFF' ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white text-gray-500 border-transparent hover:bg-purple-50 hover:text-purple-600'}`}
                                        >
                                            Apenas Entrega (Volta)
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-4 mb-6">
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2 px-2">Endereço de Busca (Origem)</label>
                                                <input
                                                    type="text"
                                                    value={transportAddress}
                                                    onChange={(e) => setTransportAddress(e.target.value)}
                                                    className="w-full bg-white border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-200 transition-all text-purple-900"
                                                    placeholder="Endereço onde o pet está..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 px-2">
                                            <input
                                                type="checkbox"
                                                id="diffAddress"
                                                checked={hasDifferentReturnAddress}
                                                onChange={(e) => setHasDifferentReturnAddress(e.target.checked)}
                                                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300"
                                            />
                                            <label htmlFor="diffAddress" className="text-xs font-bold text-gray-500 cursor-pointer select-none">Entrega em endereço diferente?</label>
                                        </div>

                                        {hasDifferentReturnAddress && (
                                            <div className="flex-1 animate-in fade-in slide-in-from-top-2">
                                                <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2 px-2">Endereço de Entrega (Destino)</label>
                                                <input
                                                    type="text"
                                                    value={transportDestinationAddress}
                                                    onChange={(e) => setTransportDestinationAddress(e.target.value)}
                                                    className="w-full bg-white border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-200 transition-all text-purple-900"
                                                    placeholder="Endereço para onde o pet vai..."
                                                />
                                            </div>
                                        )}

                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={handleCalculateTransport}
                                                disabled={isCalculatingTransport}
                                                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                                            >
                                                {isCalculatingTransport ? (
                                                    <RefreshCcw size={18} className="animate-spin" />
                                                ) : (
                                                    <Calculator size={18} />
                                                )}
                                                {isCalculatingTransport ? 'Calculando...' : 'Calcular Transporte'}
                                            </button>
                                        </div>
                                    </div>

                                    {transportCalculation && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="bg-white rounded-3xl border border-purple-100 overflow-hidden shadow-sm">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-purple-50/50 text-[10px] uppercase font-black text-purple-400 tracking-widest">
                                                        <tr>
                                                            <th className="px-6 py-4 border-b border-purple-100">Etapa</th>
                                                            <th className="px-6 py-4 border-b border-purple-100">Distância</th>
                                                            <th className="px-6 py-4 border-b border-purple-100">Tempo</th>
                                                            <th className="px-6 py-4 text-right border-b border-purple-100">Valor (R$)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {['largada', 'leva', 'traz', 'retorno'].map((leg: any) => {
                                                            const legData = transportCalculation.breakdown[leg];
                                                            if (!legData) return null;

                                                            const labels: any = {
                                                                largada: { title: 'Largada', sub: 'Base → Origem' },
                                                                leva: { title: 'Leva', sub: 'Origem → Base' },
                                                                traz: { title: 'Traz', sub: 'Base → Destino' },
                                                                retorno: { title: 'Retorno', sub: 'Destino → Base' }
                                                            };

                                                            return (
                                                                <tr key={leg} className="group hover:bg-purple-50/30 transition-colors">
                                                                    <td className="px-6 py-4">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-gray-700">{labels[leg].title}</span>
                                                                            <span className="text-[10px] text-gray-400">{labels[leg].sub}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <input
                                                                            type="text"
                                                                            value={legData.distance}
                                                                            onChange={(e) => handleLegChange(leg, 'distance', e.target.value)}
                                                                            className="w-24 bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-purple-200 transition-all"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <input
                                                                            type="text"
                                                                            value={legData.duration}
                                                                            onChange={(e) => handleLegChange(leg, 'duration', e.target.value)}
                                                                            className="w-24 bg-gray-50 border-none rounded-lg text-xs font-bold text-gray-600 focus:ring-2 focus:ring-purple-200 transition-all"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={legData.price}
                                                                            onChange={(e) => handleLegChange(leg, 'price', e.target.value)}
                                                                            className="w-28 text-right bg-white border border-gray-200 rounded-lg text-sm font-black text-purple-600 focus:ring-2 focus:ring-purple-200 transition-all"
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot className="bg-purple-50 border-t border-purple-100">
                                                        <tr>
                                                            <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-500 text-xs uppercase tracking-widest">Total Estimado</td>
                                                            <td className="px-6 py-4 text-right font-black text-xl text-purple-700">
                                                                R$ {transportCalculation.total.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td colSpan={4} className="px-6 pb-6 text-right">
                                                                <button
                                                                    onClick={handleApplyTransport}
                                                                    className="px-6 py-2 bg-green-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ml-auto"
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                    Aplicar ao Orçamento
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        const newItem = {
                                                            description: `Serviço de Transporte (${transportType === 'ROUND_TRIP' ? 'Leva e Traz' : transportType === 'PICK_UP' ? 'Busca' : 'Entrega'})`,
                                                            quantity: 1,
                                                            price: transportCalculation.total,
                                                            serviceId: 'transport-calculated'
                                                        };
                                                        setItems([...items, newItem]);
                                                        setTransportCalculation(null); // Clear after adding
                                                        toast.success('Transporte adicionado ao orçamento!');
                                                    }}
                                                    className="px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/20 flex items-center gap-2"
                                                >
                                                    <Plus size={20} />
                                                    Adicionar ao Orçamento
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-10 pt-8 border-t border-gray-100 flex justify-between items-center px-4">
                            <span className="text-lg font-bold text-secondary">Valor Total Calculado</span>
                            <div className="text-right">
                                <span className="text-3xl font-black text-primary">R$ {totalAmount.toFixed(2)}</span>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1">Este valor será enviado ao cliente</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                        <h3 className="text-xl font-black text-secondary mb-6">Observações Internas</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full bg-gray-50 border-transparent rounded-3xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                            placeholder="Notas que apenas a equipe pode ver..."
                        />
                    </section>
                </div>

                {/* Sidebar Status (Right side) - Reduced content since most moved to header */}
                <div className="space-y-8">
                    <section className="bg-secondary text-white rounded-[40px] p-8 shadow-xl">
                        <h3 className="text-lg font-black mb-6 uppercase tracking-widest text-primary">Status do Workflow</h3>

                        <div className="space-y-3">
                            {['SOLICITADO', 'EM_PRODUCAO', 'CALCULADO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'AGENDAR', 'AGENDADO', 'ENCERRADO'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatus(s)}
                                    className={`w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between ${status === s ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    {s}
                                    {status === s && <CheckCircle2 size={16} />}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );

    const auditModal = (
        <AnimatePresence>
            {showAuditLog && (
                <AuditLogModal
                    entityType="Quote"
                    entityId={id || ''}
                    onClose={() => setShowAuditLog(false)}
                    isAdmin={user?.role === 'ADMIN' || user?.role === 'MASTER'}
                    onRollback={() => {
                        fetchQuote(); // Refresh data after rollback
                        if (onUpdate) onUpdate();
                    }}
                />
            )}
        </AnimatePresence>
    );

    const customerModal = (
        <CustomerDetailsModal
            isOpen={!!customerModalId}
            onClose={() => setCustomerModalId(null)}
            customerId={customerModalId || ''}
        />
    );

    const appointmentDetailsModal = (
        <AppointmentDetailsModal
            isOpen={!!selectedAppointmentId}
            onClose={() => setSelectedAppointmentId(null)}
            onSuccess={() => fetchQuote()}
            appointment={viewAppointmentData}
            onModify={() => { }}
            onCopy={() => { }}
            onOpenCustomer={(customerId) => setCustomerModalId(customerId)}
        />
    );

    const appointmentSelectionModal = (
        <AnimatePresence>
            {appointmentSelectionQuote && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[40px] p-8 w-full max-w-lg shadow-2xl relative"
                    >
                        <button
                            onClick={() => setAppointmentSelectionQuote(null)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400"
                        >
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-black text-secondary mb-2">Selecionar Agendamento</h2>
                        <p className="text-gray-400 font-medium mb-8">Esta solicitação gerou múltiplos agendamentos. Qual você deseja visualizar?</p>

                        <div className="grid grid-cols-1 gap-4">
                            {Object.values(
                                (appointmentSelectionQuote.appointments || []).reduce((acc: any, curr) => {
                                    const existing = acc[curr.category || 'UNK'];
                                    if (!existing) {
                                        acc[curr.category || 'UNK'] = curr;
                                    } else {
                                        const score = (s: string) => s === 'CONFIRMADO' ? 3 : (s === 'PENDENTE' || s === 'AGENDADO') ? 2 : 1;
                                        const currScore = score(curr.status);
                                        const existingScore = score(existing.status);

                                        if (currScore > existingScore) {
                                            acc[curr.category || 'UNK'] = curr;
                                        } else if (currScore === existingScore) {
                                            if (new Date(curr.startAt || 0) > new Date(existing.startAt || 0)) {
                                                acc[curr.category || 'UNK'] = curr;
                                            }
                                        }
                                    }
                                    return acc;
                                }, {})
                            ).map((appt: any) => (
                                <button
                                    key={appt.id}
                                    onClick={async () => {
                                        try {
                                            const res = await api.get(`/appointments/${appt.id}`);
                                            setViewAppointmentData(res.data);
                                            setSelectedAppointmentId(appt.id);
                                            setAppointmentSelectionQuote(null);
                                        } catch (err) {
                                            console.error('Erro ao buscar agendamento', err);
                                            toast.error('Erro ao carregar detalhes do agendamento');
                                        }
                                    }}
                                    className="flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed border-gray-100 hover:border-primary hover:bg-primary/5 transition-all group text-left"
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${appt.category === 'LOGISTICA' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Calendar size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-exrabold text-secondary text-lg group-hover:text-primary transition-colors font-black">
                                            {appt.category === 'LOGISTICA' ? 'Transporte / Logística' : 'Banho & Tosa (SPA)'}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getQuoteStatusColor(appt.status)}`}>
                                                {appt.status}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400">
                                                {new Date(appt.startAt!).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (isModal) {
        return (
            <div className="bg-gray-50 h-full overflow-y-auto px-6 py-6 rounded-[40px] shadow-none">
                {content}
                {auditModal}
                {customerModal}
                {appointmentDetailsModal}
                {appointmentSelectionModal}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />
            <main className="flex-1 md:ml-64 p-6 md:p-10">
                {content}
                {auditModal}
                {customerModal}
                {appointmentDetailsModal}
                {appointmentSelectionModal}
            </main>
        </div>
    );
}
