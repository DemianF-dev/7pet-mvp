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

// Modular Components
import QuoteHeader from '../../components/staff/quote-editor/QuoteHeader';
import QuotePricingVariables from '../../components/staff/quote-editor/QuotePricingVariables';
import QuoteItemsSection from '../../components/staff/quote-editor/QuoteItemsSection';
import QuoteTransportCalculator from '../../components/staff/quote-editor/QuoteTransportCalculator';
import QuoteWorkflowSidebar from '../../components/staff/quote-editor/QuoteWorkflowSidebar';

interface QuoteItem {
    id?: string;
    description: string;
    quantity: number;
    price: number;
    serviceId?: string;
    performerId?: string;
    discount?: number; // Desconto em porcentagem (0-100)
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
    const [transportDiscount, setTransportDiscount] = useState(0);

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

        const discountMultiplier = (1 - transportDiscount / 100);
        const price = transportCalculation.total * discountMultiplier;
        let description = `Transporte (${transportType === 'ROUND_TRIP' ? 'Leva e Traz' : transportType === 'PICK_UP' ? 'Busca' : 'Entrega'}) - ${transportCalculation.totalDistance}`;

        if (transportDiscount > 0) {
            description += ` (${transportDiscount}% Desc.)`;
        }

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

        // Deep copy to ensure React detects changes and we don't mutate state directly
        const newCalculation = JSON.parse(JSON.stringify(transportCalculation));
        if (!newCalculation.breakdown[leg]) return;

        // Update the field with the raw input (string)
        newCalculation.breakdown[leg][field] = value;

