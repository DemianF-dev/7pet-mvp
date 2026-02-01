import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Plus,
    Loader2,
    Send,
    CheckCircle2,
    AlertTriangle,
    Brain,
    ShieldAlert,
    Cpu
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { socketManager } from '../../services/socketManager';

import api from '../../services/api';
import toast from 'react-hot-toast';
import { AIChatWidget } from '../AIChatWidget';
import { useIsMobile } from '../../hooks/useIsMobile';
import DiagnosticsModal from '../DiagnosticsModal';

export function FloatingActionDock() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const { user } = useAuthStore();
    const { isMobile } = useIsMobile();

    // Permission Check
    const allowedBrain = ['ADMIN', 'MASTER', 'GESTAO', 'DIRETORIA'];
    const userRole = (user?.role || '').toUpperCase();
    const userDivision = (user?.division || '').toUpperCase();
    const isDev = user?.email === 'oidemianf@gmail.com';
    const hasBrainAccess = isDev || allowedBrain.includes(userRole) || allowedBrain.includes(userDivision);

    const toggleOpen = () => setIsOpen(!isOpen);

    // Socket Status Logic for the status dot
    const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

    useEffect(() => {
        const updateStatus = () => {
            const socket = socketManager.getRawSocket();
            if (socket?.connected) setSocketStatus('connected');
            else setSocketStatus('disconnected');
        };

        const interval = setInterval(updateStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (socketStatus) {
            case 'connected': return 'bg-emerald-500';
            case 'reconnecting': return 'bg-yellow-500';
            default: return 'bg-red-500';
        }
    };

    return (
        <>
            <div
                className={`fixed z-[100] flex flex-col items-end gap-2 pointer-events-none transition-all duration-300 ${isMobile ? 'bottom-[calc(var(--nav-bottom-height)+var(--safe-area-bottom))] right-0' : 'bottom-6 right-6'
                    }`}
            >
                {/* Expandable Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="flex flex-col gap-2 mb-2 mr-2 pointer-events-auto"
                        >
                            {/* AI Brain Button - Conditional */}
                            {hasBrainAccess && (
                                <button
                                    onClick={() => { setIsChatOpen(true); setIsOpen(false); }}
                                    className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 active:scale-95 transition-all text-xs font-bold text-gray-700 dark:text-gray-200"
                                >
                                    <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                        <Brain size={18} />
                                    </div>
                                    Cérebro 7Pet
                                </button>
                            )}

                            {/* Technical Help (Diagnostics) */}
                            <button
                                onClick={() => { setIsStatusModalOpen(true); setIsOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 active:scale-95 transition-all text-xs font-bold text-gray-700 dark:text-gray-200"
                            >
                                <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <ShieldAlert size={18} />
                                </div>
                                Suporte Técnico
                            </button>

                            {/* Feedback Button */}
                            <button
                                onClick={() => { setIsFeedbackOpen(true); setIsOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 active:scale-95 transition-all text-xs font-bold text-gray-700 dark:text-gray-200"
                            >
                                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                    <AlertTriangle size={18} />
                                </div>
                                Reportar Problema
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Toggle Button (The "Orelhinha") */}
                <motion.button
                    onClick={toggleOpen}
                    className={`pointer-events-auto bg-zinc-900/10 dark:bg-white/5 backdrop-blur-md text-zinc-900/40 dark:text-white/40 shadow-sm flex items-center justify-center active:scale-90 transition-all relative z-[101] border-l border-t border-white/10 dark:border-black/5 ${isMobile
                        ? 'w-10 h-8 rounded-tl-2xl'
                        : 'w-14 h-14 rounded-full shadow-lg'
                        } ${isOpen ? '!bg-zinc-900 dark:!bg-white !text-white dark:!text-zinc-900 !opacity-100 !rounded-full !w-10 !h-10 !mr-2 !mb-2' : ''}`}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Menu de Suporte e IA"
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X size={isMobile ? 18 : 24} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                className="relative"
                            >
                                {isMobile ? <Cpu size={16} /> : <Plus size={28} />}
                                {/* Status dot on the main button when closed */}
                                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white/20 dark:border-black/20 ${getStatusColor()}`} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* Modals and Widgets Control */}
            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

            <DiagnosticsModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />

            <AIChatWidget
                externalIsOpen={isChatOpen}
                onExternalClose={() => setIsChatOpen(false)}
                hideFloatingButton={true}
            />
        </>
    );
}

// Inline Feedback Modal Component
function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuthStore();
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setIsSuccess(false);
                setDescription('');
                setImage(null);
            }, 300);
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error('Por favor, descreva o problema.');
            return;
        }

        setIsSending(true);
        try {
            await api.post('/support', { description, imageUrl: image });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            toast.error('Erro ao enviar solicitação.');
        } finally {
            setIsSending(false);
        }
    };

    if (!user) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: '100%', opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: '100%', opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] z-10"
                    >
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center relative shrink-0">
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                                <AlertTriangle size={24} />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-wide">Solicitar Ajuste</h2>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {isSuccess ? (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Recebido!</h3>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Descreve o problema ou sugestão..."
                                        className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl p-4 min-h-[100px] text-sm resize-none"
                                        autoFocus
                                    />

                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {image ? (
                                            <div className="relative rounded-2xl overflow-hidden h-32 group">
                                                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl text-xs font-bold text-gray-400 uppercase tracking-widest hover:border-amber-400 hover:text-amber-500 transition-colors"
                                            >
                                                Adicionar Print
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSending || !description.trim()}
                                        className="w-full py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                                        {isSending ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
