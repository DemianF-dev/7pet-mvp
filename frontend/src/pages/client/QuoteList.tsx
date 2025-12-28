import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { FileText, ArrowRight, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

interface Quote {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: { description: string; quantity: number; price: number }[];
    pet?: { name: string };
    desiredAt?: string;
}

const statusConfig: any = {
    'SOLICITADO': { label: 'Solicitado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'EM_PRODUCAO': { label: 'Em Análise', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    'ENVIADO': { label: 'Validado, Aguardando Aprovação', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'RECALCULADO': { label: 'Recalculado', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'APROVADO': { label: 'Aprovado', color: 'bg-green-100 text-green-700 border-green-200' },
    'REJEITADO': { label: 'Reprovado', color: 'bg-red-100 text-red-700 border-red-200' },
    'AGENDAR': { label: 'Agendar Atendimento', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

export default function QuoteList() {
    const { } = useAuthStore();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    const fetchQuotes = async (refresh = false) => {
        if (refresh) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const response = await api.get('/quotes');
            setQuotes(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Erro ao buscar orçamentos:', err);
            setError(err.message || 'Erro desconhecido');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const handleAction = async (id: string, status: 'APROVADO' | 'REJEITADO') => {
        try {
            await api.patch(`/quotes/${id}/status`, { status });
            fetchQuotes();
            setSelectedQuote(null);
        } catch (err) {
            console.error('Erro ao atualizar orçamento:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-6xl">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-secondary">Meus <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Orçamentos</span></h1>
                        <p className="text-gray-500 mt-3">Acompanhe suas solicitações e aprove orçamentos enviados.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchQuotes(true)}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-secondary font-bold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            <ArrowRight size={18} className={`transition-transform ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: isRefreshing ? 'rotate(90deg)' : 'none' }} />
                            {isRefreshing ? 'Atualizando...' : 'Atualizar Lista'}
                        </button>
                        <button onClick={() => window.location.href = '/client/quote-request'} className="btn-primary flex items-center gap-2">
                            Nova Solicitação <ArrowRight size={18} />
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
                        <XCircle size={24} />
                        <div>
                            <p className="font-bold">Erro ao carregar orçamentos</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">

                        {quotes.map((quote) => (
                            <motion.div
                                key={quote.id}
                                layoutId={quote.id}
                                onClick={() => setSelectedQuote(quote)}
                                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center gap-6 group hover:border-primary/40 hover:shadow-md transition-all mb-4 cursor-pointer"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-secondary">
                                            Orçamento #{quote.id.substring(0, 8).toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-400">
                                            {quote.pet ? `Pet: ${quote.pet.name}` : 'Sem pet associado'} •
                                            Solicitado em {new Date(quote.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 flex-1 justify-center">
                                    <div className="space-y-1 text-center">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Status</p>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border ${statusConfig[quote.status]?.color || 'bg-gray-200'}`}>
                                            {statusConfig[quote.status]?.label || quote.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-center">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Valor Total</p>
                                        <p className="text-lg font-black text-secondary">
                                            {quote.totalAmount > 0 ? `R$ ${quote.totalAmount.toFixed(2)}` : '--'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedQuote(quote); }}
                                        className="p-3 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary-light rounded-2xl transition-all"
                                    >
                                        <Eye size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {quotes.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-gray-100">
                                <FileText className="mx-auto text-gray-200 mb-4" size={64} />
                                <h3 className="text-xl font-bold text-gray-400">Nenhum orçamento encontrado.</h3>
                                <p className="text-gray-300 mb-8">Solicite seu primeiro orçamento agora!</p>
                                <button onClick={() => window.location.href = '/client/quote-request'} className="btn-primary">Criar Solicitação</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Quote Modal */}
                <AnimatePresence>
                    {selectedQuote && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedQuote(null)}
                                className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-40"
                            />
                            <motion.div
                                key="client-quote-modal"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="fixed inset-x-6 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-[48px] shadow-2xl z-50 overflow-y-auto max-h-[90vh] custom-scrollbar"
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-2xl font-black text-secondary">Detalhes do Orçamento</h2>
                                            <p className="text-gray-400 font-medium">#{selectedQuote.id.toUpperCase()}</p>
                                        </div>
                                        <button onClick={() => setSelectedQuote(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <XCircle className="text-gray-300" />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-50 rounded-3xl p-6">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Itens Solicitados</h4>
                                            <div className="space-y-4">
                                                {selectedQuote.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                                                        <div>
                                                            <p className="font-extrabold text-secondary">{item.description}</p>
                                                            <p className="text-xs text-gray-400">Quantidade: {item.quantity}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-primary font-bold">
                                                                {item.price > 0 ? `R$ ${(item.price * item.quantity).toFixed(2)}` : 'A calcular'}
                                                            </p>
                                                            {item.quantity > 1 && <p className="text-[10px] text-gray-300">R$ {item.price.toFixed(2)} / un</p>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center p-6 border-t border-gray-100">
                                            <span className="text-lg font-bold text-secondary">Total do Orçamento</span>
                                            <span className="text-3xl font-black text-primary">
                                                {selectedQuote.totalAmount > 0 ? `R$ ${selectedQuote.totalAmount.toFixed(2)}` : 'Sob análise'}
                                            </span>
                                        </div>

                                        {selectedQuote.status === 'ENVIADO' && (
                                            <div className="flex gap-4 pt-4">
                                                <button
                                                    onClick={() => handleAction(selectedQuote.id, 'REJEITADO')}
                                                    className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                                >
                                                    Recusar
                                                </button>
                                                <button
                                                    onClick={() => handleAction(selectedQuote.id, 'APROVADO')}
                                                    className="flex-2 px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                                >
                                                    <CheckCircle2 size={18} /> Aprovar Agora
                                                </button>
                                            </div>
                                        )}
                                        {selectedQuote.status === 'AGENDAR' && (
                                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center space-y-4">
                                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-emerald-800">Orçamento Aprovado!</h4>
                                                    <p className="text-sm text-emerald-600">Agora você já pode agendar o horário do seu pet. Chame-nos no WhatsApp para finalizar.</p>
                                                </div>
                                                <button
                                                    onClick={() => window.open(`https://wa.me/5511999999999?text=Olá, quero agendar o serviço do orçamento ${selectedQuote.id.substring(0, 8)}`, '_blank')}
                                                    className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Agendar via WhatsApp
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
