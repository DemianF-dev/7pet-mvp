import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Zap,
    Plus,
    X,
    MessageSquarePlus,
    Activity,
    BrainCircuit,
    Image as ImageIcon,
    Loader2,
    Send,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { useSocketLifecycle } from '../../hooks/useSocketLifecycle';
import { socketManager } from '../../services/socketManager';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AIChatWidget } from '../AIChatWidget';

export function FloatingActionDock() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [socketStatus, setSocketStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

    // Socket Status Logic
    useEffect(() => {
        const updateStatus = () => {
            if (socketManager.socket?.connected) setSocketStatus('connected');
            else if (socketManager.socket?.active) setSocketStatus('reconnecting');
            else setSocketStatus('disconnected');
        };

        updateStatus();
        const interval = setInterval(updateStatus, 2000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (socketStatus) {
            case 'connected': return 'bg-emerald-500';
            case 'reconnecting': return 'bg-yellow-500';
            default: return 'bg-red-500';
        }
    };

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 pointer-events-none">
                {/* Expandable Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            className="flex flex-col items-end gap-3 pointer-events-auto"
                        >
                            {/* Socket Status Indicator */}
                            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 pr-4 pl-3 py-2 rounded-full shadow-lg border border-gray-100 dark:border-zinc-700 backdrop-blur-md">
                                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    {socketStatus === 'connected' ? 'Online' : socketStatus === 'reconnecting' ? 'Reconectando...' : 'Offline'}
                                </span>
                            </div>

                            {/* Brain AI Chat Button */}
                            <button
                                onClick={() => { setIsChatOpen(true); setIsOpen(false); }}
                                className="group flex items-center gap-3 pl-4 pr-1 py-1 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Assistente IA</span>
                                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md group-hover:shadow-violet-500/30 transition-all">
                                    <BrainCircuit size={20} />
                                </div>
                            </button>

                            {/* Feedback Button */}
                            <button
                                onClick={() => { setIsFeedbackOpen(true); setIsOpen(false); }}
                                className="group flex items-center gap-3 pl-4 pr-1 py-1 rounded-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Reportar Problema</span>
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white shadow-md group-hover:shadow-amber-500/30 transition-all">
                                    <AlertTriangle size={20} />
                                </div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Toggle Button (The "Dock") */}
                <motion.button
                    onClick={toggleOpen}
                    className="pointer-events-auto w-14 h-14 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all relative z-[101]"
                    whileTap={{ scale: 0.9 }}
                >
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                            >
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                className="relative"
                            >
                                <Plus size={28} />
                                {/* Status dot on the main button when closed */}
                                <div className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 dark:border-white ${getStatusColor()}`} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* Modals and Widgets Control */}
            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

            {/* We control the AI Widget visibility via prop if possible, 
                but currently AIChatWidget manages its own state internally. 
                Ideally we should lift state up, but for now we can wrap it or just render it always 
                and let it handle its own minimizing. 
                However, to unify, we might want to hide the default button of AIChatWidget.
                For this MVP step, we will assume AIChatWidget renders its own button and we might need to modify it.
                Wait, the user wants ONE unified island. So we should modify AIChatWidget to respond to our open command
                OR render it directly here.
            */}

            {/* 
                HACK: The AIChatWidget is complex. Let's just conditionally render it passed through a prop 
                or assume we modify it to accept isOpen.
                For now, let's just assume we can mount it and it will show its button. 
                BUT the user wants the button GONE.
                So we will render AIChatWidget but likely need to tell it to be hidden until activated.
             */}
            <AIChatWidget
                externalIsOpen={isChatOpen}
                onExternalClose={() => setIsChatOpen(false)}
                hideFloatingButton={true}
            />
        </>
    );
}

// Inline Feedback Modal Component (ported from FeedbackWidget)
function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { user } = useAuthStore();
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed
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
                        {/* Modal Content (simplified from original) */}
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
