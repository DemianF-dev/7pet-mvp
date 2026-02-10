import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Calculator, Calendar, Save, ArrowRightLeft, ArrowRight, ArrowLeft, Plus, Star, X, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import RoutePresetSelector from './RoutePresetSelector';
import TransportRecurrenceWizard from './TransportRecurrenceWizard';
import CustomerDetailsModal from '../CustomerDetailsModal';
import AppointmentDetailsModal from '../AppointmentDetailsModal';

interface TransportOnlyEditorProps {
    quote: any;
    onUpdate: () => void;
    readOnly?: boolean;
    onSchedule: (occurrences?: any[]) => Promise<void>;
}

const TransportOnlyEditor: React.FC<TransportOnlyEditorProps> = ({ quote, onUpdate, readOnly = false, onSchedule }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [calculation, setCalculation] = useState<any>(null);

    // Local state for editing fields before save
    const [transportType, setTransportType] = useState<any>(quote.transportType || 'ROUND_TRIP');
    const [origin, setOrigin] = useState(quote.transportOrigin || '');
    const [destination, setDestination] = useState(quote.transportDestination || '7Pet');
    const [stops, setStops] = useState<string[]>([]);

    // Recurrence
    const [isRecurring, setIsRecurring] = useState(quote.isRecurring || false);
    const [frequency, setFrequency] = useState(quote.recurrenceFrequency || quote.frequency || 'SEMANAL');
    const [defaultLevaTime, setDefaultLevaTime] = useState('08:00');
    const [defaultTrazTime, setDefaultTrazTime] = useState('17:00');
    const [transportDaysPerWeek, setTransportDaysPerWeek] = useState<number>(quote.transportWeeklyFrequency || 1);
    const [transportDays, setTransportDays] = useState<string[]>(quote.metadata?.transportDays || []);
    const [notes, setNotes] = useState(quote.notes || '');

    // Modal States for Related Appointments
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [viewAppointmentData, setViewAppointmentData] = useState<any>(null);
    const [customerModalId, setCustomerModalId] = useState<string | null>(null);

    // TL1/TL2 Logic
    const [destinationIsThePet, setDestinationIsThePet] = useState(true);

    // UI States
    const [showPresets, setShowPresets] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
    const [undoReason, setUndoReason] = useState('');
    const [isUndoing, setIsUndoing] = useState(false);

    useEffect(() => {
        setTransportType(quote.transportType || 'ROUND_TRIP');
        setOrigin(quote.transportOrigin || '');

        const dest = quote.transportDestination || '7Pet';
        setDestination(dest);
        setDestinationIsThePet(dest === '7Pet');

        setIsRecurring(quote.isRecurring || false);
        setFrequency(quote.recurrenceFrequency || quote.frequency || 'SEMANAL');
        setTransportDaysPerWeek(quote.transportWeeklyFrequency || 1);
        setTransportDays(quote.metadata?.transportDays || []);
        setStops(quote.metadata?.transportStops || []);

        if (quote.metadata?.transportSnapshot) {
            setCalculation(quote.metadata.transportSnapshot);
        }

        // Extrair horários padrão do orçamento para o Wizard
        if (quote.transportLevaAt) {
            const levaDate = new Date(quote.transportLevaAt);
            if (!isNaN(levaDate.getTime())) {
                const h = String(levaDate.getHours()).padStart(2, '0');
                const m = String(levaDate.getMinutes()).padStart(2, '0');
                setDefaultLevaTime(`${h}:${m}`);
            }
        }
        if (quote.transportTrazAt) {
            const trazDate = new Date(quote.transportTrazAt);
            if (!isNaN(trazDate.getTime())) {
                const h = String(trazDate.getHours()).padStart(2, '0');
                const m = String(trazDate.getMinutes()).padStart(2, '0');
                setDefaultTrazTime(`${h}:${m}`);
            }
        }
        setNotes(quote.notes || '');
    }, [quote]);

    const getTransportDiscountRate = (days: number) => {
        if (!isRecurring) return 0;
        if (days >= 5) return 0.10; // 10% para 5-6 dias
        if (days >= 3) return 0.07; // 7% para 3-4 dias
        return 0.05; // 5% para 1-2 dias
    };

    const handleSave = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);

            await api.patch(`/quotes/${quote.id}`, {
                transportType,
                transportOrigin: origin,
                transportDestination: destination,
                isRecurring,
                recurrenceFrequency: isRecurring ? frequency : null,
                transportWeeklyFrequency: isRecurring ? transportDaysPerWeek : null,
                transportDiscountPercent: getTransportDiscountRate(transportDaysPerWeek) * 100,
                notes,
                metadata: {
                    ...quote.metadata,
                    transportDays
                }
            });

            if (!silent) toast.success('Alterações salvas');
            onUpdate();
        } catch (error) {
            console.error(error);
            if (!silent) toast.error('Erro ao salvar');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const handleCalculate = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.post('/quotes/transport/estimate', {
                type: transportType,
                origin,
                destination,
                stops
            });

            setCalculation(data);

            await api.patch(`/quotes/${quote.id}`, {
                totalAmount: data.total,
                metadata: {
                    ...quote.metadata,
                    transportSnapshot: data
                }
            });

            toast.success('Cálculo realizado e salvo!');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao calcular transporte');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyPreset = (preset: any) => {
        setTransportType(preset.type);
        setOrigin(preset.origin || '');
        setDestination(preset.destination || '7Pet');
        // stops...
        toast.success(`Rota "${preset.name}" aplicada!`);
    };

    const handleSavePreset = async () => {
        const name = prompt("Nome para este favorito (ex: Casa da Mãe):");
        if (!name) return;

        try {
            await api.post('/quotes/transport/presets', {
                customerId: quote.customerId,
                petId: quote.petId,
                name,
                type: transportType,
                origin,
                destination,
                stops
            });
            toast.success('Rota salva nos favoritos!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar favorito');
        }
    };

    const handleScheduleClick = async () => {
        // Save first ensuring backend is synced
        await handleSave(true);

        if (isRecurring) {
            setShowWizard(true);
        } else {
            if (window.confirm('Confirma o agendamento desta viagem?')) {
                onSchedule(); // Call generic schedule for single trip
            }
        }
    };

    const handleUndoSchedule = async () => {
        if (!undoReason.trim()) {
            toast.error('Informe uma justificativa para desfazer o agendamento.');
            return;
        }

        setIsUndoing(true);
        try {
            const { data: updatedQuote } = await api.post(`/quotes/${quote.id}/undo-schedule`, {
                reason: undoReason
            });

            toast.success('Agendamentos removidos e status revertido para APROVADO');
            setIsUndoModalOpen(false);
            setUndoReason('');
            
            // Wait a moment for DB consistency before refreshing
            setTimeout(() => {
                onUpdate();
            }, 500);
        } catch (error: any) {
            console.error('Erro ao desfazer agendamento:', error);
            toast.error(error.response?.data?.error || 'Erro ao desfazer agendamento');
        } finally {
            setIsUndoing(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Title */}
            <div className="flex items-center gap-3 pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                    <Truck size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transporte Exclusivo</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie rotas, motoristas e agendamentos de transporte.</p>
                </div>
                {!readOnly && (
                    <div className="ml-auto flex gap-3">
                        {quote.status === 'AGENDADO' && (
                            <button
                                onClick={() => setIsUndoModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 transition-all text-xs"
                            >
                                <RefreshCcw size={14} /> Desfazer Agendamentos
                            </button>
                        )}
                        <button
                            onClick={() => handleSave()}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 disabled:opacity-50 text-xs"
                        >
                            <Save size={16} /> Salvar Alterações
                        </button>
                    </div>
                )}
            </div>

            {/* Section 1: Client & Recurrence */}
            <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">1. Cliente e Frequência</h3>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Cliente</label>
                        <div className="text-lg font-bold text-gray-800 dark:text-white p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                            {quote.customer?.name}
                            <span className="text-gray-400 font-normal text-sm ml-2">({quote.pet?.name})</span>
                        </div>
                    </div>

                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 mb-2 block">Tipo de Agendamento</label>
                        <div className="flex gap-4">
                            <div className="flex flex-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                <button
                                    onClick={() => { setIsRecurring(false); setFrequency('SEMANAL'); }}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                        !isRecurring ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Avulso
                                </button>
                                <button
                                    onClick={() => setIsRecurring(true)}
                                    className={cn(
                                        "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                                        isRecurring ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Recorrente
                                </button>
                            </div>

                            {isRecurring && (
                                <select
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="px-4 bg-gray-50 dark:bg-gray-900 border-transparent rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/50 outline-none"
                                >
                                    <option value="SEMANAL">Semanal (1x/s)</option>
                                    <option value="QUINZENAL">Quinzenal (15d)</option>
                                    <option value="MENSAL">Mensal (1x/m)</option>
                                </select>
                            )}
                        </div>

                        {/* NOVO: Dias por Semana e Quais Dias (Apenas para Transporte Recorrente) */}
                        {isRecurring && (
                            <div className="mt-6 space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2 block">Quantos dias na semana?</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setTransportDaysPerWeek(num)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                                                    transportDaysPerWeek === num ? "bg-orange-500 text-white shadow-lg" : "bg-gray-100 dark:bg-gray-900 text-orange-400 hover:bg-orange-50"
                                                )}
                                            >
                                                {num}x
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-2 block">Quais dias da semana?</label>
                                    <div className="grid grid-cols-7 gap-1">
                                        {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    const updated = transportDays.includes(day)
                                                        ? transportDays.filter(d => d !== day)
                                                        : [...transportDays, day];
                                                    setTransportDays(updated);
                                                }}
                                                className={cn(
                                                    "py-2 rounded-lg text-[10px] font-bold transition-all",
                                                    transportDays.includes(day) ? "bg-orange-600 text-white shadow-md" : "bg-gray-100 dark:bg-gray-900 text-orange-300 hover:bg-orange-50"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Resumo Desconto */}
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl flex items-center justify-between border border-orange-100 dark:border-orange-900/30">
                                    <span className="text-[10px] font-bold text-orange-800 dark:text-orange-400 uppercase tracking-tight">Desconto Logística Recorrente:</span>
                                    <span className="text-sm font-bold text-orange-600 dark:text-orange-500">{(getTransportDiscountRate(transportDaysPerWeek) * 100).toFixed(0)}% OFF</span>
                                </div>
                            </div>
                        )}

                        {/* Default Times for Recurrence */}
                        {isRecurring && (
                            <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                {(transportType === 'ROUND_TRIP' || transportType === 'PICK_UP') && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Horário Padrão (Ida)</label>
                                        <input
                                            type="time"
                                            value={defaultLevaTime}
                                            onChange={(e) => setDefaultLevaTime(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                )}
                                {(transportType === 'ROUND_TRIP' || transportType === 'DROP_OFF') && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Horário Padrão (Volta)</label>
                                        <input
                                            type="time"
                                            value={defaultTrazTime}
                                            onChange={(e) => setDefaultTrazTime(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Section 2: Trip Config */}
            <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">2. Configuração da Viagem</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={() => setTransportType('ROUND_TRIP')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            transportType === 'ROUND_TRIP'
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        <ArrowRightLeft size={24} />
                        <span className="font-bold text-sm">Leva e Traz</span>
                    </button>
                    <button
                        onClick={() => setTransportType('PICK_UP')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            transportType === 'PICK_UP'
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        <ArrowRight size={24} />
                        <span className="font-bold text-sm">Apenas Ida (Busca)</span>
                    </button>
                    <button
                        onClick={() => setTransportType('DROP_OFF')}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                            transportType === 'DROP_OFF'
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                                : "border-transparent bg-gray-50 dark:bg-gray-900 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        <ArrowLeft size={24} />
                        <span className="font-bold text-sm">Apenas Volta (Entrega)</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1 relative">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Endereço de Origem</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSavePreset}
                                    className="text-xs font-medium text-gray-400 hover:text-yellow-500 flex items-center gap-1 transition-colors"
                                    title="Salvar configuração atual como favorita"
                                >
                                    <Save size={12} /> Salvar como Favorito
                                </button>
                                <button
                                    onClick={() => setShowPresets(!showPresets)}
                                    className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                                >
                                    <Star size={12} className="fill-blue-500" /> Meus Favoritos
                                </button>
                            </div>
                        </div>

                        {showPresets && (
                            <RoutePresetSelector
                                customerId={quote.customerId}
                                petId={quote.petId}
                                onSelect={handleApplyPreset}
                                onClose={() => setShowPresets(false)}
                            />
                        )}

                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                placeholder="Endereço de origem..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-center -my-2 z-10">
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-400">
                            <ArrowRight size={16} className="rotate-90 md:rotate-0" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 uppercase">Endereço de Destino</label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-400">{destinationIsThePet ? 'TL1 (Loja)' : 'TL2 (Livre)'}</span>
                                <button
                                    onClick={() => {
                                        const newVal = !destinationIsThePet;
                                        setDestinationIsThePet(newVal);
                                        setDestination(newVal ? '7Pet' : '');
                                    }}
                                    className={cn(
                                        "w-8 h-4 rounded-full transition-colors relative",
                                        destinationIsThePet ? "bg-blue-500" : "bg-gray-300"
                                    )}
                                >
                                    <div className={cn(
                                        "w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm",
                                        destinationIsThePet ? "left-4.5" : "left-0.5"
                                    )} />
                                </button>
                            </div>
                        </div>

                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                disabled={destinationIsThePet}
                                className={cn(
                                    "w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl border-none font-medium text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all",
                                    destinationIsThePet && "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                                )}
                                placeholder="Endereço de destino..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleCalculate}
                        disabled={isLoading || !origin}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <span className="animate-spin">⏳</span> : <Calculator size={18} />}
                        Calcular Rota e Preço
                    </button>
                </div>
            </section>

            {/* Section 3: Calculation Breakdown */}
            {
                calculation && (
                    <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">3. Detalhamento e Valores</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Distância Total</span>
                                <span className="text-xl font-bold text-gray-800 dark:text-white">{calculation.totalDistance}</span>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Tempo Estimado</span>
                                <span className="text-xl font-bold text-gray-800 dark:text-white">{calculation.totalDuration}</span>
                            </div>
                            <div className="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                <span className="text-xs text-blue-400 font-bold uppercase block mb-1">Valor Total Sugerido</span>
                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {calculation.total?.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-700">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Etapa</th>
                                        <th className="px-4 py-3">Rota</th>
                                        <th className="px-4 py-3 text-right">Distância</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {Object.entries(calculation.breakdown || {}).map(([key, leg]: [string, any]) => (
                                        <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium capitalize text-gray-700 dark:text-gray-300">{key}</td>
                                            <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]" title={`${leg.originAddress} -> ${leg.destinationAddress}`}>
                                                {leg.originAddress} → {leg.destinationAddress}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-600">{leg.distance}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-gray-800 dark:text-white">R$ {leg.price}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )
            }

            {/* Section 4: Internal Notes */}
            <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">4. Observações Internas</h3>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-transparent rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-800 dark:text-white placeholder:text-gray-400"
                    placeholder="Notas que apenas a equipe pode ver..."
                />
            </section>

            {/* Section 5: Related Appointments */}
            {quote.appointments && quote.appointments.length > 0 && (
                <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                        <Calendar className="text-blue-500" size={20} />
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">5. Agendamentos Relacionados</h3>
                    </div>

                    <div className="space-y-4">
                        {quote.appointments.map((appt: any) => (
                            <div
                                key={appt.id}
                                onClick={() => {
                                    setSelectedAppointmentId(appt.id);
                                    api.get(`/appointments/${appt.id}`).then(res => setViewAppointmentData(res.data));
                                }}
                                className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 hover:border-blue-500/50 cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-white capitalize">
                                            {new Date(appt.startAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                        </p>
                                        <p className="text-xs font-bold text-gray-400">
                                            Horário: {new Date(appt.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 flex flex-wrap gap-2 max-w-md">
                                    {appt.services?.map((svc: any) => (
                                        <span
                                            key={svc.id}
                                            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-tighter"
                                        >
                                            {svc.name}
                                        </span>
                                    ))}
                                    {(!appt.services || appt.services.length === 0) && (
                                        <span className="text-[10px] font-bold text-gray-400 italic">Sem serviços vinculados</span>
                                    )}
                                </div>

                                <div className="mt-4 md:mt-0 flex items-center gap-4">
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest",
                                        appt.status === 'CONFIRMADO' ? "bg-green-100 text-green-600" :
                                            appt.status === 'FINALIZADO' ? "bg-blue-100 text-blue-600" :
                                                appt.status === 'CANCELADO' ? "bg-red-100 text-red-600" :
                                                    "bg-gray-100 text-gray-600"
                                    )}>
                                        {appt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Action Bar */}
            {!readOnly && (
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => handleSave()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                    >
                        <Save size={18} />
                        Salvar Observações
                    </button>
                    <button
                        onClick={handleScheduleClick}
                        disabled={isLoading || !calculation}
                        className="flex items-center gap-2 px-8 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Calendar size={18} />
                        Agendar {isRecurring ? 'Recorrência' : 'Viagem'}
                    </button>
                </div>
            )}

            {/* Modals */}
            <CustomerDetailsModal
                isOpen={!!customerModalId}
                onClose={() => setCustomerModalId(null)}
                customerId={customerModalId || ''}
            />

            <AppointmentDetailsModal
                isOpen={!!selectedAppointmentId}
                onClose={() => setSelectedAppointmentId(null)}
                onSuccess={() => onUpdate()}
                appointment={viewAppointmentData}
                onModify={() => { }}
                onCopy={() => { }}
                onOpenCustomer={(customerId) => setCustomerModalId(customerId)}
            />

            <TransportRecurrenceWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                quote={{
                    ...quote,
                    isRecurring,
                    recurrenceFrequency: frequency,
                    transportType,
                    transportLevaAt: quote.transportLevaAt,
                    transportTrazAt: quote.transportTrazAt,
                    metadata: {
                        ...quote.metadata,
                        transportDays
                    }
                }}
                defaultLevaTime={defaultLevaTime}
                defaultTrazTime={defaultTrazTime}
                onConfirm={async (occurrences) => {
                    await onSchedule(occurrences);
                    setShowWizard(false);
                }}
            />

            {/* Undo Schedule Modal */}
            <AnimatePresence>
                {isUndoModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-[40px] p-8 shadow-2xl w-full max-w-lg border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-secondary dark:text-white uppercase tracking-tight">Desfazer Agendamentos</h3>
                                <button onClick={() => setIsUndoModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-6 font-bold leading-relaxed">
                                Esta ação irá <span className="text-red-500 font-bold">EXCLUIR TODOS</span> os agendamentos vinculados a este orçamento do calendário. O status do orçamento voltará para <span className="text-primary font-bold uppercase">APROVADO</span>.
                            </p>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Justificativa (Obrigatório)</label>
                                <textarea
                                    value={undoReason}
                                    onChange={(e) => setUndoReason(e.target.value)}
                                    rows={3}
                                    placeholder="Ex: Cliente desistiu do pacote, Erro de agendamento..."
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-transparent rounded-3xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 transition-all text-secondary dark:text-white"
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={() => setIsUndoModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-400 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-xs uppercase tracking-widest"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUndoSchedule}
                                    disabled={isUndoing || !undoReason.trim()}
                                    className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isUndoing ? <RefreshCcw size={16} className="animate-spin mx-auto" /> : 'Confirmar e Excluir'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransportOnlyEditor;