        // Parsing helper
        const parseValue = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return parseFloat(val.toString().replace(/[^0-9,.]/g, '').replace(',', '.')) || 0;
        };

        // Auto-recalculate price if distance or duration changes
        if (field === 'distance' || field === 'duration') {
            const settings = newCalculation.settings;
            if (settings) {
                // Get rates based on leg
                const suffix = leg.charAt(0).toUpperCase() + leg.slice(1); // Largada, Leva...
                const kmPrice = Number(settings[`kmPrice${suffix}`]) || 0;
                const minPrice = Number(settings[`minPrice${suffix}`]) || 0;
                const handling = Number(settings[`handlingTime${suffix}`]) || 0;

                // We need both dist and dur to calculate.
                const dist = parseValue(newCalculation.breakdown[leg].distance);
                const dur = parseValue(newCalculation.breakdown[leg].duration);

                console.log(`[LegCalc] ${leg}: dist=${dist}, dur=${dur}, kmPrice=${kmPrice}, minPrice=${minPrice}, handling=${handling}`);

                const newPrice = (dist * kmPrice) + ((dur + handling) * minPrice);
                newCalculation.breakdown[leg].price = newPrice.toFixed(2);
            }
        }

        recalculateTotal(newCalculation);
        setTransportCalculation(newCalculation);
    };

    const recalculateTotal = (calc: any) => {
        let total = 0;
        ['largada', 'leva', 'traz', 'retorno'].forEach(leg => {
            if (calc.breakdown[leg]) {
                const price = typeof calc.breakdown[leg].price === 'string'
                    ? parseFloat(calc.breakdown[leg].price)
                    : calc.breakdown[leg].price;
                if (!isNaN(price)) total += price;
            }
        });
        calc.total = total;
    };

    const validateDates = () => {
        if (!desiredAt && !scheduledAt && !transportAt) {
            return window.confirm('ATENÇÃO: Este orçamento não possui nenhuma data ou horário definidos (Previsão, Agendamento ou Transporte). Deseja prosseguir mesmo assim?');
        }
        return true;
    };

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, price: 0 }]);
    };

    const handleApproveAndSchedule = async () => {
        if (!id) return;

        // Pick primary performer if available
        const performerId = items.find(it => it.performerId)?.performerId;

        if (!validateDates()) return;

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

    const totalAmount = items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const discountAmount = item.discount ? (itemTotal * (item.discount / 100)) : 0;
        return sum + (itemTotal - discountAmount);
    }, 0);

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

    const ensureTransportItem = (currentItems: QuoteItem[]) => {
        // If we have a valid transport calculation but no item for it, add/update it automatically
        if (transportCalculation && transportCalculation.total > 0) {
            const hasTransport = currentItems.some(i => i.description.toLowerCase().includes('transporte'));

            if (!hasTransport) {
                const discountMultiplier = (1 - transportDiscount / 100);
                const price = transportCalculation.total * discountMultiplier;
                let description = `Transporte (${transportType === 'ROUND_TRIP' ? 'Leva e Traz' : transportType === 'PICK_UP' ? 'Busca' : 'Entrega'}) - ${transportCalculation.totalDistance}`;

                if (transportDiscount > 0) {
                    description += ` (${transportDiscount}% Desc.)`;
                }

                if (window.confirm(`Foi detectado um cálculo de transporte de R$ ${price.toFixed(2)} que não foi adicionado à lista. Deseja incluir automaticamente?`)) {
                    return [...currentItems, { description, quantity: 1, price, serviceId: undefined }];
                }
            }
        }
        return currentItems;
    };

    const handleSave = async (silent = false) => {
        if (!silent) {
            if (!validateDates()) return;
            if (!window.confirm('Deseja salvar as alterações neste orçamento?')) return;
        }

        setIsSaving(true);
        try {
            // Check for missing transport
            const itemsWithTransport = ensureTransportItem(items);

            // Auto-link items to services by name if missing ID
            const linkedItems = itemsWithTransport.map(item => {
                let currentItem = { ...item };

                // Apply discount to price and description if present
                if (currentItem.discount && currentItem.discount > 0) {
                    const discountFactor = (1 - currentItem.discount / 100);
                    currentItem.price = currentItem.price * discountFactor;
                    if (!currentItem.description.includes('% Desc.')) {
                        currentItem.description = `${currentItem.description} (${currentItem.discount}% Desc.)`;
                    }
                    // Reset local discount to avoid double application if saved again
                    currentItem.discount = 0;
                }

                if (!currentItem.serviceId && currentItem.description) {
                    const match = availableServices.find(s => s.name.toLowerCase() === currentItem.description.toLowerCase());
                    if (match) {
                        console.log(`[QuoteSave] Auto-linked item "${currentItem.description}" to Service ID ${match.id}`);
                        // Assign service ID but let backend validate
                        currentItem.serviceId = match.id;
                        currentItem.performerId = currentItem.performerId || match.responsibleId || undefined;
                    }
                }

                // Remove discount property before sending to backend to avoid schema validation errors
                const { discount, ...cleanItem } = currentItem;
                return cleanItem;
            });

            await api.patch(`/quotes/${id}`, {
                items: linkedItems,
                totalAmount: linkedItems.reduce((acc, it) => acc + (it.price * it.quantity), 0),
                status,
                notes,
                desiredAt: desiredAt ? new Date(desiredAt).toISOString() : undefined,
                scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
                transportAt: transportAt ? new Date(transportAt).toISOString() : undefined
            });

            if (!silent) toast.success('Orçamento salvo com sucesso!');

            if (onUpdate) onUpdate();
            if (onClose && !silent) onClose();
            else fetchQuote(); // Refresh to get persisted data

        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar orçamento');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendToClient = async () => {
        if (!validateDates()) return;
        if (!window.confirm('Isso enviará o orçamento validado para o cliente aprovar. Continuar?')) return;

        setIsSaving(true);
        try {
            // Check for missing transport
            const itemsWithTransport = ensureTransportItem(items);

            // Sanitize items for NaN and ensure correct types
            const sanitizedItems = itemsWithTransport.map(it => {
                let currentItem = { ...it };

                // Apply discount to price and description if present
                if (currentItem.discount && currentItem.discount > 0) {
                    const discountFactor = (1 - currentItem.discount / 100);
                    currentItem.price = currentItem.price * discountFactor;
                    if (!currentItem.description.includes('% Desc.')) {
                        currentItem.description = `${currentItem.description} (${currentItem.discount}% Desc.)`;
                    }
                    currentItem.discount = 0;
                }

                let serviceId = currentItem.serviceId;
                let performerId = currentItem.performerId;

                if (!serviceId && currentItem.description) {
                    const match = availableServices.find(s => s.name.toLowerCase() === currentItem.description.toLowerCase());
                    if (match) {
                        serviceId = match.id;
                        performerId = performerId || match.responsibleId || undefined;
                    }
                }

                // Remove discount property
                const { discount, ...cleanItem } = currentItem;

                return {
                    ...cleanItem,
                    serviceId,
                    performerId,
                    quantity: isNaN(currentItem.quantity) ? 1 : Number(currentItem.quantity),
                    price: isNaN(currentItem.price) ? 0 : Number(currentItem.price)
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

    const content = (
        <>
            <QuoteHeader
                isModal={isModal}
                quoteId={id || ''}
                seqId={quote.seqId}
                status={status}
                customerName={quote.customer.name}
                customerId={quote.customerId}
                onClose={onClose}
                onViewAppointment={async () => {
                    if (quote.appointments && quote.appointments.length > 0) {
                        if (quote.appointments.length === 1) {
                            try {
                                const res = await api.get(`/appointments/${quote.appointments[0].id}`);
                                setViewAppointmentData(res.data);
                                setSelectedAppointmentId(quote.appointments[0].id);
                            } catch (err) {
                                console.error('Erro ao buscar agendamento', err);
                                toast.error('Erro ao carregar agendamento');
                            }
                        } else {
                            setAppointmentSelectionQuote(quote);
                        }
                    }
                }}
                onOpenCustomer={(customerId) => setCustomerModalId(customerId)}
                onShowAuditLog={() => setShowAuditLog(true)}
                onApproveAndSchedule={handleApproveAndSchedule}
                isApprovePending={approveAndScheduleMutation.isPending}
                onSchedule={onSchedule ? () => onSchedule({
                    ...quote,
                    items,
                    notes,
                    desiredAt,
                    scheduledAt,
                    transportAt
                }) : undefined}
                onSave={handleSave}
                onSendToClient={handleSendToClient}
                isSaving={isSaving}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                        <QuotePricingVariables
                            quote={quote}
                            desiredAt={desiredAt}
                            setDesiredAt={setDesiredAt}
                            scheduledAt={scheduledAt}
                            setScheduledAt={setScheduledAt}
                            transportAt={transportAt}
                            setTransportAt={setTransportAt}
                        />
                    </section>

                    <QuoteItemsSection
                        items={items}
                        onAddItem={handleAddItem}
                        onRemoveItem={handleRemoveItem}
                        onItemChange={handleItemChange}
                        serviceSearch={serviceSearch}
                        setServiceSearch={setServiceSearch}
                        showServiceDropdown={showServiceDropdown}
                        setShowServiceDropdown={setShowServiceDropdown}
                        getFilteredServices={getFilteredServices}
                        staffUsers={staffUsers}
                        totalAmount={totalAmount}
                    />

                    {(quote?.type === 'SPA_TRANSPORTE' || quote?.type === 'TRANSPORTE') && (
                        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                            <QuoteTransportCalculator
                                transportType={transportType}
                                setTransportType={setTransportType}
                                transportAddress={transportAddress}
                                setTransportAddress={setTransportAddress}
                                hasDifferentReturnAddress={hasDifferentReturnAddress}
                                setHasDifferentReturnAddress={setHasDifferentReturnAddress}
                                transportDestinationAddress={transportDestinationAddress}
                                setTransportDestinationAddress={setTransportDestinationAddress}
                                onCalculate={handleCalculateTransport}
                                isCalculating={isCalculatingTransport}
                                calculation={transportCalculation}
                                onLegChange={handleLegChange}
                                discount={transportDiscount}
                                setDiscount={setTransportDiscount}
                                onApply={handleApplyTransport}
                            />
                        </section>
                    )}

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

                <div className="space-y-8">
                    <QuoteWorkflowSidebar
                        status={status}
                        setStatus={setStatus}
                    />
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
