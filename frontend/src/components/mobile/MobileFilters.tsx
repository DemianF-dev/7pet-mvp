import React, { useState } from 'react';
import { X, Calendar, DollarSign, Filter } from 'lucide-react';
import { Button, Card } from '../ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MobileFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
    onReset: () => void;
    filters: {
        dateRange: { start: string; end: string };
        valueRange: { min: number; max: number };
        status: string;
        searchTerm: string;
    };
    title?: string;
    statuses?: string[];
}

export const MobileFilters: React.FC<MobileFiltersProps> = ({
    isOpen,
    onClose,
    onApply,
    onReset,
    filters,
    title = "Filtros Avançados",
    statuses = []
}) => {
    const [localFilters, setLocalFilters] = useState(filters);

    if (!isOpen) return null;

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        setLocalFilters(prev => ({
            ...prev,
            dateRange: { ...prev.dateRange, [type]: value }
        }));
    };

    const handleValueChange = (type: 'min' | 'max', value: string) => {
        const numValue = parseFloat(value) || 0;
        setLocalFilters(prev => ({
            ...prev,
            valueRange: { ...prev.valueRange, [type]: numValue }
        }));
    };

    const handleStatusChange = (status: string) => {
        setLocalFilters(prev => ({
            ...prev,
            status: prev.status === status ? '' : status
        }));
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        const emptyFilters = {
            dateRange: { start: '', end: '' },
            valueRange: { min: 0, max: 0 },
            status: '',
            searchTerm: ''
        };
        setLocalFilters(emptyFilters);
        onReset();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
            <div className="bg-white dark:bg-zinc-900 rounded-t-3xl w-full max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4 rounded-t-3xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-blue-500" />
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="sm"
                            icon={X}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">
                    {/* Status Filter */}
                    {statuses.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Status</h3>
                            <div className="flex flex-wrap gap-2">
                                {statuses.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                            localFilters.status === status
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date Range Filter */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Calendar size={16} />
                            Período
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Data Inicial</label>
                                <input
                                    type="date"
                                    value={localFilters.dateRange.start}
                                    onChange={(e) => handleDateChange('start', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Data Final</label>
                                <input
                                    type="date"
                                    value={localFilters.dateRange.end}
                                    onChange={(e) => handleDateChange('end', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Value Range Filter */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <DollarSign size={16} />
                            Faixa de Valor
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Valor Mínimo</label>
                                <input
                                    type="number"
                                    placeholder="R$ 0,00"
                                    value={localFilters.valueRange.min || ''}
                                    onChange={(e) => handleValueChange('min', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Valor Máximo</label>
                                <input
                                    type="number"
                                    placeholder="R$ 0,00"
                                    value={localFilters.valueRange.max || ''}
                                    onChange={(e) => handleValueChange('max', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Date Presets */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Rápido</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Hoje', days: 0 },
                                { label: 'Última Semana', days: 7 },
                                { label: 'Último Mês', days: 30 },
                                { label: 'Últimos 3 Meses', days: 90 }
                            ].map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        const end = new Date();
                                        const start = new Date();
                                        start.setDate(start.getDate() - preset.days);
                                        
                                        setLocalFilters(prev => ({
                                            ...prev,
                                            dateRange: {
                                                start: format(start, 'yyyy-MM-dd'),
                                                end: format(end, 'yyyy-MM-dd')
                                            }
                                        }));
                                    }}
                                    className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 p-4 flex gap-3">
                    <Button
                        onClick={handleReset}
                        variant="ghost"
                        className="flex-1"
                    >
                        Limpar
                    </Button>
                    <Button
                        onClick={handleApply}
                        variant="primary"
                        className="flex-1"
                    >
                        Aplicar Filtros
                    </Button>
                </div>
            </div>
        </div>
    );
};