
import React, { useState, useEffect } from 'react';
import {
    X,
    Printer,
    Calendar,
    User,
    CreditCard,
    Package,
    Trash2,
    RefreshCcw,
    Download,
    Share2,
    MessageCircle,
    CheckCircle,
    AlertTriangle,
    Undo2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { IconButton } from '../ui/IconButton';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    onActionCompleted?: () => void;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId, onActionCompleted }: OrderDetailsModalProps) {
    const { pos } = useServices();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [showWhatsAppChoice, setShowWhatsAppChoice] = useState(false);

    const fetchDetails = async () => {
        setIsLoading(true);
        try {
            const data = await pos.getOrder(orderId);
            setOrder(data);
        } catch (err) {
            console.error('Erro ao buscar detalhes:', err);
            toast.error('Erro ao carregar dados da venda.');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && orderId) {
            fetchDetails();
        }
    }, [isOpen, orderId]);

    const handleCancel = async () => {
        if (!cancelReason) return toast.error('Por favor, informe o motivo.');
        setIsActionLoading(true);
        try {
            await pos.cancelOrder(orderId, cancelReason);
            toast.success('Venda cancelada com sucesso!');
            setShowCancelConfirm(false);
            onActionCompleted?.();
            fetchDetails();
        } catch (err) {
            toast.error('Erro ao cancelar venda.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleExchange = async () => {
        if (!window.confirm('A troca requer o cancelamento desta venda primeiro. Deseja continuar?')) return;

        const reason = prompt('Motivo da troca/devolução:');
        if (!reason) return;

        setIsActionLoading(true);
        try {
            await pos.cancelOrder(orderId, reason);
            toast.success('Venda cancelada para troca. Redirecionando ao PDV...');
            onActionCompleted?.();
            onClose();
            navigate(`/staff/pos?exchangeOrderId=${orderId}`);
        } catch (err) {
            toast.error('Erro ao processar troca.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleShareWhatsApp = async (business: boolean = false) => {
        if (!order) return;

        let message = `*RECIBO DE VENDA - 7PET*\n`;
        message += `Ref: #${order.seqId}\n`;
        message += `Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}\n`;
        message += `Cliente: ${order.customer?.name || 'Venda S/ Identificação'}\n\n`;
        message += `*ITENS:*\n`;
        order.items.forEach((item: any) => {
            message += `• ${item.quantity}x ${item.description}: R$ ${item.totalPrice.toFixed(2)}\n`;
        });
        message += `\n*TOTAL: R$ ${order.finalAmount.toFixed(2)}*\n\n`;
        message += `Obrigado pela preferência! 🐾`;

        try {
            await navigator.clipboard.writeText(message);
            toast.success('Recibo copiado para a área de transferência!');
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }

        const phone = order.customer?.phone?.replace(/\D/g, '') || '';
        const baseUrl = business ? 'https://wa.me/' : 'https://api.whatsapp.com/send?phone=';

        window.open(`${baseUrl}${phone}&text=${encodeURIComponent(message)}`, '_blank');
        setShowWhatsAppChoice(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 30 }}
                className="bg-[var(--color-bg-primary)] rounded-[40px] w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden border border-[var(--color-border)]"
            >
                {/* Header */}
                <div className="p-8 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]/30 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-black text-[var(--color-text-primary)]">Detalhes da Venda</h2>
                            {order && (
                                <Badge variant={order.status === 'PAID' ? 'success' : order.status === 'CANCELLED' ? 'error' : 'warning'}>
                                    {order.status === 'PAID' ? 'PAGO' : order.status === 'CANCELLED' ? 'CANCELADO' : 'ABERTO'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] font-bold uppercase tracking-[0.2em]">PDV #{order?.seqId || '...'}</p>
                    </div>
                    <IconButton icon={X} onClick={onClose} variant="ghost" aria-label="Fechar" />
                </div>

                <div className="flex flex-col md:flex-row h-[600px]">
                    {/* Left Side: Info */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 border-r border-[var(--color-border-subtle)]">
                        {isLoading ? (
                            <div className="space-y-4">
                                <div className="h-20 bg-gray-100 animate-pulse rounded-3xl" />
                                <div className="h-40 bg-gray-100 animate-pulse rounded-3xl" />
                            </div>
                        ) : (
                            <>
                                {/* Items Section */}
                                <div>
                                    <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Package size={14} className="text-[var(--color-accent-primary)]" />
                                        Itens Comprados
                                    </h3>
                                    <div className="space-y-3">
                                        {order.items.map((item: any) => (
                                            <div key={item.id} className="flex justify-between items-start bg-[var(--color-bg-secondary)] p-4 rounded-2xl border border-[var(--color-border-subtle)]">
                                                <div>
                                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{item.description}</p>
                                                    <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase">
                                                        {item.quantity}x R$ {item.unitPrice.toFixed(2)}
                                                        {item.discount > 0 && <span className="text-red-500 ml-2">- R$ {item.discount.toFixed(2)} Desc.</span>}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-black text-[var(--color-text-primary)]">R$ {item.totalPrice.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-[var(--color-accent-primary)]/5 p-6 rounded-[32px] border border-[var(--color-accent-primary)]/10">
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                                            <span>Subtotal</span>
                                            <span>R$ {order.totalAmount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-bold text-red-500 uppercase tracking-wider border-b border-gray-100 pb-2">
                                            <span>Desconto</span>
                                            <span>- R$ {order.discountAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black text-[var(--color-text-primary)] uppercase tracking-tighter">Total Final</span>
                                        <span className="text-3xl font-black text-[var(--color-accent-primary)]">R$ {order.finalAmount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Payments Side */}
                                <div>
                                    <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <CreditCard size={14} className="text-[var(--color-accent-primary)]" />
                                        Pagamentos Efetuados
                                    </h3>
                                    <div className="space-y-2">
                                        {order.payments.map((p: any) => (
                                            <div key={p.id} className="flex justify-between items-center text-xs font-bold bg-gray-50 p-3 rounded-xl">
                                                <span className="text-gray-500 uppercase">{p.method.replace(/_/g, ' ')}</span>
                                                <span className="text-secondary tracking-tight">R$ {p.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Side: Actions */}
                    <div className="w-full md:w-64 bg-[var(--color-bg-tertiary)]/50 p-8 flex flex-col gap-4">
                        <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Comprovante</h3>
                        <Button variant="outline" className="justify-start gap-3 h-14 rounded-2xl border-[var(--color-border)] shadow-sm bg-white" onClick={() => window.print()}>
                            <Printer size={18} /> Imprimir
                        </Button>
                        <Button variant="outline" className="justify-start gap-3 h-14 rounded-2xl border-[var(--color-border)] shadow-sm bg-white">
                            <Download size={18} /> Baixar PDF
                        </Button>

                        <div className="relative">
                            {!showWhatsAppChoice ? (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-3 h-14 rounded-2xl border-green-100 shadow-sm bg-green-50/30 text-green-700 hover:bg-green-50 transition-all"
                                    onClick={() => setShowWhatsAppChoice(true)}
                                >
                                    <MessageCircle size={18} /> Enviar WhatsApp
                                </Button>
                            ) : (
                                <div className="flex bg-green-50 rounded-2xl border border-green-100 overflow-hidden h-14 animate-in fade-in zoom-in duration-200">
                                    <button
                                        onClick={() => handleShareWhatsApp(false)}
                                        className="flex-1 text-[10px] font-black uppercase text-green-700 hover:bg-green-100 transition-colors border-r border-green-100"
                                    >
                                        Pessoal
                                    </button>
                                    <button
                                        onClick={() => handleShareWhatsApp(true)}
                                        className="flex-1 text-[10px] font-black uppercase text-green-700 hover:bg-green-200 transition-colors"
                                    >
                                        Business
                                    </button>
                                    <button
                                        onClick={() => setShowWhatsAppChoice(false)}
                                        className="px-3 text-green-400 hover:text-green-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-[var(--color-border-subtle)] my-2" />

                        <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2">Gestão</h3>
                        <Button
                            variant="outline"
                            className="justify-start gap-3 h-14 rounded-2xl border-[var(--color-border)] shadow-sm bg-white"
                            onClick={handleExchange}
                            disabled={order?.status === 'CANCELLED'}
                        >
                            <RefreshCcw size={18} /> Troca de Item
                        </Button>
                        <Button
                            variant="outline"
                            className="justify-start gap-3 h-14 rounded-2xl border-red-100 shadow-sm bg-red-50/30 text-red-600 hover:bg-red-50 transition-all"
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={order?.status === 'CANCELLED'}
                        >
                            <Trash2 size={18} /> Cancelar Cupom
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Cancel Confirm Overlay */}
            <AnimatePresence>
                {showCancelConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <Card className="max-w-md w-full p-8 rounded-[40px] shadow-2xl border-2 border-red-100">
                            <div className="flex items-center gap-4 mb-6 text-red-600">
                                <div className="p-3 bg-red-50 rounded-2xl">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-xl font-black">Confirmar Cancelamento</h3>
                            </div>
                            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                                Esta ação irá estornar o financeiro do cliente e devolver os itens ao estoque.
                                <span className="font-bold text-red-600 block mt-2 underline decoration-2 underline-offset-4">Esta ação é irreversível.</span>
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mb-2 block">Motivo do Cancelamento</label>
                                    <textarea
                                        className="w-full bg-gray-50 border-gray-100 rounded-3xl p-4 text-sm font-medium focus:ring-2 focus:ring-red-100 outline-none h-32"
                                        placeholder="Ex: Cliente desistiu da compra..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setShowCancelConfirm(false)}>Desistir</Button>
                                    <Button
                                        className="flex-1 h-14 rounded-2xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-xl shadow-red-500/20"
                                        onClick={handleCancel}
                                        isLoading={isActionLoading}
                                    >
                                        Confirmar
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
