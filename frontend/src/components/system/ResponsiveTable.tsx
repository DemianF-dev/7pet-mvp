import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Card from '../ui/Card';

export interface Column<T> {
    header: string;
    key: keyof T | string;
    render?: (item: T) => React.ReactNode;
    className?: string;
    mobileHidden?: boolean;
    sortable?: boolean; // New: Enable sorting for this column
    sortKey?: string; // New: Override the sorting key (e.g. for nested objects)
}

interface ResponsiveTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    renderMobileCard?: (item: T) => React.ReactNode;
    keyExtractor: (item: T) => string;
    emptyMessage?: string;
    isLoading?: boolean;
    // Selection support
    selectable?: boolean;
    selectedIds?: string[];
    onSelectRow?: (id: string) => void;
    onSelectAll?: () => void;
    // Sorting support
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
    onSort?: (key: string) => void;
}

/**
 * ResponsiveTable Component
 * Renders a standard <table> on desktop (md+)
 * Renders a list of Cards on mobile (sm)
 */
export function ResponsiveTable<T>({
    columns,
    data,
    onRowClick,
    renderMobileCard,
    keyExtractor,
    emptyMessage = 'Nenhum dado encontrado.',
    isLoading = false,
    selectable = false,
    selectedIds = [],
    onSelectRow,
    onSelectAll,
    sortConfig,
    onSort
}: ResponsiveTableProps<T>) {

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-[var(--color-bg-tertiary)] rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-[var(--color-text-tertiary)] font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--color-bg-tertiary)]/50 border-b border-[var(--color-border-subtle)]">
                            {selectable && (
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={data.length > 0 && selectedIds.length === data.length}
                                        onChange={onSelectAll}
                                        className="rounded border-[var(--color-border)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                    />
                                </th>
                            )}
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    onClick={() => col.sortable && onSort ? onSort(col.sortKey || (col.key as string)) : undefined}
                                    className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] ${col.className || ''} ${col.sortable ? 'cursor-pointer hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors select-none' : ''}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {col.header}
                                        {col.sortable && (
                                            <span className="text-[var(--color-text-tertiary)]">
                                                {sortConfig?.key === (col.sortKey || col.key) ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                ) : (
                                                    <ArrowUpDown size={12} className="opacity-30" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`
                                    border-b border-[var(--color-border-subtle)] last:border-0
                                    hover:bg-[var(--color-fill-quaternary)] transition-colors
                                    ${onRowClick ? 'cursor-pointer' : ''}
                                    ${selectable && selectedIds.includes(keyExtractor(item)) ? 'bg-[var(--color-accent-primary)]/5' : ''}
                                `}
                            >
                                {selectable && (
                                    <td className="px-6 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(keyExtractor(item))}
                                            onChange={() => onSelectRow?.(keyExtractor(item))}
                                            className="rounded border-[var(--color-border)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                        />
                                    </td>
                                )}
                                {columns.map((col, idx) => (
                                    <td
                                        key={idx}
                                        className={`px-6 py-4 text-[var(--font-size-body)] ${col.className || ''}`}
                                    >
                                        {col.render ? col.render(item) : (item as any)[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="md:hidden space-y-4 pb-10">
                {/* Mobile Sort Controls can be added here if needed, or rely on Header controls */}
                {data.map((item) => (
                    <motion.div
                        key={keyExtractor(item)}
                        whileTap={onRowClick ? { scale: 0.98 } : {}}
                        onClick={() => onRowClick?.(item)}
                    >
                        {renderMobileCard ? (
                            renderMobileCard(item)
                        ) : (
                            <Card
                                variant="glass"
                                className={`p-4 flex items-center justify-between group border-l-4 transition-all ${selectable && selectedIds.includes(keyExtractor(item)) ? 'border-l-[var(--color-accent-primary)]' : 'border-l-transparent'}`}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    {selectable && (
                                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(keyExtractor(item))}
                                                onChange={() => onSelectRow?.(keyExtractor(item))}
                                                className="w-5 h-5 rounded border-[var(--color-border)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-1 overflow-hidden">
                                        {columns.filter(c => !c.mobileHidden).map((col, idx) => (
                                            <div key={idx} className={`${idx === 0 ? 'font-black text-[var(--color-text-primary)]' : 'text-xs text-[var(--color-text-secondary)]'} truncate`}>
                                                {idx > 0 && <span className="opacity-40 uppercase text-[8px] font-black tracking-widest mr-2">{col.header}:</span>}
                                                {col.render ? col.render(item) : (item as any)[col.key]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {onRowClick && (
                                    <div className="shrink-0 ml-2">
                                        <ChevronRight size={20} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-accent-primary)] transition-colors" />
                                    </div>
                                )}
                            </Card>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default ResponsiveTable;
