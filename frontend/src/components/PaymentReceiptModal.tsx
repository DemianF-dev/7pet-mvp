import { useRef } from 'react';
import {
    X,
    Printer,
    Share2,
    CheckCircle2,
    Calendar,
    CreditCard,
    User,
    Hash,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: {
        id: string;
        amount: number;
        paidAt: string;
        method: string;
        invoiceId?: string;
    } | null;
    customerName: string;
}

export default function PaymentReceiptModal({ isOpen, onClose, payment, customerName }: PaymentReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !payment) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        const text = `Comprovante de Pagamento - 7Pet\n\nCliente: ${customerName}\nValor: R$ ${payment.amount.toFixed(2)}\nData: ${new Date(payment.paidAt).toLocaleDateString('pt-BR')}\nMétodo: ${payment.method}\nID: ${payment.id}`;

        if (navigator.share) {
            navigator.share({
                title: 'Comprovante de Pagamento 7Pet',
                text: text,
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(text);
            alert('Comprovante copiado para a área de transferência!');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 print:p-0">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-secondary/60 backdrop-blur-md print:hidden"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative z-10 overflow-hidden print:shadow-none print:rounded-none print:w-full print:max-w-none print:h-full print:static"
                >
                    {/* Header - Hidden on Print */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center print:hidden">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                <CheckCircle2 size={18} />
                            </div>
                            <span className="font-bold text-secondary">Comprovante Digital</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Receipt Content */}
                    <div ref={receiptRef} className="p-10 print:p-12">
                        {/* Company Logo/Name */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center gap-2 mb-2">
                                <span className="text-2xl font-black text-secondary tracking-tighter">7Pet</span>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Centro de Estética & Saúde Animal</p>
                        </div>

                        {/* Status Label */}
                        <div className="bg-green-50 text-green-700 py-3 rounded-2xl text-center mb-10 border border-green-100 print:bg-white print:border-gray-200">
                            <p className="text-xs font-black uppercase tracking-widest">Pagamento Confirmado</p>
                            <p className="text-3xl font-black mt-1">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        {/* Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 print:hidden">
                                    <User size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tutor / Cliente</p>
                                    <p className="font-bold text-secondary">{customerName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 print:hidden">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</p>
                                        <p className="font-bold text-secondary text-sm">{new Date(payment.paidAt).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 print:hidden">
                                        <CreditCard size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Método</p>
                                        <p className="font-bold text-secondary text-sm">{payment.method}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 print:hidden">
                                    <Hash size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID do Comprovante</p>
                                    <p className="text-[10px] font-mono font-medium text-gray-500 break-all uppercase tracking-tighter">{payment.id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="mt-12 pt-8 border-t border-dashed border-gray-200 text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-400 mb-4 print:hidden">
                                <Building2 size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">7Pet Soluções Pet</span>
                            </div>
                            <p className="text-[9px] text-gray-400 leading-relaxed italic">
                                Este é um comprovante digital válido. Obrigado pela preferência e confiança em nossos serviços!
                            </p>
                        </div>
                    </div>

                    {/* Actions - Hidden on Print */}
                    <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="flex-1 py-4 bg-secondary text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-secondary/10"
                        >
                            <Printer size={18} /> Imprimir
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-4 bg-white text-secondary border border-gray-200 font-bold rounded-2xl flex items-center justify-center hover:bg-gray-100 transition-all"
                        >
                            <Share2 size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Styles for print */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    div[role="dialog"] {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                    }
                }
            ` }} />
        </AnimatePresence>
    );
}
