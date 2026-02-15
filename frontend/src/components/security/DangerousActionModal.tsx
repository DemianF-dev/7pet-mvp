import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check } from 'lucide-react';

interface DangerousActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export const DangerousActionModal: React.FC<DangerousActionModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description
}) => {
    const [confirmText, setConfirmText] = useState('');
    const [understand, setUnderstand] = useState(false);

    if (!isOpen) return null;

    const isValid = confirmText === 'CONFIRMAR' && understand;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-slate-900 border border-red-500/20 rounded-[32px] overflow-hidden shadow-2xl"
            >
                <div className="p-10">
                    <div className="flex items-center gap-5 mb-8">
                        <div className="p-4 bg-red-500/10 rounded-[24px] text-red-500 border border-red-500/20 shadow-inner">
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{title}</h3>
                            <p className="text-[10px] text-red-500/60 font-mono uppercase tracking-[0.2em] font-bold mt-1">
                                Critical Confirmation Required
                            </p>
                        </div>
                    </div>

                    <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
                        {description}
                    </p>

                    <div className="space-y-8">
                        <div className="bg-black/40 p-6 rounded-[28px] border border-white/5 shadow-inner">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-4">
                                Type <span className="text-red-500">CONFIRMAR</span> to proceed
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                placeholder="CONFIRMAR"
                                className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl px-6 py-4 text-white font-mono font-bold text-center tracking-[0.4em] focus:border-red-500/50 focus:bg-slate-800 focus:outline-none transition-all placeholder:text-slate-800"
                            />
                        </div>

                        <label className="flex items-start gap-4 cursor-pointer group bg-red-500/5 p-5 rounded-2xl border border-red-500/10 hover:border-red-500/20 transition-all">
                            <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${understand ? 'bg-red-500 border-red-500 shadow-lg shadow-red-500/20' : 'border-slate-700 group-hover:border-slate-500'
                                }`}>
                                {understand && <Check size={14} className="text-white" strokeWidth={4} />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={understand}
                                onChange={(e) => setUnderstand(e.target.checked)}
                            />
                            <span className="text-xs text-slate-400 select-none leading-tight font-medium group-hover:text-slate-300 transition-colors">
                                Eu declaro que entendo as consequências desta ação e que ela será registrada permanentemente nos logs de auditoria do sistema.
                            </span>
                        </label>

                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-widest text-[10px] rounded-[20px] border border-white/5 transition-all"
                            >
                                Abandon Action
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (isValid) {
                                        onConfirm();
                                        onClose();
                                    }
                                }}
                                disabled={!isValid}
                                className={`flex-1 py-5 rounded-[20px] font-bold uppercase tracking-widest text-[10px] transition-all ${isValid
                                    ? 'bg-red-600 text-white shadow-xl shadow-red-600/30 hover:scale-[1.02] active:scale-95'
                                    : 'bg-slate-800/50 text-slate-600 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                Execute Final
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
