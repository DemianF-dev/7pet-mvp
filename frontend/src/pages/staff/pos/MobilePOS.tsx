import { useState, useEffect, useMemo } from 'react';
import {
    ShoppingCart, Search, Plus,
    Minus, CreditCard, DollarSign,
    QrCode, ChevronRight, CheckCircle2, Package,
    ArrowLeft, Filter, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileShell } from '../../../layouts/MobileShell';
import { useServices } from '../../../context/ServicesContext';
import toast from 'react-hot-toast';

interface CartItem {
    id: string;
    productId?: string;
    serviceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
}

export const MobilePOS = () => {
    const { pos: posService } = useServices();
    const [step, setStep] = useState(1); // 1: Cart, 2: Customer, 3: Payment
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<{ products: any[], services: any[] }>({ products: [], services: [] });
    const [payMethod, setPayMethod] = useState('PIX');
    const [isProcessing, setIsProcessing] = useState(false);

    // Initial check for active session
    const [session, setSession] = useState<any>(null);
    useEffect(() => {
        posService.getActiveSession().then(setSession);
    }, []);

    // Product/Service search
    useEffect(() => {
        if (searchTerm.length > 2) {
            const timer = setTimeout(() => {
                posService.searchItems(searchTerm).then(setSearchResults);
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setSearchResults({ products: [], services: [] });
        }
    }, [searchTerm]);

    // Totals
    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const total = subtotal; // Simplified for mobile
        return { subtotal, total };
    }, [cart]);

    const addToCart = (item: any, type: 'product' | 'service') => {
        const existing = cart.find(i => type === 'product' ? i.productId === item.id : i.serviceId === item.id);
        if (existing) {
            setCart(cart.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, {
                id: Math.random().toString(36).substr(2, 9),
                productId: type === 'product' ? item.id : undefined,
                serviceId: type === 'service' ? item.id : undefined,
                description: item.name,
                quantity: 1,
                unitPrice: type === 'product' ? item.price : item.basePrice,
                discount: 0
            }]);
        }
        setSearchTerm('');
        toast.success(`Adicionado: ${item.name}`);
    };

    const updateQty = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleFinalize = async () => {
        if (cart.length === 0) return toast.error('Carrinho vazio');
        setIsProcessing(true);
        try {
            const order = await posService.createOrder({
                customerId: selectedCustomer?.id,
                cashSessionId: session.id,
                items: cart.map(item => ({
                    productId: item.productId,
                    serviceId: item.serviceId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount
                }))
            });

            await posService.addPayment(order.id, [{
                method: payMethod,
                amount: totals.total
            }]);

            toast.success('Venda concluída!');
            setCart([]);
            setSelectedCustomer(null);
            setStep(1);
        } catch (err) {
            toast.error('Erro ao processar venda');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!session) {
        return (
            <MobileShell title="PDV Mobile">
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                        <ArrowLeft size={32} />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-2 uppercase">Caixa Fechado</h2>
                    <p className="text-sm text-gray-500 mb-6">Você precisa abrir o caixa na versão desktop antes de realizar vendas pelo mobile.</p>
                </div>
            </MobileShell>
        );
    }

    return (
        <MobileShell
            title={step === 1 ? "PDV" : step === 2 ? "Cliente" : "Pagamento"}
            showBack={step > 1}
            onBack={step > 1 ? () => setStep(step - 1) : undefined}
        >
            <div className="pb-32">
                {/* Step 1: Cart & Item Selection */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="search"
                                placeholder="Buscar produto ou serviço..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm font-medium"
                            />
                        </div>

                        {/* Search Results */}
                        <AnimatePresence>
                            {(searchResults.products.length > 0 || searchResults.services.length > 0) && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-lg"
                                >
                                    {[...searchResults.products, ...searchResults.services].map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => addToCart(item, item.price ? 'product' : 'service')}
                                            className="w-full flex items-center justify-between p-4 border-b border-gray-50 dark:border-zinc-800 last:border-0 active:bg-gray-50 dark:active:bg-zinc-800"
                                        >
                                            <div className="text-left">
                                                <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{item.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">{item.price ? 'Produto' : 'Serviço'}</p>
                                            </div>
                                            <span className="text-sm font-black text-blue-600">
                                                R$ {(item.price || item.basePrice).toFixed(2)}
                                            </span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Cart List */}
                        <div className="space-y-3">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Itens no Carrinho</h3>
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                                    <ShoppingCart size={48} strokeWidth={1} className="mb-2 opacity-20" />
                                    <p className="text-xs font-bold uppercase tracking-widest">Carrinho Vazio</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="mobile-card !p-3 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-gray-400">
                                            {item.productId ? <Package size={20} /> : <Filter size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{item.description}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">R$ {item.unitPrice.toFixed(2)} un</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800 rounded-lg p-1">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-1 text-gray-400"><Minus size={14} /></button>
                                            <span className="text-xs font-black text-gray-900 dark:text-white w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-1 text-gray-400"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Customer Selection (Simplified) */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="mobile-card !p-6 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                <User size={32} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase">Venda para:{selectedCustomer?.name || "Consumidor"}</h3>
                            <button
                                onClick={() => {/* Search Customers Flow */ }}
                                className="mt-4 text-xs font-black text-blue-600 uppercase tracking-widest border-b-2 border-blue-600/20 pb-0.5"
                            >
                                Selecionar Cliente Identificado
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Payment */}
                {step === 3 && (
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Resumo</h3>
                            <div className="mobile-card !p-0 overflow-hidden">
                                <div className="p-4 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50">
                                    <span className="text-xs font-bold text-gray-500 uppercase">Total a Pagar</span>
                                    <span className="text-xl font-black text-gray-900 dark:text-white">R$ {totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Meio de Pagamento</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'PIX', label: 'PIX', icon: QrCode },
                                    { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
                                    { id: 'CASH', label: 'Dinheiro', icon: DollarSign },
                                    { id: 'DEBIT_CARD', label: 'Débito', icon: CreditCard }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPayMethod(method.id)}
                                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${payMethod === method.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                                            : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-400'
                                            }`}
                                    >
                                        <method.icon size={24} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* Bottom Action Bar */}
            {cart.length > 0 && (
                <div className="fixed bottom-[80px] left-0 right-0 p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-lg border-t border-gray-100 dark:border-zinc-800 z-40">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase">Total</span>
                            <span className="text-lg font-black text-gray-900 dark:text-white leading-none">R$ {totals.total.toFixed(2)}</span>
                        </div>
                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                Continuar <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinalize}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {isProcessing ? "Processando..." : (
                                    <>Finalizar Venda <CheckCircle2 size={16} /></>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </MobileShell>
    );
};
