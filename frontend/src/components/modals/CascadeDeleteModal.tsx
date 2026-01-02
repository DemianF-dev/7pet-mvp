import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, RefreshCcw, Calendar, DollarSign, CheckSquare, Square } from 'lucide-react';
import api from '../../services/api';

interface QuoteDependencies {
    quote: {
        id: string;
        seqId: number;
        totalAmount: number;
        status: string;
    };
    appointments: {
        spa: Array<{
            id: string;
            startAt: string;
            status: string;
            services: string[];
        }>;
        transport: Array<{
            id: string;
            startAt: string;
            status: string;
            origin?: string;
            destination?: string;
        }>;
    };
    invoice?: {
        id: string;
        amount: number;
        status: string;
        dueDate: string;
    };
    canDelete: boolean;
    warnings: string[];
}

interface CascadeDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    quoteId: string;
    onSuccess: () => void;
}

export default function CascadeDeleteModal({ isOpen, onClose, quoteId, onSuccess }: CascadeDeleteModalProps) {
    const [dependencies, setDependencies] = useState<QuoteDependencies | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const [deleteSpaAppointments, setDeleteSpaAppointments] = useState(false);
    const [deleteTransportAppointments, setDeleteTransportAppointments] = useState(false);
    const [deleteInvoice, setDeleteInvoice] = useState(false);

    useEffect(() => {
        if (isOpen && quoteId) {
            fetchDependencies();
        }
    }, [isOpen, quoteId]);

    const fetchDependencies = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/quotes/${quoteId}/dependencies`);
            setDependencies(response.data);
        } catch (error) {
            console.error('Erro ao buscar dependências:', error);
            alert('Erro ao verificar dependências do orçamento');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!dependencies) return;

        const message = `Confirma a exclusão do orçamento #${dependencies.quote.seqId}?`;
        if (!window.confirm(message)) return;

        setIsDeleting(true);
        try {
            await api.post(`/quotes/${quoteId}/cascade-delete`, {
                deleteSpaAppointments,
                deleteTransportAppointments,
                deleteInvoice
            });

            alert('Orçamento e itens selecionados movidos para a lixeira');
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao excluir orçamento');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-black text-secondary">Excluir Orçamento</h2>
                            {dependencies && (
                                <p className="text-sm text-gray-500 mt-1">Orçamento #{dependencies.quote.seqId}</p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            disabled={isDeleting}
                        >
                            <X size={24} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCcw className="animate-spin text-primary" size={32} />
                            </div>
                        ) : dependencies ? (
                            <>
                                {/* Warnings */}
                                {dependencies.warnings.length > 0 && (
                                    <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                            <div className="flex-1">
                                                <p className="font-bold text-yellow-900 mb-2">Avisos Importantes:</p>
                                                <ul className="space-y-1 text-sm text-yellow-800">
                                                    {dependencies.warnings.map((warning, i) => (
                                                        <li key={i}>• {warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Main Question */}
                                <div className="mb-6">
                                    <p className="text-lg font-bold text-gray-900 mb-2">
                                        O que deseja excluir junto com este orçamento?
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Selecione os itens relacionados que também devem ir para a lixeira:
                                    </p>
                                </div>

                                {/* Options */}
                                <div className="space-y-3 mb-6">
                                    {/* SPA Appointments */}
                                    {dependencies.appointments.spa.length > 0 && (
                                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-primary/50 transition-all">
                                            <div className="pt-0.5">
                                                {deleteSpaAppointments ? (
                                                    <CheckSquare className="text-primary" size={20} />
                                                ) : (
                                                    <Square className="text-gray-400" size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={deleteSpaAppointments}
                                                    onChange={(e) => setDeleteSpaAppointments(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <p className="font-bold text-gray-900">
                                                    {dependencies.appointments.spa.length} Agendamento(s) SPA
                                                </p>
                                                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                                    {dependencies.appointments.spa.slice(0, 2).map((apt) => (
                                                        <li key={apt.id} className="flex items-center gap-2">
                                                            <Calendar size={14} />
                                                            {new Date(apt.startAt).toLocaleDateString()} - {apt.status}
                                                            {apt.services.length > 0 && ` (${apt.services.join(', ')})`}
                                                        </li>
                                                    ))}
                                                    {dependencies.appointments.spa.length > 2 && (
                                                        <li className="text-xs text-gray-500">... e mais {dependencies.appointments.spa.length - 2}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </label>
                                    )}

                                    {/* Transport Appointments */}
                                    {dependencies.appointments.transport.length > 0 && (
                                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-primary/50 transition-all">
                                            <div className="pt-0.5">
                                                {deleteTransportAppointments ? (
                                                    <CheckSquare className="text-primary" size={20} />
                                                ) : (
                                                    <Square className="text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={deleteTransportAppointments}
                                                    onChange={(e) => setDeleteTransportAppointments(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <p className="font-bold text-gray-900">
                                                    {dependencies.appointments.transport.length} Agendamento(s) de Transporte
                                                </p>
                                                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                                    {dependencies.appointments.transport.slice(0, 2).map((apt) => (
                                                        <li key={apt.id} className="flex items-center gap-2">
                                                            <Calendar size={14} />
                                                            {new Date(apt.startAt).toLocaleDateString()} - {apt.origin} → {apt.destination}
                                                        </li>
                                                    ))}
                                                    {dependencies.appointments.transport.length > 2 && (
                                                        <li className="text-xs text-gray-500">... e mais {dependencies.appointments.transport.length - 2}</li>
                                                    )}
                                                </ul>
                                            </div>
                                        </label>
                                    )}

                                    {/* Invoice */}
                                    {dependencies.invoice && (
                                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-primary/50 transition-all">
                                            <div className="pt-0.5">
                                                {deleteInvoice ? (
                                                    <CheckSquare className="text-primary" size={20} />
                                                ) : (
                                                    <Square className="text-gray-400" size={20} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={deleteInvoice}
                                                    onChange={(e) => setDeleteInvoice(e.target.checked)}
                                                    className="sr-only"
                                                />
                                                <p className="font-bold text-gray-900">Fatura/Cobrança</p>
                                                <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                    <DollarSign size={14} />
                                                    R$ {dependencies.invoice.amount.toFixed(2)} - {dependencies.invoice.status}
                                                    <span className="text-xs">
                                                        (Vencimento: {new Date(dependencies.invoice.dueDate).toLocaleDateString()})
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        disabled={isDeleting}
                                        className="flex-1 px-6 py-4 rounded-2xl font-black text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <RefreshCcw className="animate-spin" size={18} />
                                                Excluindo...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={18} />
                                                Mover para Lixeira
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        ) : null}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
