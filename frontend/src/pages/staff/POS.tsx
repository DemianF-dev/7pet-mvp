import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search,
    ShoppingCart,
    User,
    Plus,
    Minus,
    Trash2,
    CreditCard,
    DollarSign,
    QrCode,
    Calendar,
    X,
    CheckCircle2,
    Lock,
    Unlock,
    Printer,
    Package,
    RefreshCcw,
    ChevronRight,
    Wallet,
    Barcode,
    AlertTriangle
} from 'lucide-react';
import { useServices } from '../../context/ServicesContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';

interface CartItem {
    id: string; // unique for cart
    productId?: string;
    serviceId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: 'PERCENT' | 'AMOUNT';
    stock?: number; // Available stock for validation
}

const POS: React.FC = () => {
    const { customers: customersService, pos: posService } = useServices();
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');
    const exchangeOrderId = searchParams.get('exchangeOrderId');

    const [session, setSession] = useState<any>(null);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [openingBalance, setOpeningBalance] = useState(0);

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ products: any[], services: any[] }>({ products: [], services: [] });

    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [custQuery, setCustQuery] = useState('');
    const [custResults, setCustResults] = useState<any[]>([]);

    const [showPayModal, setShowPayModal] = useState(false);
    const [payments, setPayments] = useState<any[]>([]);
    const [currentPayAmount, setCurrentPayAmount] = useState(0);
    const [payMethod, setPayMethod] = useState('PIX');
    const [installments, setInstallments] = useState(1);
    const [payNotes, setPayNotes] = useState('');

    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [globalDiscountType, setGlobalDiscountType] = useState<'PERCENT' | 'AMOUNT'>('AMOUNT');
    const [isProcessing, setIsProcessing] = useState(false);

    // Quick Product Registration
    const [showQuickProductModal, setShowQuickProductModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: 0, stock: 10, sku: '' });

    // Quick Customer Registration
    const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

    // Receipt Print
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [lastOrder, setLastOrder] = useState<any>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        fetchSession();
        if (appointmentId) {
            loadAppointmentCheckout(appointmentId);
        }
        if (exchangeOrderId) {
            loadExchangeOrder(exchangeOrderId);
        }
        // Focus search on load
        searchInputRef.current?.focus();
    }, [appointmentId, exchangeOrderId]);

    const fetchSession = async () => {
        try {
            const data = await posService.getActiveSession();
            setSession(data);
            if (!data) setShowOpenModal(true);
        } catch (error) {
            console.error(error);
        }
    };

    const loadAppointmentCheckout = async (id: string) => {
        try {
            const data = await posService.getCheckoutData(id);
            setSelectedCustomer({ id: data.customerId, name: data.customerName });
            const items = data.items.map((item: any, idx: number) => ({
                id: `appt-${idx}`,
                ...item
            }));
            setCart(items);
            toast.success(`Dados do agendamento de ${data.petName} carregados!`);
        } catch (error) {
            toast.error('Erro ao carregar checkout do agendamento');
        }
    };

    const loadExchangeOrder = async (id: string) => {
        try {
            const data = await posService.getOrder(id);
            if (data.status === 'CANCELLED') {
                toast.error('Este pedido já foi cancelado.');
                return;
            }
            setSelectedCustomer(data.customer);
            const items = data.items.map((item: any) => ({
                id: `ex-${item.id}`,
                productId: item.productId,
                serviceId: item.serviceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount,
                discountType: 'AMOUNT'
            }));
            setCart(items);
            toast.success(`Itens do pedido #${data.seqId} carregados para troca!`);
        } catch (error) {
            toast.error('Erro ao carregar pedido para troca');
        }
    };

    // Item Search (with barcode detection)
    useEffect(() => {
        if (query.length > 2) {
            const timer = setTimeout(async () => {
                try {
                    const data = await posService.searchItems(query);
                    setSearchResults(data);

                    // Auto-add if exact SKU match and only one result
                    const exactProduct = data.products.find((p: any) => p.sku === query);
                    if (exactProduct && data.products.length === 1 && data.services.length === 0) {
                        addToCart(exactProduct, 'product');
                    }
                } catch (error) { }
            }, 150);
            return () => clearTimeout(timer);
        } else {
            setSearchResults({ products: [], services: [] });
        }
    }, [query]);

    // Customer Search
    useEffect(() => {
        if (custQuery.length > 2) {
            const timer = setTimeout(async () => {
                try {
                    const results = await customersService.search(custQuery);
                    setCustResults(results);
                } catch (error) { }
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [custQuery, customersService]);

    // Cart calculations
    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

        // Calculate item discounts based on type
        const itemDiscounts = cart.reduce((sum, item) => {
            const itemSubtotal = item.unitPrice * item.quantity;
            if (item.discountType === 'PERCENT') {
                return sum + (itemSubtotal * (item.discount / 100));
            }
            return sum + item.discount;
        }, 0);

        // Calculate global discount based on type
        const subtotalAfterItemDiscounts = subtotal - itemDiscounts;
        const globalDiscountAmount = globalDiscountType === 'PERCENT'
            ? subtotalAfterItemDiscounts * (globalDiscount / 100)
            : globalDiscount;

        const totalDiscount = itemDiscounts + globalDiscountAmount;
        return {
            subtotal,
            itemDiscounts,
            globalDiscount: globalDiscountAmount,
            totalDiscount,
            total: Math.max(0, subtotal - totalDiscount)
        };
    }, [cart, globalDiscount, globalDiscountType]);

    // Calculate remaining to pay
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingToPay = Math.max(0, totals.total - totalPaid);
    const changeAmount = Math.max(0, totalPaid - totals.total);

    const addToCart = (item: any, type: 'product' | 'service') => {
        const existing = cart.find(i => (type === 'product' ? i.productId === item.id : i.serviceId === item.id));
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
                discount: 0,
                discountType: 'AMOUNT',
                stock: type === 'product' ? item.stock : undefined
            }]);
        }
        setQuery('');
        setSearchResults({ products: [], services: [] });
        searchInputRef.current?.focus();
    };

    const updateQty = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0.1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleOpenSession = async () => {
        try {
            const data = await posService.openSession({ openingBalance });
            // If the create response doesn't include relations, we might want to refresh or merge
            setSession(data);
            setShowOpenModal(false);
            toast.success('Caixa aberto com sucesso!');
            // Optional: refresh session to get full relations if needed
            fetchSession();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao abrir caixa');
        }
    };

    const handleCloseSession = async (closingBalance: number, notes: string) => {
        try {
            await posService.closeSession(session.id, { closingBalance, notes });
            setSession(null);
            setShowCloseModal(false);
            setShowOpenModal(true);
            toast.success('Caixa fechado com sucesso!');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao fechar caixa');
        }
    };

    const handleFinalizeSale = async () => {
        if (cart.length === 0) return toast.error('O carrinho está vazio');

        setIsProcessing(true);
        try {
            // 1. Create Order
            const orderData = await posService.createOrder({
                customerId: selectedCustomer?.id,
                cashSessionId: session.id,
                appointmentId,
                globalDiscount,
                items: cart.map(item => ({
                    productId: item.productId,
                    serviceId: item.serviceId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount
                }))
            });

            // 2. Add Payments
            await posService.addPayment(orderData.id, payments);

            toast.success('Venda realizada com sucesso!', { duration: 5000 });

            // Prepare receipt
            setLastOrder({
                ...orderData,
                items: cart,
                payments: payments,
                customer: selectedCustomer,
                date: new Date().toLocaleString()
            });

            setCart([]);
            setPayments([]);
            setSelectedCustomer(null);
            setShowPayModal(false);
            setShowReceiptModal(true);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Erro ao processar venda');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickProductCreate = async () => {
        if (!newProduct.name || newProduct.price <= 0) return toast.error('Nome e Preço são obrigatórios');
        try {
            const data = await posService.createQuickProduct(newProduct);
            addToCart(data, 'product');
            setShowQuickProductModal(false);
            setNewProduct({ name: '', price: 0, stock: 10, sku: '' });
            toast.success('Produto cadastrado e adicionado ao carrinho!');
        } catch (error) {
            toast.error('Erro ao cadastrar produto');
        }
    };

    const addPaymentToList = () => {
        const remaining = totals.total - payments.reduce((s, p) => s + p.amount, 0);
        // If it's the last payment or a larger one, we allow it (for change calculation)
        const amount = currentPayAmount || remaining;
        if (amount <= 0) return;

        setPayments([...payments, {
            method: payMethod,
            amount,
            installments: payMethod === 'CREDIT_CARD_INSTALLMENT' ? installments : 1,
            notes: payNotes
        }]);
        setCurrentPayAmount(0);
        setInstallments(1);
        setPayNotes('');
    };

    const printReceipt = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[var(--color-bg-primary)] dark:bg-gray-950 font-sans">
            {/* Header / Session Info */}
            <header className="h-20 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] dark:bg-gray-900 flex items-center justify-between px-8 z-10 shadow-sm no-print">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${session ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {session ? <Unlock size={24} /> : <Lock size={24} />}
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-[var(--color-text-primary)] dark:text-white uppercase tracking-tight leading-none">PDV Inteligente</h1>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] font-black uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${session ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                            {session ? `Caixa aberto • ${session.openedBy?.name || 'Operador'}` : 'Caixa Fechado'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {session && (
                        <button
                            onClick={() => setShowCloseModal(true)}
                            className="px-6 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95"
                        >
                            Fechar Caixa
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden no-print">
                {/* Left Side: Search & Items */}
                <div className="flex-1 flex flex-col min-w-0 p-6 gap-6 h-full">
                    {/* Search Bar */}
                    <div className="relative group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 text-[var(--color-text-tertiary)] group-focus-within:text-primary transition-colors">
                            <Search size={20} />
                            <div className="w-[1px] h-6 bg-[var(--color-border)]" />
                            <Barcode size={20} className="hidden sm:block opacity-40" />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar por Nome ou Código de Barras (SKU)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && searchResults.products.length === 1) {
                                    addToCart(searchResults.products[0], 'product');
                                }
                            }}
                            className="w-full h-16 bg-[var(--color-bg-surface)] dark:bg-gray-900 border border-[var(--color-border)] focus:border-primary/40 rounded-[28px] pl-20 pr-6 text-sm font-bold text-[var(--color-text-primary)] dark:text-white shadow-lg shadow-black/[0.03] transition-all outline-none"
                        />

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {(searchResults.products.length > 0 || searchResults.services.length > 0 || (query.length > 2 && searchResults.products.length === 0)) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-20 left-0 right-0 bg-[var(--color-bg-surface)] dark:bg-gray-900 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-black border border-[var(--color-border)] p-8 z-50 max-h-[500px] overflow-y-auto custom-scrollbar"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Products */}
                                        <div className="space-y-5">
                                            <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-2">
                                                <Package size={14} className="text-primary" /> Produtos
                                            </h3>
                                            <div className="space-y-3">
                                                {searchResults.products.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => addToCart(p, 'product')}
                                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border border-transparent hover:border-primary/20"
                                                    >
                                                        <div className="text-left">
                                                            <div className="text-sm font-black text-[var(--color-text-primary)] dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                                                {p.name}
                                                                {p.stock <= 0 && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">SEM ESTOQUE (PRODUÇÃO)</span>}
                                                                {p.stock > 0 && p.stock <= 3 && <span className="text-[8px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full">ESTOQUE BAIXO</span>}
                                                            </div>
                                                            <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-tighter">
                                                                SKU: {p.sku || 'N/A'} • Estoque: {p.stock} un
                                                            </div>
                                                        </div>
                                                        <div className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">R$ {p.price.toFixed(2)}</div>
                                                    </button>
                                                ))}
                                                {searchResults.products.length === 0 && query.length > 2 && (
                                                    <div className="py-6 px-4 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                                                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-4">Nenhum produto encontrado</p>
                                                        <button
                                                            onClick={() => {
                                                                setNewProduct({ ...newProduct, name: query, sku: query.match(/^\d+$/) ? query : '' });
                                                                setShowQuickProductModal(true);
                                                            }}
                                                            className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                        >
                                                            Cadastrar "{query}" Rapidamente
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Services */}
                                        <div className="space-y-5">
                                            <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] flex items-center gap-2 mb-4 border-b border-[var(--color-border)] pb-2">
                                                <Calendar size={14} className="text-primary" /> Serviços do Sistema
                                            </h3>
                                            <div className="space-y-3">
                                                {searchResults.services.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => addToCart(s, 'service')}
                                                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-all group border border-transparent hover:border-primary/20"
                                                    >
                                                        <div className="text-left">
                                                            <div className="text-sm font-black text-[var(--color-text-primary)] dark:text-white group-hover:text-primary transition-colors">{s.name}</div>
                                                            <div className="text-[10px] font-bold text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-tighter">{s.duration} min • Execução Expressa</div>
                                                        </div>
                                                        <div className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg">R$ {s.basePrice.toFixed(2)}</div>
                                                    </button>
                                                ))}
                                                {searchResults.services.length === 0 && (
                                                    <div className="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                                                        <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">Nenhum serviço encontrado</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 bg-[var(--color-bg-surface)] dark:bg-gray-900 border border-[var(--color-border)] rounded-[40px] shadow-xl shadow-black/[0.02] overflow-hidden flex flex-col min-h-0">
                        <div className="p-8 pb-4 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingCart size={18} className="text-primary" />
                                <h2 className="text-sm font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">Carrinho de Vendas</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    {cart.length} ITENS
                                </span>
                                {cart.length > 0 && (
                                    <button onClick={() => setCart([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Limpar</button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 custom-scrollbar">
                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-tertiary)]/30 py-20 grayscale opacity-40">
                                    <ShoppingCart size={80} strokeWidth={1} />
                                    <p className="mt-6 font-black text-[10px] uppercase tracking-widest">O carrinho está vazio</p>
                                    <p className="text-[10px] font-medium mt-1">Busque produtos, serviços ou bip o código de barras</p>
                                </div>
                            )}

                            {cart.map(item => (
                                <React.Fragment key={item.id}>
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-4 p-5 rounded-3xl bg-[var(--color-bg-primary)] dark:bg-gray-800/50 hover:dark:bg-gray-800 border border-[var(--color-border)] hover:border-primary/20 transition-all group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black text-[var(--color-text-primary)] dark:text-white truncate flex items-center gap-2">
                                                {item.description}
                                                {item.stock !== undefined && item.quantity > item.stock && (
                                                    <div className="flex items-center gap-1 text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                                                        <AlertTriangle size={10} /> ESTOQUE INSUFICIENTE ({item.stock})
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mt-1 flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded ${item.productId ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                                    {item.productId ? 'PRODUTO' : 'SERVIÇO'}
                                                </span>
                                                <span>R$ {item.unitPrice.toFixed(2)} un</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 bg-[var(--color-bg-surface)] dark:bg-gray-900 px-2 py-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-2 hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors rounded-lg"><Minus size={14} /></button>
                                            <span className="w-8 text-center text-xs font-black text-[var(--color-text-primary)] dark:text-white">{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-2 hover:bg-primary/10 text-[var(--color-text-tertiary)] hover:text-primary transition-colors rounded-lg"><Plus size={14} /></button>
                                        </div>

                                        <div className="w-24 text-right">
                                            <p className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase leading-none mb-1">Subtotal</p>
                                            <p className="text-sm font-black text-[var(--color-text-primary)] dark:text-white">
                                                R$ {(item.quantity * item.unitPrice).toFixed(2)}
                                            </p>
                                            {item.discount > 0 && (
                                                <p className="text-[10px] font-bold text-red-500 mt-1">
                                                    -{item.discountType === 'PERCENT' ? `${item.discount}%` : `R$ ${item.discount.toFixed(2)}`}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setCart(cart.filter(i => i.id !== item.id))}
                                            className="w-10 h-10 flex items-center justify-center text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>

                                    {/* Discount Row */}
                                    < motion.div
                                        layout
                                        className="flex items-center gap-2 px-5 pb-3 -mt-2"
                                    >
                                        <div className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">
                                            Desconto:
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <button
                                                onClick={() => setCart(cart.map(i => i.id === item.id ? { ...i, discountType: i.discountType === 'PERCENT' ? 'AMOUNT' : 'PERCENT', discount: 0 } : i))}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${item.discountType === 'AMOUNT'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-[var(--color-text-tertiary)] hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                R$
                                            </button>
                                            <button
                                                onClick={() => setCart(cart.map(i => i.id === item.id ? { ...i, discountType: i.discountType === 'PERCENT' ? 'AMOUNT' : 'PERCENT', discount: 0 } : i))}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black transition-all ${item.discountType === 'PERCENT'
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-[var(--color-text-tertiary)] hover:bg-gray-300 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                %
                                            </button>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.discountType === 'PERCENT' ? 100 : item.unitPrice * item.quantity}
                                                value={item.discount}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    const maxValue = item.discountType === 'PERCENT' ? 100 : item.unitPrice * item.quantity;
                                                    const validValue = Math.min(Math.max(0, value), maxValue);
                                                    setCart(cart.map(i => i.id === item.id ? { ...i, discount: validValue } : i));
                                                }}
                                                className="flex-1 px-3 py-1.5 bg-[var(--color-bg-surface)] dark:bg-gray-900 border border-[var(--color-border)] rounded-lg text-xs font-bold text-[var(--color-text-primary)] dark:text-white outline-none focus:border-primary/50 transition-all"
                                                placeholder="0"
                                            />
                                        </div>
                                    </motion.div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Context, Totals & Actions */}
                <div className="w-[420px] shrink-0 h-full p-6 pl-0 flex flex-col gap-6 overflow-hidden">
                    {/* Customer Selection */}
                    <div className="bg-[var(--color-bg-surface)] dark:bg-gray-900 p-6 rounded-[40px] border border-[var(--color-border)] shadow-xl shadow-black/[0.02]">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest flex items-center gap-2">
                                <User size={14} /> Cliente Atendido
                            </h3>
                            {selectedCustomer && (
                                <button
                                    onClick={() => setShowCustomerSearch(true)}
                                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                                >
                                    Trocar
                                </button>
                            )}
                        </div>

                        {selectedCustomer ? (
                            <div className="flex items-center justify-between p-4 rounded-3xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black uppercase text-xl shadow-inner border border-primary/10">
                                        {selectedCustomer.name.substring(0, 1)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-[var(--color-text-primary)] dark:text-white">{selectedCustomer.name}</span>
                                        <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">{selectedCustomer.phone || 'Vínculo Identificado'}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="w-8 h-8 flex items-center justify-center text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><X size={18} /></button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowCustomerSearch(true)}
                                className="w-full py-5 px-6 border-2 border-dashed border-[var(--color-border)] dark:border-gray-800 rounded-[32px] text-[var(--color-text-tertiary)] text-[10px] font-black uppercase tracking-widest hover:border-primary/40 hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                            >
                                Selecionar Cliente
                                <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-all">
                                    <Plus size={16} />
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Summary & Totals */}
                    <div className="flex-1 lg:w-96 bg-[var(--color-bg-surface)] dark:bg-gray-900 p-8 rounded-[48px] shadow-[var(--shadow-xl)] relative overflow-hidden flex flex-col border border-[var(--color-border)] max-h-[calc(100vh-140px)]">
                        {/* Abstract Background Decoration - Subtle Sheen */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full overflow-hidden">
                            <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2 pb-4">
                                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
                                    <span className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">Subtotal</span>
                                    <span className="text-lg font-black text-[var(--color-text-primary)]">R$ {totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
                                    <span className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">Descontos Itens</span>
                                    <span className="text-lg font-black text-[var(--color-error)]">- R$ {totals.itemDiscounts.toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col gap-3 pb-5 border-b border-[var(--color-border)]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">Desconto Global</span>
                                        <span className="text-lg font-black text-[var(--color-error)]">- {globalDiscountType === 'PERCENT' ? `${globalDiscount}%` : `R$ ${totals.globalDiscount.toFixed(2)}`}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex gap-1.5 p-1 bg-[var(--color-bg-primary)] dark:bg-white/5 rounded-xl border border-[var(--color-border)]">
                                            <button
                                                onClick={() => { setGlobalDiscountType('AMOUNT'); setGlobalDiscount(0); }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${globalDiscountType === 'AMOUNT'
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                                                    }`}
                                            >
                                                R$
                                            </button>
                                            <button
                                                onClick={() => { setGlobalDiscountType('PERCENT'); setGlobalDiscount(0); }}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${globalDiscountType === 'PERCENT'
                                                    ? 'bg-primary text-white shadow-sm'
                                                    : 'text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]'
                                                    }`}
                                            >
                                                %
                                            </button>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                placeholder={globalDiscountType === 'PERCENT' ? '0%' : 'R$ 0,00'}
                                                min="0"
                                                max={globalDiscountType === 'PERCENT' ? 100 : totals.subtotal - totals.itemDiscounts}
                                                value={globalDiscount || ''}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    const maxValue = globalDiscountType === 'PERCENT' ? 100 : totals.subtotal - totals.itemDiscounts;
                                                    setGlobalDiscount(Math.min(Math.max(0, value), maxValue));
                                                }}
                                                className="w-full h-11 bg-[var(--color-bg-primary)] dark:bg-white/5 border border-[var(--color-border)] rounded-xl px-4 text-xs font-black text-[var(--color-text-primary)] outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setGlobalDiscount(0)}
                                            className="w-11 h-11 flex items-center justify-center bg-[var(--color-bg-primary)] dark:bg-white/5 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] border border-[var(--color-border)] rounded-xl transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-2 opacity-80">Total Líquido</span>
                                    <div className="text-6xl font-black text-[var(--color-text-primary)] tracking-tighter flex items-start gap-1">
                                        <span className="text-xl text-primary mt-3">R$</span>
                                        {totals.total.toFixed(2)}
                                    </div>
                                </div>

                                {/* Applied Payments */}
                                <div className="flex-1 min-h-0 pt-4">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <h4 className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em]">Condições de Pagamento</h4>
                                        {payments.length > 0 && (
                                            <span className="text-[10px] font-black text-[var(--color-success)]">{payments.length} registradas</span>
                                        )}
                                    </div>
                                    <div className="space-y-2.5 overflow-y-auto max-h-[160px] custom-scrollbar pr-1 pb-2">
                                        {payments.length === 0 ? (
                                            <div className="bg-[var(--color-bg-primary)] dark:bg-white/5 rounded-2xl p-6 text-center border border-dashed border-[var(--color-border)]">
                                                <p className="text-[10px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-widest italic">Nenhum pagamento registrado</p>
                                            </div>
                                        ) : (
                                            payments.map((p, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-4 bg-[var(--color-bg-primary)] dark:bg-white/5 rounded-2xl border border-[var(--color-border)] shadow-sm group animate-in slide-in-from-right-2 duration-200">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                                            {(p.method === 'PIX' || p.method === 'PIX_CPF' || p.method === 'PIX_EMAIL') ? <QrCode size={18} /> : (p.method === 'CASH' || p.method === 'FUTURE' || p.method === 'DEFERRED') ? <DollarSign size={18} /> : <CreditCard size={18} />}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-[var(--color-text-primary)] uppercase tracking-widest">{p.method.replace(/_/g, ' ')}</span>
                                                            {p.installments > 1 && <span className="text-[8px] text-primary font-black uppercase tracking-tighter">{p.installments}x de R$ {(p.amount / p.installments).toFixed(2)}</span>}
                                                            {p.notes && <span className="text-[8px] text-[var(--color-text-tertiary)] truncate max-w-[120px]">{p.notes}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-sm font-black text-[var(--color-text-primary)]">R$ {p.amount.toFixed(2)}</span>
                                                        <button
                                                            onClick={() => setPayments(payments.filter((_, i) => i !== idx))}
                                                            className="w-8 h-8 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/5 rounded-lg transition-all"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Payment Progress */}
                                    {cart.length > 0 && (
                                        <div className="mt-4 p-5 bg-[var(--color-bg-primary)] dark:bg-white/5 rounded-[32px] border border-[var(--color-border)] shadow-inner">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">Total Pago</span>
                                                <span className="text-base font-black text-[var(--color-text-primary)]">R$ {totalPaid.toFixed(2)}</span>
                                            </div>
                                            {remainingToPay > 0 ? (
                                                <div className="flex justify-between items-center p-3.5 bg-[var(--color-orange)]/10 dark:bg-orange-500/10 rounded-2xl border border-[var(--color-orange)]/20">
                                                    <span className="text-[9px] font-black text-[var(--color-orange)] uppercase tracking-widest">Falta Pagar</span>
                                                    <span className="text-base font-black text-[var(--color-orange)]">
                                                        R$ {remainingToPay.toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-center p-4 bg-[var(--color-success)]/10 rounded-2xl border border-[var(--color-success)]/20 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-[var(--color-success)] uppercase tracking-widest">Troco a Devolver</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-[var(--color-success)]">
                                                        R$ {changeAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Main Action Buttons */}
                            <div className="pt-8 space-y-3 shrink-0 px-2 pb-2">
                                {cart.length > 0 && session && remainingToPay > 0.01 && (
                                    <button
                                        onClick={() => {
                                            setShowPayModal(true);
                                            setCurrentPayAmount(remainingToPay);
                                        }}
                                        className="w-full py-4 bg-primary text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <DollarSign size={18} /> Registrar Pagamento
                                    </button>
                                )}

                                {cart.length > 0 && session && remainingToPay <= 0.01 && totalPaid >= totals.total && (
                                    <button
                                        onClick={handleFinalizeSale}
                                        disabled={isProcessing}
                                        className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-green-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isProcessing ? <RefreshCcw className="animate-spin" size={20} /> : <CheckCircle2 size={24} />}
                                        Finalizar e Emitir Recibo
                                    </button>
                                )}

                                {!session && (
                                    <button
                                        onClick={() => setShowOpenModal(true)}
                                        className="w-full py-5 bg-white text-gray-900 rounded-[24px] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-gray-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Unlock size={18} /> Abrir Caixa
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}

            {/* 1. Open Session Modal */}
            {
                showOpenModal && (
                    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[var(--color-bg-surface)] dark:bg-gray-900 w-full max-w-lg rounded-[48px] p-12 shadow-2xl border border-[var(--color-border)] overflow-hidden relative"
                        >
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 shadow-inner">
                                    <Unlock size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-[var(--color-text-primary)] dark:text-white uppercase tracking-tight mb-2">Abertura de Caixa</h2>
                                <p className="text-sm font-medium text-[var(--color-text-tertiary)] mb-10">Informe o saldo inicial em espécie para começar a operar.</p>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3 block">Fundo de Manejo (R$)</label>
                                        <input
                                            type="number"
                                            autoFocus
                                            value={openingBalance}
                                            onChange={(e) => setOpeningBalance(Number(e.target.value))}
                                            className="w-full h-20 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-3xl px-8 text-2xl font-black text-[var(--color-text-primary)] dark:text-white outline-none focus:border-primary/50 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleOpenSession}
                                        className="w-full py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
                                    >
                                        Confirmar Abertura
                                    </button>
                                    <button
                                        onClick={() => window.history.back()}
                                        className="w-full py-4 bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] rounded-3xl font-bold uppercase tracking-widest transition-all text-[10px] border border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]"
                                    >
                                        Sair do PDV
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* 2. Close Session Modal */}
            {
                showCloseModal && session && (
                    <div className="fixed inset-0 bg-red-950/40 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[var(--color-bg-surface)] dark:bg-gray-900 w-full max-w-lg rounded-[48px] p-12 shadow-2xl border border-red-500/10"
                        >
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-8">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-[var(--color-text-primary)] dark:text-white uppercase tracking-tight mb-2">Encerrar Caixa</h2>
                            <p className="text-sm font-medium text-[var(--color-text-tertiary)] mb-10">Verifique os valores em mãos e confirme o fechamento.</p>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3 block">Saldo Final em Espécie (R$)</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        placeholder="R$ 0,00"
                                        id="closingInput"
                                        className="w-full h-20 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-3xl px-8 text-2xl font-black text-[var(--color-text-primary)] dark:text-white outline-none focus:border-red-500/50 transition-all"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowCloseModal(false)} className="flex-1 py-6 bg-[var(--color-bg-primary)] dark:bg-gray-800 text-[var(--color-text-tertiary)] rounded-3xl font-black uppercase tracking-widest hover:bg-gray-700 transition-all text-[10px]">Voltar</button>
                                    <button
                                        onClick={() => {
                                            const val = (document.getElementById('closingInput') as HTMLInputElement).value;
                                            handleCloseSession(Number(val), 'Fechamento de rotina');
                                        }}
                                        className="flex-2 grow py-6 bg-red-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all text-[10px]"
                                    >
                                        Confirmar Fechamento
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* 3. Payment Modal */}
            {
                showPayModal && (
                    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[var(--color-bg-surface)] dark:bg-gray-900 w-full max-w-xl rounded-[48px] p-12 shadow-2xl border border-[var(--color-border)]"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-[var(--color-text-primary)] dark:text-white uppercase tracking-tight">Condições de Pagamento</h2>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Total a Receber: R$ {remainingToPay.toFixed(2)}</p>
                                </div>
                                <button onClick={() => setShowPayModal(false)} className="w-12 h-12 flex items-center justify-center bg-[var(--color-bg-primary)] dark:bg-gray-800 rounded-2xl text-[var(--color-text-tertiary)] hover:text-red-500 transition-all"><X size={24} /></button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                                {[
                                    { id: 'CASH', label: 'Dinheiro', icon: <DollarSign /> },
                                    { id: 'PIX', label: 'Pix', icon: <QrCode /> },
                                    { id: 'PIX_CPF', label: 'Pix CPF', icon: <QrCode /> },
                                    { id: 'PIX_EMAIL', label: 'Pix Email', icon: <QrCode /> },
                                    { id: 'DEBIT_CARD', label: 'Débito', icon: <CreditCard /> },
                                    { id: 'CREDIT_CARD', label: 'Crédito', icon: <CreditCard /> },
                                    { id: 'CREDIT_CARD_INSTALLMENT', label: 'C. Parcelado', icon: <CreditCard /> },
                                    { id: 'DEFERRED', label: 'A Prazo', icon: <Calendar /> },
                                    { id: 'FUTURE', label: 'Pag. Futuro', icon: <Wallet /> },
                                    { id: 'ACCOUNT_CREDIT', label: 'Créd. Cliente', icon: <User /> },
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => {
                                            setPayMethod(method.id);
                                            if (method.id !== 'CREDIT_CARD_INSTALLMENT') setInstallments(1);
                                        }}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border-2 ${payMethod === method.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' : 'bg-[var(--color-bg-primary)] dark:bg-gray-800 text-[var(--color-text-tertiary)] border-transparent hover:border-primary/20'}`}
                                    >
                                        <div className={payMethod === method.id ? 'text-white' : 'text-primary'}>{React.cloneElement(method.icon as any, { size: 18 })}</div>
                                        <span className="text-[8px] font-black uppercase tracking-widest">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3 block">Valor (R$)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                autoFocus
                                                placeholder={remainingToPay.toFixed(2)}
                                                value={currentPayAmount || ''}
                                                onChange={(e) => setCurrentPayAmount(Number(e.target.value))}
                                                className="w-full h-16 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl px-6 text-xl font-black text-[var(--color-text-primary)] dark:text-white outline-none focus:border-primary/50 transition-all"
                                            />
                                            <button onClick={() => setCurrentPayAmount(remainingToPay)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Total</button>
                                        </div>
                                    </div>

                                    {payMethod === 'CREDIT_CARD_INSTALLMENT' && (
                                        <div>
                                            <label className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3 block">Parcelas</label>
                                            <select
                                                value={installments}
                                                onChange={(e) => setInstallments(Number(e.target.value))}
                                                className="w-full h-16 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl px-6 text-sm font-black text-[var(--color-text-primary)] dark:text-white outline-none focus:border-primary/50 transition-all appearance-none"
                                            >
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}x {i > 0 ? `de R$ ${(currentPayAmount / (i + 1)).toFixed(2)}` : ''}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-3 block">Observações do Pagamento</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Nome do titular, Chave Pix, Data combinada..."
                                        value={payNotes}
                                        onChange={(e) => setPayNotes(e.target.value)}
                                        className="w-full h-14 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl px-6 text-xs font-bold text-[var(--color-text-primary)] dark:text-white outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={addPaymentToList}
                                    className="w-full py-5 bg-secondary dark:bg-primary text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-[10px]"
                                >
                                    Adicionar este Pagamento
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* 4. Quick Product Modal */}
            {
                showQuickProductModal && (
                    <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--color-bg-surface)] dark:bg-gray-900 w-full max-w-lg rounded-[48px] p-10 border border-primary/20 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary"><Plus /></div>
                                <h2 className="text-xl font-black text-[var(--color-text-primary)] dark:text-white uppercase">Cadastro Rápido</h2>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 block">Nome do Produto</label>
                                    <input
                                        type="text"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                        className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl text-sm font-bold text-white outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 block">Preço de Venda</label>
                                        <input
                                            type="number"
                                            value={newProduct.price}
                                            onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                            className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl text-sm font-bold text-white outline-none focus:border-primary/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 block">Cód. Barras (SKU)</label>
                                        <input
                                            type="text"
                                            value={newProduct.sku}
                                            onChange={e => setNewProduct({ ...newProduct, sku: e.target.value })}
                                            className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl text-sm font-bold text-white outline-none focus:border-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={() => setShowQuickProductModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-[var(--color-text-tertiary)] hover:bg-white/5 rounded-2xl">Cancelar</button>
                                    <button onClick={handleQuickProductCreate} className="flex-2 grow py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-primary/20">Salvar e Adicionar</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* 5. Customer Search/Quick Add Modal */}
            {
                showCustomerSearch && (
                    <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--color-bg-surface)] dark:bg-gray-900 w-full max-w-2xl rounded-[48px] p-10 border border-primary/20 shadow-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary"><User /></div>
                                    <h2 className="text-xl font-black text-[var(--color-text-primary)] dark:text-white uppercase">Selecionar Cliente</h2>
                                </div>
                                <button onClick={() => { setShowCustomerSearch(false); setCustQuery(''); setCustResults([]); }} className="w-10 h-10 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><X /></button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button
                                    onClick={() => { setShowCustomerSearch(false); setShowQuickCustomerModal(true); }}
                                    className="p-6 border-2 border-dashed border-primary/30 rounded-3xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <Plus className="mx-auto mb-2 text-primary" size={24} />
                                    <p className="text-xs font-black text-primary uppercase">Cadastro Rápido</p>
                                </button>
                                <button
                                    onClick={() => { setSelectedCustomer({ id: null, name: 'Venda Sem Identificação' }); setShowCustomerSearch(false); }}
                                    className="p-6 border-2 border-dashed border-gray-500/30 rounded-3xl hover:border-gray-500 hover:bg-gray-500/5 transition-all group"
                                >
                                    <User className="mx-auto mb-2 text-gray-500" size={24} />
                                    <p className="text-xs font-black text-gray-500 uppercase">Sem Identificação</p>
                                </button>
                            </div>

                            <div className="mb-6">
                                <input
                                    type="text"
                                    placeholder="Buscar cliente por nome ou telefone..."
                                    value={custQuery}
                                    onChange={(e) => setCustQuery(e.target.value)}
                                    className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-text-primary)] dark:text-white outline-none focus:border-primary/50"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {custResults.length > 0 ? (
                                    custResults.map((customer: any) => (
                                        <button
                                            key={customer.id}
                                            onClick={() => { setSelectedCustomer(customer); setShowCustomerSearch(false); setCustQuery(''); setCustResults([]); }}
                                            className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-gray-800 hover:bg-primary/10 dark:hover:bg-primary/20 border border-[var(--color-border)] rounded-2xl transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-sm">
                                                    {customer.name.substring(0, 1).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-[var(--color-text-primary)] dark:text-white">{customer.name}</p>
                                                    <p className="text-xs text-[var(--color-text-tertiary)]">{customer.phone || customer.email || 'Sem contato'}</p>
                                                </div>
                                                <ChevronRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                                            </div>
                                        </button>
                                    ))
                                ) : custQuery.length > 2 ? (
                                    <p className="text-center text-[var(--color-text-tertiary)] py-8">Nenhum cliente encontrado</p>
                                ) : (
                                    <p className="text-center text-[var(--color-text-tertiary)] py-8">Digite para buscar clientes</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* 6. Quick Customer Modal */}
            {
                showQuickCustomerModal && (
                    <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-md z-[130] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--color-bg-surface)] dark:bg-gray-900 w-full max-w-lg rounded-[48px] p-10 border border-primary/20 shadow-2xl"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary"><Plus /></div>
                                <h2 className="text-xl font-black text-[var(--color-text-primary)] dark:text-white uppercase">Cadastro Rápido</h2>
                            </div>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 block">Nome do Cliente</label>
                                    <input
                                        type="text"
                                        value={newCustomer.name}
                                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl text-sm font-bold text-white outline-none focus:border-primary/50"
                                        placeholder="Ex: João Silva"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mb-2 block">Telefone</label>
                                    <input
                                        type="tel"
                                        value={newCustomer.phone}
                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        className="w-full p-4 bg-[var(--color-bg-primary)] dark:bg-black border border-[var(--color-border)] rounded-2xl text-sm font-bold text-white outline-none focus:border-primary/50"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => { setShowQuickCustomerModal(false); setNewCustomer({ name: '', phone: '' }); }}
                                        className="flex-1 py-4 bg-[var(--color-bg-primary)] dark:bg-gray-800 text-[var(--color-text-tertiary)] rounded-2xl font-bold uppercase text-xs hover:bg-gray-700 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!newCustomer.name) return toast.error('Nome é obrigatório');
                                            try {
                                                const customer = await customersService.create({ name: newCustomer.name, phone: newCustomer.phone, email: '' });
                                                setSelectedCustomer(customer);
                                                setShowQuickCustomerModal(false);
                                                setNewCustomer({ name: '', phone: '' });
                                                toast.success('Cliente cadastrado!');
                                            } catch (error: any) {
                                                toast.error(error.response?.data?.error || 'Erro ao cadastrar');
                                            }
                                        }}
                                        className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Salvar e Usar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* 7. Receipt Modal (Thermal Printer 80mm Style) */}
            {
                showReceiptModal && lastOrder && (
                    <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white text-black w-[80mm] p-6 shadow-2xl font-mono text-[11px] leading-tight print:shadow-none print:m-0">
                            <div className="text-center border-b border-black pb-4 mb-4">
                                <h2 className="text-lg font-black uppercase tracking-tighter">The Pet - SPA & Boutique</h2>
                                <div className="mt-2 text-[9px] space-y-0.5">
                                    <p>CNPJ: 37.975.401/0001-77</p>
                                    <p>Av Hildebrando de Lima, 525, Osasco/SP</p>
                                    <p>WhatsApp: (11) 98396-6451</p>
                                </div>
                                <p className="mt-2 text-[8px] font-bold opacity-70">CUPOM NÃO FISCAL</p>
                            </div>

                            <div className="mb-4 space-y-1">
                                <p className="font-bold">PEDIDO: #{lastOrder.seqId || lastOrder.id?.substring(0, 8).toUpperCase()}</p>
                                <p>DATA: {lastOrder.date}</p>
                                {lastOrder.customer && <p>CLIENTE: {lastOrder.customer.name}</p>}
                                <p>OPERADOR: {lastOrder.cashSession?.openedBy?.name || session?.openedBy?.name || 'Caixa Central'}</p>
                            </div>

                            <div className="border-b border-black mb-4">
                                <div className="flex justify-between font-bold mb-2 pb-1 border-b border-dashed border-black/20">
                                    <span>DESCRIÇÃO</span>
                                    <span>QTD x VL UN | TOTAL</span>
                                </div>
                                {lastOrder.items.map((it: any, i: number) => (
                                    <div key={i} className="mb-3">
                                        <div className="flex justify-between font-bold">
                                            <span className="uppercase">{it.description}</span>
                                            <span>R$ {(it.quantity * it.unitPrice).toFixed(2)}</span>
                                        </div>
                                        <div className="text-[10px] opacity-80">
                                            {it.quantity} un x R$ {it.unitPrice.toFixed(2)}
                                            {it.discount > 0 && <span className="text-red-600 block text-[9px]">DESC. ITEM: -R$ {it.discount.toFixed(2)}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1.5 mb-6 border-b border-black pb-4">
                                <div className="flex justify-between">
                                    <span>SUBTOTAL:</span>
                                    <span>R$ {(lastOrder.totalAmount || lastOrder.items.reduce((s: any, i: any) => s + (i.unitPrice * i.quantity), 0)).toFixed(2)}</span>
                                </div>
                                {(lastOrder.discountAmount > 0) && (
                                    <div className="flex justify-between italic text-[10px]">
                                        <span>DESCONTOS TOTAIS:</span>
                                        <span className="text-black">- R$ {lastOrder.discountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black text-lg pt-2 border-t border-dashed border-black mt-2">
                                    <span>VALOR TOTAL:</span>
                                    <span>R$ {(lastOrder.finalAmount || (lastOrder.totalAmount - lastOrder.discountAmount)).toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="font-bold mb-2 border-b border-black pb-1">FORMA DE PAGAMENTO:</p>
                                {lastOrder.payments.map((p: any, i: number) => (
                                    <div key={i} className="flex justify-between mb-1">
                                        <span className="uppercase">{p.method.replace(/_/g, ' ')}</span>
                                        <span>R$ {p.amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center space-y-3 pt-4 border-t border-black">
                                <p className="font-black text-sm">CUPOM NÃO FISCAL</p>
                                <div className="text-[9px] opacity-80 italic">
                                    <p>Obrigado pela preferência!</p>
                                    <p>Volte sempre à The Pet - SPA & Boutique</p>
                                </div>
                                <div className="pt-4 pb-2 text-[8px] opacity-60">
                                    <p>--------------------------------------------------</p>
                                    <p>Sistema 7Pet v2.0 - Automação Inteligente</p>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 no-print flex-col">
                                <button onClick={printReceipt} className="w-full py-4 bg-black text-white rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all text-sm uppercase">
                                    <Printer size={20} /> Imprimir Cupom
                                </button>
                                <button onClick={() => setShowReceiptModal(false)} className="w-full py-3 border-2 border-black rounded-2xl font-bold active:scale-95 transition-all text-xs uppercase">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hidden Frame for Printing */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-content, .print-content * { visibility: visible; }
                    .no-print { display: none !important; }
                    .print-content { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 80mm;
                        padding: 0;
                        margin: 0;
                    }
                }
            `}</style>
        </div >
    );
};

export default POS;
