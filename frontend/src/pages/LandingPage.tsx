import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
    const navigate = useNavigate();

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
                        <a
                            href="https://wa.me/5511983966451"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white font-bold rounded-2xl shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <MessageCircle size={20} />
                            Falar no WhatsApp
                        </a>
                    </div>

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
