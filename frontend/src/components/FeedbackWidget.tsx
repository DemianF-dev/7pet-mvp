import { useState, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { MessageSquarePlus, X, Send, Image as ImageIcon, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function FeedbackWidget() {
    const { user } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error('Por favor, descreva o problema ou sugestão.');
            return;
        }

        setIsSending(true);
        try {
            await api.post('/support', {
                description,
                imageUrl: image
            });
            setIsSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setIsSuccess(false);
                setDescription('');
                setImage(null);
            }, 2000);
        } catch (error) {
            console.error('Error sending feedback:', error);
            toast.error('Erro ao enviar solicitação.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.4 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-[85px] right-4 sm:bottom-6 sm:right-6 z-[60] bg-[var(--color-text-tertiary)]/40 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 text-white p-2 sm:p-4 rounded-full shadow-md sm:shadow-2xl active:scale-95 transition-all group backdrop-blur-md"
                title="Solicitar Ajuste ou Melhoria"
                style={{
                    bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 85px)'
                }}
            >
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-4 sm:h-4 bg-red-500 rounded-full animate-pulse border border-white sm:border-0" />
                <MessageSquarePlus size={16} className="sm:w-[24px] sm:h-[24px] group-hover:rotate-12 transition-transform" />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 perspective-1000">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ y: '100%', opacity: 0, rotateX: 20 }}
                            animate={{ y: 0, opacity: 1, rotateX: 0 }}
                            exit={{ y: '100%', opacity: 0, rotateX: 20 }}
                            className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center relative shrink-0">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                                    <AlertTriangle size={32} />
                                </div>
                                <h2 className="text-xl font-black uppercase tracking-wide">Solicitar Ajuste</h2>
                                <p className="text-purple-100 text-sm font-medium mt-1">Encontrou um erro ou tem uma ideia?</p>
                            </div>

                            {/* Body */}
                            <div className="p-6 overflow-y-auto">
                                {isSuccess ? (
                                    <div className="py-12 text-center">
                                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                            <CheckCircle2 size={40} />
                                        </div>
                                        <h3 className="text-2xl font-black text-secondary">Recebido!</h3>
                                        <p className="text-gray-400 mt-2 font-medium">Sua solicitação foi enviada para o desenvolvedor.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                                            <span>{user.name}</span>
                                            <span>{new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}</span>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                                                Descrição do Problema / Sugestão
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Descreva o que aconteceu ou sua ideia..."
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-purple-500/20 rounded-2xl p-4 min-h-[120px] text-sm font-medium resize-none transition-all placeholder:text-gray-300"
                                                autoFocus
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">
                                                Anexo (Opcional)
                                            </label>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="image/*"
                                                className="hidden"
                                            />

                                            {image ? (
                                                <div className="relative rounded-2xl overflow-hidden border border-gray-200 group">
                                                    <img src={image} alt="Preview" className="w-full h-48 object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                                                >
                                                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-purple-100 transition-colors">
                                                        <ImageIcon size={20} className="group-hover:text-purple-600" />
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-widest">Adicionar Print/Imagem</span>
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSending || !description.trim()}
                                            className="w-full py-4 bg-secondary text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-secondary/20 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-4"
                                        >
                                            {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                                            {isSending ? 'Enviando...' : 'Enviar Solicitação'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
