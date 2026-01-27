import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PastDateConfirmModalProps {
    isOpen: boolean;
    appointmentDate: string; // ISO format
    onConfirm: () => void;
    onCancel: () => void;
}

export default function PastDateConfirmModal({
    isOpen,
    appointmentDate,
    onConfirm,
    onCancel
}: PastDateConfirmModalProps) {
    if (!isOpen) return null;

    const date = new Date(appointmentDate);
    const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-[48px] p-10 max-w-lg w-full shadow-2xl border-4 border-amber-400"
                >
                    {/* Icon Warning */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                            <AlertTriangle size={40} className="text-amber-500" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-black text-center text-secondary mb-4">
                        ⚠️ Atenção!
                    </h2>

                    {/* Message */}
                    <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-200 mb-6">
                        <p className="text-center text-gray-700 font-bold mb-4">
                            Você está tentando agendar para uma <span className="text-amber-600 font-black">data/horário que já passou</span>:
                        </p>

                        <div className="flex flex-col gap-3 items-center">
                            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-amber-200">
                                <Calendar size={20} className="text-amber-600" />
                                <span className="font-black text-secondary">{formattedDate}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-amber-200">
                                <Clock size={20} className="text-amber-600" />
                                <span className="font-black text-secondary">{formattedTime}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-[24px] mb-8">
                        <p className="text-sm text-gray-600 text-center font-medium leading-relaxed">
                            Normalmente, agendamentos devem ser feitos para <span className="font-black text-secondary">datas futuras</span>.
                            <br /><br />
                            Se você está fazendo um <span className="font-black text-primary">ajuste retroativo</span> ou corrigindo um registro, confirme abaixo para continuar.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-8 py-5 rounded-[28px] font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all border-2 border-gray-200 uppercase tracking-wide text-sm"
                        >
                            ❌ Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-8 py-5 rounded-[28px] font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/30 uppercase tracking-wide text-sm"
                        >
                            ✅ Sim, Confirmar
                        </button>
                    </div>

                    {/* Footer notice */}
                    <p className="text-[10px] text-gray-400 text-center mt-6 font-bold uppercase tracking-wider">
                        Esta confirmação é necessária para garantir a precisão dos registros
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
