import React, { useState, useEffect } from 'react';
import {
    X, AlertTriangle, RotateCcw,
    CheckCircle2, Info, ArrowRight,
    ShieldAlert
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface RevertModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: any;
    onSuccess: () => void;
}

const RevertModal: React.FC<RevertModalProps> = ({ isOpen, onClose, event, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [dryRunData, setDryRunData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isReverting, setIsReverting] = useState(false);

    useEffect(() => {
        if (isOpen && event) {
            fetchDryRun();
        }
    }, [isOpen, event]);

    const fetchDryRun = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/audit/admin/audit/${event.id}/revert`, {
                dryRun: true
            });
            setDryRunData(response.data);
        } catch (error: any) {
            console.error('Dry run error:', error);
            toast.error(error.response?.data?.error || 'Erro ao simular reversão');
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = async () => {
        if (!reason.trim()) {
            toast.error('Informe o motivo da reversão');
            return;
        }

        setIsReverting(true);
        try {
            await api.post(`/audit/admin/audit/${event.id}/revert`, {
                reason,
                dryRun: false
            });
            toast.success('Alteração revertida com sucesso!');
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao processar reversão');
        } finally {
            setIsReverting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 bg-red-50 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
                            <RotateCcw size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-red-900 tracking-tight">Confirmar Reversão</h2>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-0.5">Ação Crítica de Integridade</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-xl transition-colors">
                        <X size={24} className="text-red-300" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Summary Info */}
                    <div className="p-5 rounded-[32px] bg-gray-50 border border-gray-100 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">Evento Original</span>
                            <span className="text-sm font-black text-secondary uppercase">{event.action}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">Data / Hora</span>
                            <span className="text-sm font-bold text-secondary">
                                {new Date(event.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <div className="col-span-2 flex flex-col pt-2 border-t border-black/5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">Resumo do Evento</span>
                            <span className="text-xs text-secondary italic font-medium">"{event.summary}"</span>
                        </div>
                    </div>

                    {/* Simulation Result */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={14} className="text-primary" /> Visualização da Restauração
                        </h3>
                        {loading ? (
                            <div className="h-24 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <span className="text-xs font-bold text-gray-400 animate-pulse">Simulando restauração de dados...</span>
                            </div>
                        ) : dryRunData ? (
                            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-xl bg-indigo-500 text-white shadow-sm">
                                        <Info size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-indigo-900">
                                        Estratégia: <span className="uppercase">{event.revertStrategy}</span> no alvo {event.targetType}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-white rounded-xl border border-indigo-50">
                                        <span className="text-[10px] font-black text-gray-300 uppercase block mb-2">Estado Atual</span>
                                        <div className="max-h-32 overflow-y-auto text-[10px] font-mono whitespace-pre opacity-60">
                                            {JSON.stringify(dryRunData.currentData, null, 2)}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white rounded-xl border border-green-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-1 bg-green-500 text-white rounded-bl-lg">
                                            <CheckCircle2 size={10} />
                                        </div>
                                        <span className="text-[10px] font-black text-green-600 uppercase block mb-2">Estado Restaurado</span>
                                        <div className="max-h-32 overflow-y-auto text-[10px] font-mono whitespace-pre text-green-900 font-bold">
                                            {JSON.stringify(dryRunData.restorePayload, null, 2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase text-center">
                                Falha ao simular reversão. Entre em contato com o suporte.
                            </div>
                        )}
                    </div>

                    {/* Reason Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-secondary uppercase tracking-wider ml-1">Motivo da Reversão (Obrigatório)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva por que esta alteração está sendo desfeita..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-[24px] px-6 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all min-h-[100px]"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-gray-50 flex items-center justify-end gap-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-secondary hover:bg-gray-200 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleRevert}
                        disabled={isReverting || !reason.trim() || !dryRunData}
                        className="bg-red-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-red-200 flex items-center gap-2 uppercase text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                        {isReverting ? (
                            <div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></div>
                        ) : (
                            <RotateCcw size={14} />
                        )}
                        Executar Reversão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RevertModal;
