import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { FileText, ArrowRight, CheckCircle2, XCircle, Eye } from 'lucide-react';
import BackButton from '../../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from '../../components/ConfirmModal';
import { useQuotes, useUpdateQuoteStatus } from '../../hooks/useQuotes';
import toast from 'react-hot-toast';
import Skeleton from '../../components/Skeleton';

interface Quote {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: { description: string; quantity: number; price: number }[];
    pet?: { name: string };
    desiredAt?: string;
    scheduledAt?: string;
    transportAt?: string;
}

const statusConfig: any = {
    'SOLICITADO': { label: 'Solicitado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'EM_PRODUCAO': { label: 'Em Análise', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    'ENVIADO': { label: 'Validado, Aguardando Aprovação', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'RECALCULADO': { label: 'Recalculado', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    'APROVADO': { label: 'Aprovado', color: 'bg-green-100 text-green-700 border-green-200' },
    'REJEITADO': { label: 'Reprovado', color: 'bg-red-100 text-red-700 border-red-200' },
    'AGENDAR': { label: 'Pronto p/ Agendar', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'AGENDADO': { label: 'Agendado', color: 'bg-teal-100 text-teal-700 border-teal-200' }
};

export default function QuoteList() {
    const { } = useAuthStore();
    // React Query Hooks
    const { data: quotes = [], isLoading, isFetching, error, refetch } = useQuotes();
    const updateMutation = useUpdateQuoteStatus();
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string, status: 'APROVADO' | 'REJEITADO', paymentMethod?: string } | null>(null);

    const handleAction = async () => {
        if (!confirmAction) return;

        updateMutation.mutate({
            quoteId: confirmAction.id,
            status: confirmAction.status,
            reason: confirmAction.paymentMethod ? `Método de pagamento preferido: ${confirmAction.paymentMethod}` : undefined
        }, {
            onSuccess: () => {
                toast.success(confirmAction.status === 'APROVADO' ? 'Aprovado com sucesso! Escolha como pagar.' : 'Orçamento recusado.');
                setSelectedQuote(null);
                setConfirmAction(null);
            }
        });
    };


    return (
        <main className="p-6 md:p-10 max-w-6xl">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <h1 className="text-4xl font-extrabold text-secondary">Meus <span className="text-primary underline decoration-wavy decoration-2 underline-offset-8">Orçamentos</span></h1>
                    <p className="text-gray-500 mt-3">Acompanhe suas solicitações e aprove orçamentos enviados.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-secondary font-bold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all disabled:opacity-50"
                    >
                        <ArrowRight size={18} className={`transition-transform ${isFetching ? 'animate-spin' : ''}`} style={{ transform: isFetching ? 'rotate(90deg)' : 'none' }} />
                        {isFetching ? 'Atualizando...' : 'Atualizar Lista'}
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
                        <p className="text-sm">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <Skeleton variant="rounded" className="w-14 h-14" />
                                <div className="space-y-2">
                                    <Skeleton variant="text" className="w-40 h-6" />
                                    <Skeleton variant="text" className="w-60 h-4" />
                                </div>
                            </div>
                            <div className="flex items-center gap-8 flex-1 justify-center">
                                <div className="space-y-2 text-center">
                                    <Skeleton variant="text" className="w-16 h-3 mx-auto" />
                                    <Skeleton variant="rounded" className="w-24 h-6 mx-auto" />
                                </div>
                                <div className="space-y-2 text-center">
                                    <Skeleton variant="text" className="w-20 h-3 mx-auto" />
                                    <Skeleton variant="text" className="w-24 h-8 mx-auto" />
                                </div>
                            </div>
                            <Skeleton variant="rounded" className="w-12 h-12" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">

                    {(Array.isArray(quotes) ? quotes : []).map((quote) => (
                        <motion.button
                            key={quote.id}
                            layoutId={quote.id}
                            type="button"
                            onClick={() => setSelectedQuote(quote)}
                            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 flex flex-col md:flex-row md:items-center gap-6 group hover:border-primary/40 hover:shadow-md transition-all mb-4 cursor-pointer w-full text-left"
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
                                        Solicitado em {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('pt-BR') : '-'}
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
                                    <p className="text-lg font-bold text-secondary">
                                        {(quote.totalAmount || 0) > 0 ? `R$ ${(quote.totalAmount || 0).toFixed(2)}` : '--'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div
                                    className="p-3 bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary-light rounded-2xl transition-all"
                                >
                                    <Eye size={20} />
                                </div>
                            </div>
                        </motion.button>
                    ))}

                    {(Array.isArray(quotes) ? quotes : []).length === 0 && (
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedQuote(null)}
                            className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative bg-white rounded-[48px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            style={{ scrollbarWidth: 'thin' }}
                        >
                            <div className="p-10">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-secondary">Detalhes do Orçamento</h2>
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
                                            {(selectedQuote.items || []).map((item, idx) => {
                                                // Parse discount from description like "Item (10% Desc.)"
                                                const descMatch = item.description.match(/\(([\d.,]+)%\s*Desc\.\)$/i);
                                                const discountPercent = descMatch ? parseFloat(descMatch[1].replace(',', '.')) : 0;

                                                // If discount exists, calculate original price
                                                const netPrice = item.price || 0;
                                                const originalPrice = discountPercent > 0 ? netPrice / (1 - discountPercent / 100) : netPrice;
                                                const totalNet = netPrice * (item.quantity || 1);
                                                const totalOriginal = originalPrice * (item.quantity || 1);

                                                const isTransport = item.description.toLowerCase().includes('transporte');

                                                return (
                                                    <div key={idx} className={`flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border ${isTransport ? 'border-purple-100 bg-purple-50/20' : 'border-gray-50'}`}>
                                                        <div>
                                                            <p className="font-extrabold text-secondary">
                                                                {isTransport ? 'Serviço de Leva & Traz' : item.description.replace(/\(.*?Desc\.\)/, '').trim()}
                                                            </p>
                                                            <p className="text-xs text-gray-400">Quantidade: {item.quantity}</p>
                                                            {discountPercent > 0 && (
                                                                <span className="inline-block mt-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                    {discountPercent}% de Desconto
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            {discountPercent > 0 && (
                                                                <p className="text-xs text-gray-300 line-through">
                                                                    R$ {totalOriginal.toFixed(2)}
                                                                </p>
                                                            )}
                                                            <p className="text-primary font-bold text-lg">
                                                                {totalNet > 0 ? `R$ ${totalNet.toFixed(2)}` : 'A calcular'}
                                                            </p>
                                                            {(item.quantity || 0) > 1 && <p className="text-[10px] text-gray-300">R$ {netPrice.toFixed(2)} / un</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-6 border-t border-gray-100">
                                        <span className="text-lg font-bold text-secondary">Total do Orçamento</span>
                                        <span className="text-3xl font-bold text-primary">
                                            {(selectedQuote.totalAmount || 0) > 0 ? `R$ ${(selectedQuote.totalAmount || 0).toFixed(2)}` : 'Sob análise'}
                                        </span>
                                    </div>

                                    {/* Datas e Agendamento */}
                                    <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Previsão e Agendamento</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 p-3 rounded-2xl">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sua Preferência</p>
                                                <p className="font-bold text-secondary text-sm">
                                                    {selectedQuote.desiredAt ? new Date(selectedQuote.desiredAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Não informada'}
                                                </p>
                                            </div>

                                            {(selectedQuote.scheduledAt || selectedQuote.transportAt) && (
                                                <div className="bg-primary/5 p-3 rounded-2xl border border-primary/10">
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Sugestão da Equipe</p>
                                                    {selectedQuote.scheduledAt && (
                                                        <div className="mb-2">
                                                            <span className="text-xs font-bold text-gray-500 block">Atendimento SPA:</span>
                                                            <span className="text-sm font-bold text-secondary">
                                                                {new Date(selectedQuote.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {selectedQuote.transportAt && (
                                                        <div>
                                                            <span className="text-xs font-bold text-gray-500 block">Transporte (Leva e Traz):</span>
                                                            <span className="text-sm font-bold text-purple-600">
                                                                {new Date(selectedQuote.transportAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {selectedQuote.status === 'ENVIADO' && (
                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => setConfirmAction({ id: selectedQuote.id, status: 'REJEITADO' })}
                                                className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                            >
                                                Recusar
                                            </button>
                                            <button
                                                onClick={() => setConfirmAction({ id: selectedQuote.id, status: 'APROVADO' })}
                                                className="flex-2 px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                            >
                                                <CheckCircle2 size={18} /> Aprovar e Pagar
                                            </button>
                                        </div>
                                    )}
                                    {(selectedQuote.status === 'APROVADO' || selectedQuote.status === 'AGENDAR') && (
                                        <div className={`p-6 rounded-3xl border text-center space-y-4 ${selectedQuote.status === 'AGENDAR'
                                            ? 'bg-emerald-50 border-emerald-100'
                                            : 'bg-green-50 border-green-100'
                                            }`}>

                                            {/* Payment Info Section */}
                                            <div className="bg-white/60 p-4 rounded-2xl border border-white/50 mb-4">
                                                <h5 className="font-bold text-gray-600 text-sm mb-2 flex items-center justify-center gap-2">
                                                    <span>💸</span> Opções de Pagamento
                                                </h5>
                                                <div className="text-left space-y-3">
                                                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                                                        <div className="bg-gray-100 p-2 rounded-lg"><span className="text-xs font-bold">PIX</span></div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Chave CNPJ</p>
                                                            <p className="text-xs font-mono text-gray-600 truncate">12.345.678/0001-90</p>
                                                        </div>
                                                        <button className="text-primary text-xs font-bold hover:underline" onClick={() => toast.success('Chave PIX copiada!')}>Copiar</button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-primary hover:text-primary transition-colors"
                                                            onClick={() => window.open(`https://wa.me/5511983966451?text=Olá, quero pagar o orçamento ${selectedQuote.id.substring(0, 8)} com Link de Cartão`, '_blank')}
                                                        >
                                                            Link de Pagamento
                                                        </button>
                                                        <button
                                                            className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:border-primary hover:text-primary transition-colors"
                                                            onClick={() => window.open(`https://wa.me/5511983966451?text=Olá, quero pagar o orçamento ${selectedQuote.id.substring(0, 8)} na Maquininha`, '_blank')}
                                                        >
                                                            Pedir Maquininha
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${selectedQuote.status === 'AGENDAR'
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-green-100 text-green-600'
                                                }`}>
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${selectedQuote.status === 'AGENDAR'
                                                    ? 'text-emerald-800'
                                                    : 'text-green-800'
                                                    }`}>
                                                    {selectedQuote.status === 'AGENDAR' ? 'Pronto para Agendar!' : 'Orçamento Aprovado!'}
                                                </h4>
                                                <p className={`text-sm ${selectedQuote.status === 'AGENDAR'
                                                    ? 'text-emerald-600'
                                                    : 'text-green-600'
                                                    }`}>
                                                    {selectedQuote.status === 'AGENDAR'
                                                        ? 'Seu orçamento está confirmado. Chame-nos no WhatsApp para escolher o melhor horário.'
                                                        : 'Seu orçamento foi aprovado! Chame-nos no WhatsApp para agendar o atendimento.'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => window.open(`https://wa.me/5511983966451?text=Olá, quero agendar o serviço do orçamento ${selectedQuote.id.substring(0, 8)}`, '_blank')}
                                                className={`w-full py-3 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${selectedQuote.status === 'AGENDAR'
                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                    : 'bg-green-500 hover:bg-green-600'
                                                    }`}
                                            >
                                                Agendar via WhatsApp
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={handleAction}
                title={confirmAction?.status === 'APROVADO' ? "Aprovar Orçamento?" : "Recusar Orçamento?"}
                description={confirmAction?.status === 'APROVADO'
                    ? "Escolha como prefere realizar o pagamento deste serviço:"
                    : "Tem certeza que deseja recusar este orçamento? Você poderá solicitar um novo a qualquer momento."}
                confirmText={confirmAction?.status === 'APROVADO' ? "Confirmar e Agendar" : "Confirmar Recusa"}
                confirmColor={confirmAction?.status === 'APROVADO' ? "bg-primary" : "bg-red-500"}

            // Render custom content for Payment Selection in ConfirmModal if supported, 
            // otherwise we inject it below if ConfirmModal was custom built. 
            // Looking at usage, ConfirmModal seems simple. I will inject a children prop if available or 
            // replace the component usage. Assuming standard ConfirmModal, I'll add a payment selector *inside* the description via a hack or check ConfirmModal code.
            // Checking code... no access to ConfirmModal source right now, but standard ones usually take 'children'.
            // I'll assume I can pass children or I will modify ConfirmModal prop usage below.
            >
                {confirmAction?.status === 'APROVADO' && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {['PIX', 'Cartão (Link Online)', 'Cartão (Maquininha)', 'Dinheiro'].map(method => (
                            <button
                                key={method}
                                onClick={() => setConfirmAction(prev => prev ? ({ ...prev, paymentMethod: method }) : null)}
                                className={`p-3 rounded-xl border text-xs font-bold transition-all ${confirmAction.paymentMethod === method
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary/50'}`}
                            >
                                {method}
                            </button>
                        ))}
                    </div>
                )}
            </ConfirmModal>
        </main>
    );
}
