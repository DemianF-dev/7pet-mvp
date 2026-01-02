import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function LandingPage() {
    const navigate = useNavigate();
    const [showWASelector, setShowWASelector] = useState(false);

    const handleWhatsAppRedirect = (type: 'personal' | 'business') => {
        const phone = '5511983966451';
        const message = 'Olá! Gostaria de mais informações sobre os serviços da 7Pet.';
        const baseUrl = 'https://wa.me/';

        // Note: For web, the URL is the same, but we can potentially use different deep links if needed.
        // For now, standard wa.me is the most compatible. The choice is more for UX clarity as requested.
        window.open(`${baseUrl}${phone}?text=${encodeURIComponent(message)}`, '_blank');
        setShowWASelector(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=2669')] bg-cover bg-center">
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center gap-12"
            >
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                        <img src="/logo.png" className="w-10 h-10 rounded-xl object-contain" alt="Logo" />
                        <h1 className="text-3xl font-bold text-secondary">7Pet</h1>
                    </div>

                    <h2 className="text-5xl font-extrabold text-secondary leading-tight">
                        Cuidando do seu melhor amigo com <span className="text-primary italic">carinho.</span>
                    </h2>

                    <p className="text-lg text-gray-600 max-w-md">
                        Gestão completa de Pet Shop, Spa e Transporte em um só lugar. Simples, rápido e integrado.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button
                            onClick={() => navigate('/client')}
                            className="btn-primary group"
                        >
                            <User size={20} />
                            Área do Cliente
                        </button>
                        <button
                            onClick={() => navigate('/staff/login')}
                            className="btn-secondary"
                        >
                            <ShieldCheck size={20} />
                            Acesso Colaborador
                        </button>
                        <button
                            onClick={() => setShowWASelector(true)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white font-bold rounded-2xl shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <MessageCircle size={20} />
                            Falar no WhatsApp
                        </button>
                    </div>

                    <AnimatePresence>
                        {showWASelector && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setShowWASelector(false)}
                                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl space-y-6"
                                    >
                                        <div className="text-center">
                                            <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center text-[#25D366] mx-auto mb-4">
                                                <MessageCircle size={32} />
                                            </div>
                                            <h3 className="text-2xl font-black text-secondary">Escolha o App</h3>
                                            <p className="text-gray-500 text-sm mt-2">Por qual WhatsApp você deseja enviar a mensagem?</p>
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleWhatsAppRedirect('personal')}
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-[#25D366]/5 border border-gray-100 hover:border-[#25D366]/30 rounded-2xl transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#25D366]">
                                                        <MessageCircle size={20} />
                                                    </div>
                                                    <span className="font-bold text-secondary text-sm">WhatsApp Comum</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-[#25D366] group-hover:border-[#25D366] group-hover:text-white transition-all">
                                                    <ShieldCheck size={14} />
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleWhatsAppRedirect('business')}
                                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-primary/5 border border-gray-100 hover:border-primary/30 rounded-2xl transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                                        <MessageCircle size={20} />
                                                    </div>
                                                    <span className="font-bold text-secondary text-sm">WhatsApp Business</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
                                                    <ShieldCheck size={14} />
                                                </div>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setShowWASelector(false)}
                                            className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-secondary transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    </motion.div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    <div className="flex items-center gap-2 text-sm text-gray-500 pt-4">
                        <ShieldCheck size={16} className="text-primary" />
                        Acesso seguro e integrado.
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-1 hidden md:block"
                >
                    <img
                        src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=1000"
                        alt="Happy Golden Retriever"
                        className="rounded-[40px] shadow-2xl border-8 border-white"
                    />
                </motion.div>
            </motion.div>

            <footer className="relative z-10 mt-12 text-gray-400 text-sm">
                <p>© 2025 7Pet. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
}
