import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Car, User, Check, Copy, X } from 'lucide-react';
import { addWeeks, addMonths } from 'date-fns';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../../lib/utils';

// Types
interface TransportRecurrenceWizardProps {
    isOpen: boolean;
    onClose: () => void;
    quote: any;
    onConfirm: (occurrences: any[]) => Promise<void>;
    defaultLevaTime?: string;
    defaultTrazTime?: string;
}

interface TransportOccurrenceRow {
    id: string;
    levaAt: string;
    trazAt: string;
    levaDriverId: string;
    trazDriverId: string;
    status: 'PENDING' | 'VALID' | 'INVALID';
}

interface User {
    id: string;
    name: string;
    role: string;
}

export const TransportRecurrenceWizard: React.FC<TransportRecurrenceWizardProps> = ({
    isOpen,
    onClose,
    quote,
    onConfirm,
    defaultLevaTime = '08:00',
    defaultTrazTime = '17:00'
}) => {
    const [occurrences, setOccurrences] = useState<TransportOccurrenceRow[]>([]);
    const [drivers, setDrivers] = useState<User[]>([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch drivers on mount
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await api.get('/management/users?active=true');
                const allUsers = response.data.data || response.data || [];
                // Filter users who are staff (anything not CLIENTE)
                const staff = allUsers.filter((u: any) => u.role !== 'CLIENTE');
                setDrivers(staff);
            } catch (error) {
                console.error('Failed to fetch drivers', error);
                toast.error('Erro ao carregar lista de motoristas');
            }
        };

        if (isOpen) {
            fetchDrivers();

            // Extract times from quote if present
            if (quote.transportLevaAt) {
                try {
                    // quote.transportLevaAt is likely an ISO string from DB
                    const time = new Date(quote.transportLevaAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    // If it's a valid time string
                    if (time && time.includes(':')) {
                        // Ensure we use the prop setter or internal logic
                    }
                } catch (e) { }
            }

            // Default start date to quote desiredAt or today
            const initialDate = quote.desiredAt ? new Date(quote.desiredAt) : new Date();
            setStartDate(initialDate.toISOString().slice(0, 10));
        }
    }, [isOpen, quote.desiredAt, quote.transportLevaAt, quote.transportTrazAt]);

    // Regenerate rows when start date or frequency changes
    useEffect(() => {
        if (isOpen && startDate) {
            generateRows();
        }
    }, [isOpen, startDate, quote.recurrenceFrequency, quote.frequency, defaultLevaTime, defaultTrazTime]);


    const generateRows = () => {
        const start = new Date(startDate);
        // End of month based on start date
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

        const newRows: TransportOccurrenceRow[] = [];
        let current = new Date(start);

        const freq = quote.recurrenceFrequency || quote.frequency; // SEMANAL, QUINZENAL, etc
        const transportDays = quote.metadata?.transportDays || [];

        const DAY_MAP: Record<string, number> = {
            'DOM': 0, 'SEG': 1, 'TER': 2, 'QUA': 3, 'QUI': 4, 'SEX': 5, 'SAB': 6
        };
        const targetDays = transportDays.map((d: string) => DAY_MAP[d]);

        // Helper to get time [H, M] prioritizing quote data or props
        const getLevaTime = (): [number, number] => {
            const source = quote.transportLevaAt;
            if (source) {
                const d = new Date(source);
                if (!isNaN(d.getTime())) return [d.getHours(), d.getMinutes()];
                // Fallback for HH:mm strings
                if (typeof source === 'string' && source.includes(':') && source.length <= 5) {
                    return source.split(':').map(Number) as [number, number];
                }
            }
            return defaultLevaTime.split(':').map(Number) as [number, number];
        };

        const getTrazTime = (): [number, number] => {
            const source = quote.transportTrazAt;
            if (source) {
                const d = new Date(source);
                if (!isNaN(d.getTime())) return [d.getHours(), d.getMinutes()];
                // Fallback for HH:mm strings
                if (typeof source === 'string' && source.includes(':') && source.length <= 5) {
                    return source.split(':').map(Number) as [number, number];
                }
            }
            return defaultTrazTime.split(':').map(Number) as [number, number];
        };

        // Helper for local ISO string (YYYY-MM-DDTHH:mm)
        const formatLocalISO = (date: Date) => {
            const pad = (n: number) => String(n).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };


        const [lh, lm] = getLevaTime();
        const [th, tm] = getTrazTime();

        // Safety break
        let loops = 0;

        // SINGLE TRIP LOGIC
        if (!quote.isRecurring) {
            const levaDt = new Date(start);
            levaDt.setHours(lh, lm, 0, 0);

            const trazDt = new Date(start);
            trazDt.setHours(th, tm, 0, 0);

            newRows.push({
                id: crypto.randomUUID(),
                levaAt: formatLocalISO(levaDt),
                trazAt: formatLocalISO(trazDt),
                levaDriverId: '',
                trazDriverId: '',
                status: 'PENDING'
            });
        }
        // RECURRING LOGIC
        else if (targetDays.length > 0) {
            // New Logic: If specific days are selected, project those days day-by-day
            while (current <= end && loops < 150) {
                if (targetDays.includes(current.getDay())) {
                    const levaDt = new Date(current);
                    levaDt.setHours(lh, lm, 0, 0);

                    const trazDt = new Date(current);
                    trazDt.setHours(th, tm, 0, 0);

                    newRows.push({
                        id: crypto.randomUUID(),
                        levaAt: formatLocalISO(levaDt),
                        trazAt: formatLocalISO(trazDt),
                        levaDriverId: '',
                        trazDriverId: '',
                        status: 'PENDING'
                    });
                }

                // Increment day by day
                current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
                loops++;
            }
        } else {
            // Original Logic: Project based on frequency from start date
            while (current <= end && loops < 50) {
                const levaDt = new Date(current);
                levaDt.setHours(lh, lm, 0, 0);

                const trazDt = new Date(current);
                trazDt.setHours(th, tm, 0, 0);

                newRows.push({
                    id: crypto.randomUUID(),
                    levaAt: formatLocalISO(levaDt),
                    trazAt: formatLocalISO(trazDt),
                    levaDriverId: '',
                    trazDriverId: '',
                    status: 'PENDING'
                });

                // Increment
                if (freq === 'SEMANAL') {
                    current = addWeeks(current, 1);
                } else if (freq === 'QUINZENAL') {
                    current = addWeeks(current, 2);
                } else if (freq === 'MENSAL') {
                    current = addMonths(current, 1);
                } else {
                    current = addWeeks(current, 1);
                }
                loops++;
            }
        }

        setOccurrences(newRows);
    };

    const handleCopyRow1 = () => {
        if (occurrences.length === 0) return;
        const base = occurrences[0];
        const updated = occurrences.map(row => ({
            ...row,
            levaDriverId: base.levaDriverId,
            trazDriverId: base.trazDriverId
        }));
        setOccurrences(updated);
        toast.success('Motoristas da linha 1 copiados!');
    };

    const handleBulkDriver = (type: 'LEVA' | 'TRAZ', driverId: string) => {
        if (!driverId) return;
        const updated = occurrences.map(row => ({
            ...row,
            [type === 'LEVA' ? 'levaDriverId' : 'trazDriverId']: driverId
        }));
        setOccurrences(updated);
        toast.success(`Motorista aplicado para todos os ${type === 'LEVA' ? 'Levas' : 'Traz'}!`);
    };

    const handleUpdateRow = (index: number, field: keyof TransportOccurrenceRow, value: any) => {
        const updated = [...occurrences];
        updated[index] = { ...updated[index], [field]: value };
        setOccurrences(updated);
    };

    const handleConfirm = async () => {
        const errors: string[] = [];
        const validOccurrences = occurrences.map((occ, idx) => {
            const rowNum = idx + 1;
            const isRoundTrip = quote.transportType === 'ROUND_TRIP';
            const isPickup = quote.transportType === 'PICK_UP';
            const isDropoff = quote.transportType === 'DROP_OFF';

            if ((isRoundTrip || isPickup) && (!occ.levaAt || !occ.levaDriverId)) {
                errors.push(`Linha ${rowNum}: Dados de 'Busca' incompletos (Data ou Motorista)`);
            }
            if ((isRoundTrip || isDropoff) && (!occ.trazAt || !occ.trazDriverId)) {
                errors.push(`Linha ${rowNum}: Dados de 'Entrega' incompletos (Data ou Motorista)`);
            }

            return {
                levaAt: occ.levaAt || null,
                trazAt: occ.trazAt || null,
                levaDriverId: occ.levaDriverId || null,
                trazDriverId: occ.trazDriverId || null,
                spaAt: null,
                itemIds: []
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
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const showLeva = quote.transportType === 'ROUND_TRIP' || quote.transportType === 'PICK_UP';
    const showTraz = quote.transportType === 'ROUND_TRIP' || quote.transportType === 'DROP_OFF';

    // Calculate stats
    const totalTrips = occurrences.length;
    const totalLeva = showLeva ? totalTrips : 0;
    const totalTraz = showTraz ? totalTrips : 0;

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
                    className="bg-white dark:bg-zinc-900 w-full max-w-6xl max-h-[95vh] rounded-[32px] shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-t-[32px]">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                                <Car className="w-8 h-8 text-primary" />
                                {quote.isRecurring ? 'Agendamento em Massa (Mês Vigente)' : 'Agendamento de Transporte'}
                            </h2>
                            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-1">
                                {quote.isRecurring
                                    ? <>Gerando datas a partir de <strong className="text-emerald-600">{new Date(startDate).toLocaleDateString()}</strong> até fim do mês.</>
                                    : <>Agendando transporte para o dia <strong className="text-emerald-600">{new Date(startDate).toLocaleDateString()}</strong></>
                                }
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-red-500 transition-colors">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                                    {quote.isRecurring ? 'Data Início' : 'Data'}
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-zinc-50 dark:bg-zinc-800 border-none rounded-lg text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700 mx-2" />

                            {showLeva && (
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Motorista - Todos Leva</label>
                                    <select
                                        className="bg-emerald-50 dark:bg-emerald-900/20 border-none rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500/50"
                                        onChange={(e) => handleBulkDriver('LEVA', e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Aplicar a todos...</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {showTraz && (
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Motorista - Todos Traz</label>
                                    <select
                                        className="bg-blue-50 dark:bg-blue-900/20 border-none rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500/50"
                                        onChange={(e) => handleBulkDriver('TRAZ', e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Aplicar a todos...</option>
                                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 text-xs font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 rounded-xl">
                            <div className="flex flex-col items-center">
                                <span className="text-zinc-800 dark:text-white text-lg">{occurrences.length}</span>
                                <span className="uppercase tracking-widest text-[9px]">Diárias</span>
                            </div>
                            <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                            <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                                <span className="text-lg">{totalLeva}</span>
                                <span className="uppercase tracking-widest text-[9px]">Levas</span>
                            </div>
                            <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                            <div className="flex flex-col items-center text-blue-600 dark:text-blue-400">
                                <span className="text-lg">{totalTraz}</span>
                                <span className="uppercase tracking-widest text-[9px]">Traz</span>
                            </div>
                        </div>
                    </div>

                    {/* Grid Content */}
                    <div className="flex-1 overflow-auto bg-zinc-50/50 dark:bg-zinc-900/30">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white dark:bg-zinc-900 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 font-bold text-zinc-300 w-16 text-center text-xs uppercase">#</th>
                                    {showLeva && (
                                        <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300 border-l border-zinc-100 dark:border-zinc-800 bg-emerald-50/30 dark:bg-emerald-900/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                    <Car size={14} />
                                                </div>
                                                <span className="uppercase tracking-tight text-xs">Busca (Leva)</span>
                                            </div>
                                        </th>
                                    )}
                                    {showTraz && (
                                        <th className="p-4 font-bold text-zinc-700 dark:text-zinc-300 border-l border-zinc-100 dark:border-zinc-800 bg-blue-50/30 dark:bg-blue-900/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                    <Car size={14} />
                                                </div>
                                                <span className="uppercase tracking-tight text-xs">Entrega (Traz)</span>
                                            </div>
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
                                {occurrences.map((row, idx) => (
                                    <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="p-4 text-center text-zinc-300 font-bold text-sm">
                                            {idx + 1}
                                        </td>

                                        {/* LEVA */}
                                        {showLeva && (
                                            <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 relative group-hover:bg-emerald-50/10 dark:group-hover:bg-emerald-900/5 transition-colors">
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <input
                                                            type="datetime-local"
                                                            value={row.levaAt}
                                                            onChange={(e) => handleUpdateRow(idx, 'levaAt', e.target.value)}
                                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-medium text-zinc-700 dark:text-zinc-200"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <select
                                                            value={row.levaDriverId}
                                                            onChange={(e) => handleUpdateRow(idx, 'levaDriverId', e.target.value)}
                                                            className={cn(
                                                                "w-full px-3 py-2 bg-zinc-50 dark:bg-black/20 border rounded-lg appearance-none text-xs font-medium outline-none transition-all",
                                                                !row.levaDriverId
                                                                    ? "border-red-200 dark:border-red-900/30 text-zinc-400"
                                                                    : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-emerald-50/50 dark:bg-emerald-900/20"
                                                            )}
                                                        >
                                                            <option value="">Motorista...</option>
                                                            {drivers.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* TRAZ */}
                                        {showTraz && (
                                            <td className="p-4 border-l border-zinc-100 dark:border-zinc-800 relative group-hover:bg-blue-50/10 dark:group-hover:bg-blue-900/5 transition-colors">
                                                <div className="flex gap-3">
                                                    <div className="flex-1">
                                                        <input
                                                            type="datetime-local"
                                                            value={row.trazAt}
                                                            onChange={(e) => handleUpdateRow(idx, 'trazAt', e.target.value)}
                                                            className="w-full px-3 py-2 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-xs font-medium text-zinc-700 dark:text-zinc-200"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <select
                                                            value={row.trazDriverId}
                                                            onChange={(e) => handleUpdateRow(idx, 'trazDriverId', e.target.value)}
                                                            className={cn(
                                                                "w-full px-3 py-2 bg-zinc-50 dark:bg-black/20 border rounded-lg appearance-none text-xs font-medium outline-none transition-all",
                                                                !row.trazDriverId
                                                                    ? "border-red-200 dark:border-red-900/30 text-zinc-400"
                                                                    : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-blue-50/50 dark:bg-blue-900/20"
                                                            )}
                                                        >
                                                            <option value="">Motorista...</option>
                                                            {drivers.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center rounded-b-[32px]">
                        <div className="text-xs text-zinc-400">
                            * Agendamentos serão criados individualmente para cada perna.
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold uppercase tracking-wider text-xs transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={isSubmitting}
                                className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xl shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-emerald-800"
                            >
                                {isSubmitting ? 'Agendando...' : quote.isRecurring ? 'Confirmar e Agendar Tudo' : 'Confirmar Agendamento'}
                                {!isSubmitting && <Check size={20} />}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TransportRecurrenceWizard;
