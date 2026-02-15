import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCcw, ShieldAlert } from 'lucide-react';

interface RevertConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    eventSummary: string;
    loading: boolean;
}

export default function RevertConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    eventSummary,
    loading
}: RevertConfirmationModalProps) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl border border-red-100"
            >
                {/* Header Destaque Red */}
                <div className="bg-red-500 p-8 text-white relative">
                    <div className="absolute top-6 right-8">
                        <ShieldAlert size={48} className="opacity-20 rotate-12" />
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                        <RefreshCcw size={32} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold uppercase tracking-tight leading-none mb-2">Reverter Evento</h3>
                    <p className="text-red-100 text-sm font-bold opacity-80 italic">Atenção: Esta ação modificará o banco de dados diretamente.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Evento Alvo</p>
                        <p className="text-sm font-bold text-gray-700">{eventSummary}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Motivo da Reversão (Obrigatório)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descreva por que esta ação está sendo revertida..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-secondary font-bold focus:ring-2 focus:ring-red-500/10 transition-all outline-none min-h-[100px] text-sm"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onConfirm(reason)}
                            disabled={loading || !reason.trim()}
                            className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 flex items-center justify-center gap-2 uppercase text-xs tracking-widest transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <RefreshCcw size={18} />
                            )}
                            Confirmar Reversão V1
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="w-full py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                        >
                            Cancelar Operação
                        </button>
                    </div>
                </div>

                <div className="px-8 pb-8 flex items-start gap-3 text-red-400">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p className="text-[10px] font-bold leading-tight">
                        A reversão V1 restaura campos ou desfaz exclusões lógicas. Alterações em tabelas relacionadas podem exigir intervenção manual adicional.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
