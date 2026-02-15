import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Car, User, Check, Copy, AlertTriangle, X } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils';

// Types
interface ScheduleWizardProps {
    isOpen: boolean;
    onClose: () => void;
    quote: any; // Using any for simplicity as Quote type is complex and defined in parent
    onConfirm: (occurrences: any[]) => Promise<void>;
}

interface OccurrenceRow {
    id: string; // internal UUID or simple index
    spaAt: string; // Date string 'YYYY-MM-DDTHH:mm'
    levaAt: string;
    trazAt: string;
    levaDriverId: string;
    trazDriverId: string;
    itemIds: string[]; // List of quote items for this occurrence
    status: 'PENDING' | 'VALID' | 'INVALID';
}

interface User {
    id: string;
    name: string;
    role: string;
}

export const ScheduleWizard: React.FC<ScheduleWizardProps> = ({ isOpen, onClose, quote, onConfirm }) => {
    const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([]);
    const [drivers, setDrivers] = useState<User[]>([]);

    // Calculate default occurrences based on frequency
    const calculateDefaultOccurrences = () => {
        if (!quote.isRecurring) return 1;

        const freq = quote.recurrenceFrequency || quote.frequency;
        switch (freq) {
            case 'SEMANAL':
                return 4; // 4x per month
            case 'QUINZENAL':
                return 2; // 2x per month
            case 'MENSAL':
            default:
                return 1; // 1x per month
        }
    };

    const [numOccurrences, setNumOccurrences] = useState<number>(calculateDefaultOccurrences());
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch drivers on mount
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                // Assuming we can list users. If not, we might need a specific endpoint.
                // Using role filtering if backend supports it, otherwise filtering client-side
                const response = await api.get('/users?active=true');
                const allUsers = response.data.data || response.data; // adjust based on pagination structure
                // Filter for staff/drivers
                const staff = allUsers.filter((u: User) => u.role !== 'CLIENTE');
                setDrivers(staff);
            } catch (error) {
                console.error('Failed to fetch drivers', error);
                toast.error('Erro ao carregar lista de motoristas');
            }
        };

        if (isOpen) {
            fetchDrivers();
            initializeGrid();
        }
    }, [isOpen]);

    const initializeGrid = () => {
        // Initial setup based on quote dates
        const initialRow: OccurrenceRow = {
            id: crypto.randomUUID(),
            spaAt: quote.desiredAt ? new Date(quote.desiredAt).toISOString().slice(0, 16) : '',
            levaAt: quote.transportLevaAt ? new Date(quote.transportLevaAt).toISOString().slice(0, 16) : '',
            trazAt: quote.transportTrazAt ? new Date(quote.transportTrazAt).toISOString().slice(0, 16) : '',
            levaDriverId: '', // Ideally pre-fill if known?
            trazDriverId: '',
            itemIds: [],
            status: 'PENDING'
        };

        // If recurring, generate N rows based on frequency
        // But for "Initialize", maybe just 1 row or N rows if we have a default?
        // Let's generate 'numOccurrences' rows.

        generateRows(numOccurrences, initialRow);
    };

    const generateRows = (count: number, baseRow: OccurrenceRow) => {
        const newRows: OccurrenceRow[] = [];
        let currentDate = baseRow.spaAt ? new Date(baseRow.spaAt) : new Date();
        let currentLevaDate = baseRow.levaAt ? new Date(baseRow.levaAt) : undefined;
        let currentTrazDate = baseRow.trazAt ? new Date(baseRow.trazAt) : undefined;

        for (let i = 0; i < count; i++) {
            newRows.push({
                id: crypto.randomUUID(),
                spaAt: currentDate.toISOString().slice(0, 16),
                levaAt: currentLevaDate ? currentLevaDate.toISOString().slice(0, 16) : '',
                trazAt: currentTrazDate ? currentTrazDate.toISOString().slice(0, 16) : '',
                levaDriverId: baseRow.levaDriverId, // Copy driver from base
                trazDriverId: baseRow.trazDriverId,
                itemIds: [...baseRow.itemIds],
                status: 'PENDING'
            });

            // Increment dates based on frequency
            const freq = quote.recurrenceFrequency || quote.frequency;

            if (freq === 'SEMANAL') {
                currentDate = addWeeks(currentDate, 1);
                if (currentLevaDate) currentLevaDate = addWeeks(currentLevaDate, 1);
                if (currentTrazDate) currentTrazDate = addWeeks(currentTrazDate, 1);
            } else if (freq === 'QUINZENAL') {
                currentDate = addWeeks(currentDate, 2);
                if (currentLevaDate) currentLevaDate = addWeeks(currentLevaDate, 2);
                if (currentTrazDate) currentTrazDate = addWeeks(currentTrazDate, 2);
            } else if (freq === 'MENSAL') {
                currentDate = addMonths(currentDate, 1);
                if (currentLevaDate) currentLevaDate = addMonths(currentLevaDate, 1);
                if (currentTrazDate) currentTrazDate = addMonths(currentTrazDate, 1);
            }
            // For unknown frequencies, default to no increment
        }
        setOccurrences(newRows);
    };

    // Copy Row 1 to All
    const handleCopyRow1 = () => {
        if (occurrences.length === 0) return;
        const baseRow = occurrences[0];
        generateRows(numOccurrences, baseRow);
        toast.success('Padrão da Linha 1 aplicado a todas as ocorrências!');
    };

    const handleUpdateRow = (index: number, field: keyof OccurrenceRow, value: any) => {
        const updated = [...occurrences];
        updated[index] = { ...updated[index], [field]: value };
        setOccurrences(updated);
    };

    const toggleItem = (rowIndex: number, itemId: string) => {
        const row = occurrences[rowIndex];
        const newItemIds = row.itemIds.includes(itemId)
            ? row.itemIds.filter(id => id !== itemId)
            : [...row.itemIds, itemId];
        handleUpdateRow(rowIndex, 'itemIds', newItemIds);
    };

    const handleConfirm = async () => {
        // Validation
        const errors: string[] = [];
        const validOccurrences = occurrences.map((occ, idx) => {
            const rowNum = idx + 1;
            // Strict checking logic mirroring backend
            if ((quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE') && !occ.spaAt) {
                errors.push(`Linha ${rowNum}: Horário SPA inválido`);
            }
            if (quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE') {
                // Simplify check: if input exists on screen, it must be filled
                // Actually logic: If Quote Type includes transport, we need transport details.
                // We will send nulls if fields are empty, backend will throw if mandatory.
                // Ideally validate here to avoid roundtrip.

                const isRoundTrip = quote.transportType === 'ROUND_TRIP' || (!quote.transportType && quote.type === 'SPA_TRANSPORTE');
                const isPickup = quote.transportType === 'PICK_UP';
                const isDropoff = quote.transportType === 'DROP_OFF';

                if ((isRoundTrip || isPickup) && (!occ.levaAt || !occ.levaDriverId)) {
                    errors.push(`Linha ${rowNum}: Dados de 'Leva' incompletos`);
                }
                if ((isRoundTrip || isDropoff) && (!occ.trazAt || !occ.trazDriverId)) {
                    errors.push(`Linha ${rowNum}: Dados de 'Traz' incompletos`);
                }
            }

            return {
                spaAt: occ.spaAt || null,
                levaAt: occ.levaAt || null,
                trazAt: occ.trazAt || null,
                levaDriverId: occ.levaDriverId || null,
                trazDriverId: occ.trazDriverId || null,
                itemIds: occ.itemIds
            };
        });

        if (errors.length > 0) {
            toast.error(`Erros encontrados:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '...' : ''}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(validOccurrences);
            onClose();
        } catch (error) {
            console.error(error);
            // Toast handled by parent or interceptor usually, but let's be safe
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const showSpa = quote.type === 'SPA' || quote.type === 'SPA_TRANSPORTE';
    const showTransport = quote.type === 'TRANSPORTE' || quote.type === 'SPA_TRANSPORTE';

    // Check specific transport legs
    const showLeva = showTransport && (quote.transportType === 'ROUND_TRIP' || quote.transportType === 'PICK_UP' || quote.type === 'SPA_TRANSPORTE'); // Default Combo = Round Trip usually
    const showTraz = showTransport && (quote.transportType === 'ROUND_TRIP' || quote.transportType === 'DROP_OFF' || quote.type === 'SPA_TRANSPORTE');

    // Filter items that can be assigned (usually SPA services/products, excluding transport)
    const assignableItems = quote.items?.filter((item: any) => {
        const desc = item.description.toLowerCase();
        const isTransport = desc.includes('transporte') || desc.includes('🔄') || desc.includes('📦') || desc.includes('🏠');
        return !isTransport;
    }) || [];

    // Helper to count how many times an item is assigned across all rows
    const getItemAssignmentCount = (itemId: string) => {
        return occurrences.reduce((acc, occ) => acc + (occ.itemIds.includes(itemId) ? 1 : 0), 0);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-zinc-900 w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Calendar className="w-6 h-6 text-primary" />
                                Assistente de Agendamento
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Configure datas e responsáveis para {quote.isRecurring ? 'as recorrências' : 'o agendamento'}.
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            {quote.isRecurring && (
                                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Repetições:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="52"
                                        value={numOccurrences}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setNumOccurrences(val);
                                            // Regenerate or just update state? If regenerate, we lose edits.
                                            // Ideally we have a "Apply" button.
                                        }}
                                        className="w-16 bg-transparent border-none text-center font-bold focus:ring-0 p-0"
                                    />
                                    <button
                                        onClick={() => generateRows(numOccurrences, occurrences[0])}
                                        className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/90"
                                    >
                                        Gerar
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyRow1}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                >
                                    <Copy size={16} />
                                    Copiar Linha 1 para Todas
                                </button>
                            </div>
                        </div>

                        <div className="text-sm text-zinc-500">
                            Total: {occurrences.length} agendamentos
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 overflow-auto p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 font-semibold text-zinc-500 w-16 text-center">#</th>
                                    {showSpa && (
                                        <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300 min-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-blue-500" />
                                                Data/Hora SPA
                                            </div>
                                        </th>
                                    )}
                                    {showLeva && (
                                        <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300 min-w-[300px] border-l border-zinc-200 dark:border-zinc-700 bg-emerald-50/30 dark:bg-emerald-900/10">
                                            <div className="flex items-center gap-2">
                                                <Car size={16} className="text-emerald-500" />
                                                Busca (Leva)
                                            </div>
                                        </th>
                                    )}
                                    {showTraz && (
                                        <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300 min-w-[300px] border-l border-zinc-200 dark:border-zinc-700 bg-orange-50/30 dark:bg-orange-900/10">
                                            <div className="flex items-center gap-2">
                                                <Car size={16} className="text-orange-500" />
                                                Entrega (Traz)
                                            </div>
                                        </th>
                                    )}
                                    <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300 min-w-[300px] border-l border-zinc-200 dark:border-zinc-700">
                                        <div className="flex items-center gap-2">
                                            <Check size={16} className="text-primary" />
                                            Serviços para esta data
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {occurrences.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="p-4 text-center text-zinc-400 font-mono text-sm">
                                            {idx + 1}
                                        </td>

                                        {/* SPA */}
                                        {showSpa && (
                                            <td className="p-4">
                                                <input
                                                    type="datetime-local"
                                                    value={row.spaAt}
                                                    onChange={(e) => handleUpdateRow(idx, 'spaAt', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                                                />
                                            </td>
                                        )}

                                        {/* LEVA */}
                                        {showLeva && (
                                            <td className="p-4 border-l border-zinc-200 dark:border-zinc-700 bg-emerald-50/10 dark:bg-emerald-900/5">
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        type="datetime-local"
                                                        value={row.levaAt}
                                                        onChange={(e) => handleUpdateRow(idx, 'levaAt', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                                                    />
                                                    <div className="relative">
                                                        <select
                                                            value={row.levaDriverId}
                                                            onChange={(e) => handleUpdateRow(idx, 'levaDriverId', e.target.value)}
                                                            className={cn(
                                                                "w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border rounded-lg appearance-none text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none",
                                                                !row.levaDriverId ? "border-red-300 dark:border-red-900/50 text-zinc-400" : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                                                            )}
                                                        >
                                                            <option value="">Selecione Motorista...</option>
                                                            {drivers.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* TRAZ */}
                                        {showTraz && (
                                            <td className="p-4 border-l border-zinc-200 dark:border-zinc-700 bg-orange-50/10 dark:bg-orange-900/5">
                                                {/* ... (keep existing traz content) */}
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        type="datetime-local"
                                                        value={row.trazAt}
                                                        onChange={(e) => handleUpdateRow(idx, 'trazAt', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-sm"
                                                    />
                                                    <div className="relative">
                                                        <select
                                                            value={row.trazDriverId}
                                                            onChange={(e) => handleUpdateRow(idx, 'trazDriverId', e.target.value)}
                                                            className={cn(
                                                                "w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border rounded-lg appearance-none text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none",
                                                                !row.trazDriverId ? "border-red-300 dark:border-red-900/50 text-zinc-400" : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                                                            )}
                                                        >
                                                            <option value="">Selecione Motorista...</option>
                                                            {drivers.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* SERVICES SELECTION */}
                                        <td className="p-4 border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50/10 dark:bg-zinc-800/5">
                                            <div className="flex flex-wrap gap-2">
                                                {assignableItems.map((item: any) => {
                                                    const isSelected = row.itemIds.includes(item.id || item.description);
                                                    const assignedCount = getItemAssignmentCount(item.id || item.description);
                                                    const totalQty = item.quantity || 1;
                                                    const isFullyAssigned = assignedCount >= totalQty && !isSelected;

                                                    return (
                                                        <button
                                                            key={item.id || item.description}
                                                            type="button"
                                                            onClick={() => toggleItem(idx, item.id || item.description)}
                                                            title={`${item.description} (${assignedCount}/${totalQty})`}
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tighter transition-all flex items-center gap-1.5",
                                                                isSelected
                                                                    ? "bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90"
                                                                    : isFullyAssigned
                                                                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 opacity-50 cursor-not-allowed"
                                                                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-primary/50"
                                                            )}
                                                        >
                                                            {isSelected ? <Check size={10} /> : null}
                                                            {item.description}
                                                            <span className={cn(
                                                                "ml-1 px-1.5 py-0.5 rounded-full text-[8px]",
                                                                isSelected ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-700"
                                                            )}>
                                                                {totalQty}x
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                                {assignableItems.length === 0 && (
                                                    <span className="text-xs text-zinc-500 italic">Nenhum serviço extra</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-end gap-3 rounded-b-2xl">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white font-medium hover:brightness-110 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? 'Processando...' : 'Confirmar e Agendar'}
                            {!isSubmitting && <Check size={18} />}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
