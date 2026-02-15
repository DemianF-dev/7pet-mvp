import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, ShoppingCart, User, Plus, Minus, Trash2, CreditCard,
  DollarSign, QrCode, Calendar, X, CheckCircle2, Lock, Unlock,
  Printer, Package, History, ChevronRight, Barcode,
  Sparkles, Grid3X3, Wallet,
  Users, Star, Zap, Banknote, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { Button, Card, Badge, GlassSurface, SpotlightCard, IconButton, StatusDot } from '../../components/ui';
import { useIsMobile } from '../../hooks/useIsMobile';
import Breadcrumbs from '../../components/staff/Breadcrumbs';

// Interfaces
interface CartItem {
  id: string;
  productId?: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'PERCENT' | 'AMOUNT';
  stock?: number;
  category?: string;
}

interface Payment {
  id: string;
  method: string;
  amount: number;
  installments?: number;
}

interface Category {
  id: string;
  name: string;
  icon: any;
  color: string;
}

// Métodos de pagamento
const PAYMENT_METHODS = [
  { id: 'PIX', name: 'PIX', icon: QrCode, color: '#00BFA5', bgColor: '#E0F7F4' },
  { id: 'CASH', name: 'Dinheiro', icon: Banknote, color: '#FF9800', bgColor: '#FFF3E0' },
  { id: 'CREDIT_CARD', name: 'Crédito', icon: CreditCard, color: '#2196F3', bgColor: '#E3F2FD' },
  { id: 'DEBIT_CARD', name: 'Débito', icon: CreditCard, color: '#9C27B0', bgColor: '#F3E5F5' },
  { id: 'ACCOUNT_CREDIT', name: 'Crediário', icon: Wallet, color: '#4CAF50', bgColor: '#E8F5E9' },
  { id: 'FUTURE', name: 'Futuro', icon: Calendar, color: '#FF5722', bgColor: '#FBE9E7' },
  { id: 'PAYROLL_DEDUCTION', name: 'Desc. Folha', icon: User, color: '#607D8B', bgColor: '#ECEFF1', requiresStaff: true },
];

const POS: React.FC = () => {
  const { isMobile } = useIsMobile();
  const { customers: customersService, pos: posService } = useServices();
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [currentUser] = useState(() => {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Estados
  const [session, setSession] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'products' | 'services' | 'recent'>('products');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // Modais
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Forms
  const [openingBalance, setOpeningBalance] = useState(0);
  const [currentPayment, setCurrentPayment] = useState({ method: 'PIX', amount: 0 });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = [
    { id: 'all', name: 'Todos', icon: Grid3X3, color: '#3B82F6' },
    { id: 'food', name: 'Rações', icon: Package, color: '#F59E0B' },
    { id: 'toys', name: 'Brinquedos', icon: Star, color: '#EC4899' },
    { id: 'hygiene', name: 'Higiene', icon: Sparkles, color: '#06B6D4' },
    { id: 'medication', name: 'Medicamentos', icon: Zap, color: '#EF4444' },
  ];

  // Inicialização
  useEffect(() => {
    fetchSession();
    loadData();
    if (appointmentId) loadAppointment(appointmentId);
  }, [appointmentId]);

  // Busca
  useEffect(() => {
    const items = activeView === 'products' ? products : services;
    let filtered = items;

    if (searchQuery.length > 0) {
      filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all' && activeView === 'products') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [searchQuery, selectedCategory, activeView, products, services]);

  // Busca clientes
  useEffect(() => {
    if (customerSearch.length > 2) {
      const timer = setTimeout(async () => {
        try {
          const results = await customersService.search(customerSearch);
          setCustomerResults(results);
        } catch (error) { }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch, customersService]);

  // Cálculos
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0);
    const itemDiscounts = cart.reduce((sum, item) => {
      if (item.discountType === 'PERCENT') {
        return sum + ((item.unitPrice || 0) * (item.quantity || 0) * ((item.discount || 0) / 100));
      }
      return sum + (item.discount || 0);
    }, 0);
    const total = Math.max(0, subtotal - itemDiscounts - globalDiscount);
    return { subtotal, itemDiscounts, globalDiscount, total };
  }, [cart, globalDiscount]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingToPay = Math.max(0, totals.total - totalPaid);
  const changeAmount = Math.max(0, totalPaid - totals.total);

  const fetchSession = async () => {
    try {
      const data = await posService.getActiveSession();
      setSession(data);
      if (!data) setShowOpenModal(true);
    } catch (error: any) {
      console.error('Error fetching session:', error);
      toast.error('Erro ao verificar status do caixa. Verifique sua conexão.');
    }
  };

  const loadData = async () => {
    try {
      const data = await posService.searchItems('');
      setProducts(data.products || []);
      setServices(data.services || []);
    } catch (error) {
      toast.error('Erro ao carregar catálogo');
    }
  };

  const loadRecentOrders = async () => {
    try {
      const data = await posService.listRecentOrders();
      setRecentOrders(data || []);
    } catch (error) { }
  };

  const loadAppointment = async (id: string) => {
    try {
      const data = await posService.getCheckoutData(id);
      setSelectedCustomer({
        id: data.customerId,
        name: data.customerName,
        petName: data.petName,
        isStaff: data.isStaff
      });
      data.items.forEach((item: any, _idx: number) => {
        // Map backend response (unitPrice, description) to CartItem expectation (price/basePrice, name)
        const mappedItem = {
          ...item,
          // Only set ID if it is a real entity ID (Service or Product)
          // If we use a generated string like `appt-item-${idx}`, addToCart will mistake it for a ServiceID
          id: item.serviceId || item.productId,
          productId: item.productId,
          serviceId: item.serviceId,
          name: item.description,
          // addToCart expects 'price' for products and 'basePrice' for services
          price: item.unitPrice,
          basePrice: item.unitPrice
        };
        addToCart(mappedItem, item.productId ? 'product' : 'service');
      });
      toast.success(`Agendamento de ${data.petName} carregado!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar agendamento');
    }
  };

  const addToCart = (item: any, type: 'product' | 'service') => {
    // Determine the real ID to use for checking existence
    const targetProductId = item.productId || (type === 'product' ? item.id : undefined);
    const targetServiceId = item.serviceId || (type === 'service' ? item.id : undefined);

    const existing = cart.find(i =>
      (targetProductId && i.productId === targetProductId) ||
      (targetServiceId && i.serviceId === targetServiceId)
    );

    if (existing) {
      setCart(cart.map(i =>
        i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setCart([...cart, {
        id: Math.random().toString(36).substr(2, 9),
        productId: targetProductId,
        serviceId: targetServiceId,
        description: item.name, // 'name' is mapped from 'description' for appt items
        quantity: 1,
        unitPrice: (type === 'product' ? item.price : item.basePrice) || 0,
        discount: 0,
        discountType: 'AMOUNT',
        stock: item.stock,
        category: item.category,
      }]);
    }
    toast.success(`${item.name} adicionado`);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const addPayment = () => {
    if (currentPayment.amount <= 0) return;

    setPayments([...payments, {
      id: Math.random().toString(36).substr(2, 9),
      method: currentPayment.method,
      amount: currentPayment.amount
    }]);

    setCurrentPayment({ ...currentPayment, amount: 0 });
    toast.success('Pagamento adicionado');
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
  };

  const resetPOS = () => {
    setCart([]);
    setPayments([]);
    setSelectedCustomer(null);
    setGlobalDiscount(0);
    setLastOrder(null);
    setRecentOrders([]);
    loadRecentOrders();
    setShowReceiptModal(false);
    setShowConfirmationModal(false);
    setShowPaymentModal(false);
  };

  const handleFinalize = async () => {
    if (cart.length === 0) return toast.error('Carrinho vazio');

    setIsProcessing(true);
    try {
      const order = await posService.createOrder({
        customerId: selectedCustomer?.id,
        cashSessionId: session.id,
        appointmentId,
        globalDiscount,
        sellerId: currentUser?.id,
        paymentCondition: 'À Vista',
        items: cart.map(item => ({
          productId: item.productId,
          serviceId: item.serviceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount
        }))
      });

      await posService.addPayment(order.id, payments);

      setLastOrder({
        ...order,
        items: cart,
        payments,
        customer: selectedCustomer,
        seller: currentUser?.name,
        date: new Date()
      });

      toast.success('Venda concluída!');
      setCart([]);
      setPayments([]);
      setGlobalDiscount(0);
      setShowConfirmationModal(false);
      setShowReceiptModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao finalizar');
    } finally {
      setIsProcessing(false);
    }
  };

  const shareToWhatsApp = (orderToShare?: any) => {
    const order = orderToShare || lastOrder;
    if (!order) return;

    const itemsText = order.items.map((i: any) =>
      `• ${i.description}: R$ ${(((i.unitPrice || 0) * (i.quantity || 0)) - (i.discount || 0)).toFixed(2)}`
    ).join('\n');

    const message = encodeURIComponent(
      `*CUPOM DE VENDA - 7PET*\n` +
      `----------------------------\n` +
      `Pedido: #${order.seqId}\n` +
      `Cliente: ${order.customer?.name || 'Consumidor'}\n` +
      `Data: ${new Date(order.createdAt || new Date()).toLocaleString()}\n` +
      `----------------------------\n` +
      `*ITENS:*\n${itemsText}\n` +
      `----------------------------\n` +
      `*TOTAL: R$ ${(order.total || 0).toFixed(2)}*\n` +
      `----------------------------\n` +
      `Obrigado pela preferência! 🐾`
    );

    const phone = order.customer?.phone?.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/55${phone}?text=${message}`
      : `https://wa.me/?text=${message}`;

    window.open(url, '_blank');
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Deseja realmente cancelar esta venda? Esta ação não pode ser desfeita.')) return;

    try {
      await posService.cancelOrder(orderId, 'Cancelamento via PDV');
      toast.success('Venda cancelada com sucesso');
      loadRecentOrders();
      setShowOrderDetailModal(false);
    } catch (error) {
      toast.error('Erro ao cancelar venda');
    }
  };

  // Componente de Cupom Térmico (Estilo Nota Fiscal)
  const ThermalReceipt = ({ order }: { order: any }) => {
    const grossSubtotal = (order.items || []).reduce((sum: number, item: any) => sum + ((item.unitPrice || 0) * (item.quantity || 0)), 0);
    const itemDiscounts = (order.items || []).reduce((sum: number, item: any) => sum + (item.discount || 0), 0);
    const globalDiscount = order.globalDiscount || 0;
    const totalDiscounts = itemDiscounts + globalDiscount;
    const finalTotal = order.finalAmount || order.total || (grossSubtotal - totalDiscounts);

    return (
      <div className="bg-white p-8 font-mono text-sm text-gray-800 shadow-inner rounded-sm border-t-4 border-gray-400 receipt-print">
        <div className="text-center mb-6 space-y-1">
          <h2 className="text-xl font-black uppercase tracking-tighter">7PET - SOLUÇÕES PET</h2>
          <p className="text-[10px] leading-tight">CNPJ: 00.000.000/0001-00</p>
          <p className="text-[10px] leading-tight underline uppercase font-bold">Cupom de Venda</p>
        </div>

        <div className="border-b border-dashed border-gray-300 py-3 space-y-0.5 text-[10px] uppercase">
          <div className="flex justify-between">
            <span>Pedido:</span>
            <span className="font-bold">#{order.seqId}</span>
          </div>
          <div className="flex justify-between">
            <span>Data:</span>
            <span>{new Date(order.createdAt || new Date()).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Operador:</span>
            <span>{order.seller || 'Sistema'}</span>
          </div>
        </div>

        <div className="py-4 space-y-2">
          <div className="flex justify-between text-[10px] font-bold border-b border-gray-200 pb-1 uppercase">
            <span className="w-1/2">Item/Descrição</span>
            <span className="w-1/4 text-right">Qtd</span>
            <span className="w-1/4 text-right">Total</span>
          </div>
          {(order.items || []).map((item: any, idx: number) => {
            const itemGross = (item.unitPrice || 0) * (item.quantity || 0);
            return (
              <div key={idx} className="flex flex-col text-[10px] leading-tight">
                <div className="flex justify-between">
                  <span className="w-1/2 truncate font-bold">{item.description}</span>
                  <span className="w-1/4 text-right">{item.quantity}un x {(item.unitPrice || 0).toFixed(2)}</span>
                  <span className="w-1/4 text-right">R$ {itemGross.toFixed(2)}</span>
                </div>
                {item.discount > 0 && (
                  <div className="flex justify-between text-[8px] text-gray-500 italic">
                    <span>* desconto item</span>
                    <span className="text-right">- R$ {item.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-dashed border-gray-300 pt-4 space-y-1">
          <div className="flex justify-between text-[10px]">
            <span>SUBTOTAL BRUTO:</span>
            <span>R$ {grossSubtotal.toFixed(2)}</span>
          </div>
          {totalDiscounts > 0 && (
            <div className="flex justify-between text-[10px] text-red-600 font-bold">
              <span>TOTAL DESCONTOS:</span>
              <span>- R$ {totalDiscounts.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black border-t border-gray-900 pt-2 mt-2">
            <span>TOTAL A PAGAR:</span>
            <span>R$ {finalTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Detalhe de Pagamento */}
        {order.payments && order.payments.length > 0 && (
          <div className="mt-4 pt-2 border-t border-gray-100 text-[9px] uppercase">
            <p className="font-bold mb-1 underline">Forma(s) de Pagamento:</p>
            {order.payments.map((p: any, idx: number) => (
              <div key={idx} className="flex justify-between">
                <span>{PAYMENT_METHODS.find(m => m.id === p.method)?.name || p.method}</span>
                <span>R$ {p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200 text-center space-y-1">
          <p className="text-[9px] uppercase font-bold">Obrigado pela preferência!</p>
          <div className="h-8 w-full flex items-center justify-center opacity-30 mt-2 text-gray-400">
            [|||| ||| || ||||| ||]
          </div>
          <p className="text-[8px] text-gray-400">Cupom Identificativo de Venda Interna</p>
        </div>
      </div>
    );
  };

  // Grid de Produtos
  const ProductGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {filteredItems.map((item, idx) => (
        <SpotlightCard
          key={item.id}
          className="group cursor-pointer h-full"
          onClick={() => addToCart(item, activeView === 'products' ? 'product' : 'service')}
        >
          <div className="flex flex-col h-full">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl mb-4 flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300 relative overflow-hidden">
              <Package className="w-12 h-12 text-gray-300 group-hover:text-blue-500 transition-all duration-300 transform group-hover:scale-110" />
              {item.stock !== undefined && (
                <div className={clsx(
                  "absolute top-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                  item.stock < 5 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {item.stock} un
                </div>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <h3 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.name}
              </h3>
              <div className="mt-auto pt-2 flex items-center justify-between">
                <span className="text-xl font-black text-blue-600">
                  R$ {item.price?.toFixed(2) || item.basePrice?.toFixed(2)}
                </span>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <Plus size={16} />
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      ))}
    </div>
  );

  // Carrinho
  const CartPanel = () => (
    <Card className="flex flex-col h-full border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-md">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative">
        <ShoppingCart className="absolute -right-4 -top-4 w-24 h-24 opacity-10 rotate-12" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Carrinho</h2>
              <p className="text-xs text-blue-100">{cart.length} itens selecionados</p>
            </div>
          </div>
          {cart.length > 0 && (
            <IconButton
              icon={Trash2}
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setCart([])}
            />
          )}
        </div>
      </div>

      {/* Itens */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 opacity-20" />
            </div>
            <p className="text-lg font-bold">Carrinho Vazio</p>
            <p className="text-sm text-center">Inicie sua venda adicionando produtos ou serviços ao lado.</p>
          </div>
        ) : (
          cart.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                  <Package className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 text-sm mb-1 leading-tight">{item.description}</h4>
                  <p className="text-xs text-gray-500 mb-3 font-medium">R$ {(item.unitPrice || 0).toFixed(2)} un</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-base text-gray-900">R$ {((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-red-300 hover:text-red-500 transition-all transform hover:scale-110"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Totais e Ações */}
      <div className="p-6 bg-gray-50 border-t border-gray-200 space-y-6">
        {/* Cliente */}
        <div className="relative">
          {selectedCustomer ? (
            <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{selectedCustomer.name}</p>
                  {selectedCustomer.petName && (
                    <Badge variant="secondary" size="sm" className="mt-1 bg-blue-50 text-blue-600 border-none">
                      Pet: {selectedCustomer.petName}
                    </Badge>
                  )}
                </div>
              </div>
              <IconButton
                icon={X}
                size="sm"
                variant="ghost"
                className="opacity-0 group-hover:opacity-100 text-gray-400"
                onClick={() => setSelectedCustomer(null)}
              />
            </div>
          ) : (
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="w-full h-14 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center gap-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-bold text-sm"
            >
              <User size={20} />
              Identificar Cliente
            </button>
          )}
        </div>

        {/* Totais */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="text-gray-900 font-bold">R$ {totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium text-red-500">Descontos</span>
            <span className="text-red-500 font-bold">- R$ {(totals.itemDiscounts + totals.globalDiscount).toFixed(2)}</span>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Geral</span>
              <div className="text-right">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
                  R$ {totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagamentos Progress */}
        {payments.length > 0 && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pagamentos</span>
              <span className="text-[10px] font-bold text-blue-600">{payments.length} transação(ões)</span>
            </div>
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500">{PAYMENT_METHODS.find(m => m.id === p.method)?.name}</span>
                  <span className="text-gray-900">R$ {p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalPaid / totals.total) * 100)}%` }}
                className={clsx(
                  "h-full transition-all duration-1000",
                  remainingToPay > 0 ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Botão Principal */}
        {cart.length > 0 && (
          <Button
            onClick={() => {
              if (remainingToPay <= 0 && payments.length > 0) {
                setShowConfirmationModal(true);
              } else {
                setShowPaymentModal(true);
                setCurrentPayment({ ...currentPayment, amount: remainingToPay });
              }
            }}
            disabled={isProcessing}
            className="w-full h-16 text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-500/20"
          >
            {isProcessing ? 'Finalizando...' : remainingToPay <= 0 && payments.length > 0 ? 'Concluir Venda' : `Pagar Agora`}
          </Button>
        )}
      </div>
    </Card>
  );

  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Lock className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Caixa Fechado</h2>
          <p className="text-gray-500 mb-6 text-lg">Abra o caixa para iniciar as vendas</p>
          <Button onClick={() => setShowOpenModal(true)} size="lg" className="px-8 py-4 text-lg">
            Abrir Caixa
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-10">
        {/* Header Superior Integrado */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex flex-col gap-1">
            <Breadcrumbs />
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
                <ShoppingCart size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ponto de Venda</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <StatusDot status={session ? 'online' : 'offline'} />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {session ? `Caixa Aberto • ${currentUser?.name || 'Operador'}` : 'Caixa Fechado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <IconButton
              icon={History}
              onClick={() => { setActiveView('recent'); loadRecentOrders(); }}
              variant={activeView === 'recent' ? 'primary' : 'secondary'}
              className="rounded-2xl h-12 w-12"
            />
            <Button
              onClick={() => setShowCloseModal(true)}
              variant="outline"
              className="h-12 px-6 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
            >
              <Lock className="w-5 h-5 mr-2" />
              Encerrar Turno
            </Button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Lado Esquerdo: Ferramentas e Itens */}
          <main className="flex-1 w-full space-y-6">
            <GlassSurface className="p-6 rounded-[2.5rem] border border-white shadow-xl">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="flex bg-gray-100/50 p-1.5 rounded-2xl w-full md:w-auto">
                  <button
                    onClick={() => setActiveView('products')}
                    className={clsx(
                      "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all",
                      activeView === 'products' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Package size={18} />
                    PRODUTOS
                  </button>
                  <button
                    onClick={() => setActiveView('services')}
                    className={clsx(
                      "flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm transition-all",
                      activeView === 'services' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    <Sparkles size={18} />
                    SERVIÇOS
                  </button>
                </div>

                <div className="relative w-full md:max-w-md group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="block w-full h-12 pl-11 pr-12 bg-gray-100/50 border-none rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Pesquisar itens ou escanear código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                    <Barcode className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {activeView === 'products' && (
                <div className="flex gap-2 overflow-x-auto pb-2 mt-6 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={clsx(
                        "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border-2",
                        selectedCategory === cat.id
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105"
                          : "bg-white border-gray-100 text-gray-400 hover:border-blue-100 hover:text-blue-500"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </GlassSurface>

            {/* Grid Area */}
            <div className="min-h-[600px]">
              {activeView === 'recent' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6 px-1">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Histórico de Vendas</h2>
                    <Badge variant="outline" className="text-[10px] uppercase">{recentOrders.length} registros</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {recentOrders.map((order) => (
                      <Card
                        key={order.id}
                        className="p-6 cursor-pointer hover:border-blue-300 hover:shadow-xl transition-all group relative overflow-hidden"
                        onClick={async () => {
                          try {
                            const fullOrder = await posService.getOrder(order.id);
                            setSelectedOrder(fullOrder);
                            setShowOrderDetailModal(true);
                          } catch (e) {
                            toast.error('Erro ao carregar detalhes');
                          }
                        }}
                      >
                        {order.status === 'CANCELLED' && (
                          <div className="absolute top-0 right-0 p-2 bg-red-500 text-white text-[8px] font-black uppercase rotate-45 translate-x-4 -translate-y-1 w-20 text-center">
                            Cancelada
                          </div>
                        )}
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                <History size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Cupom #{order.seqId}</p>
                                <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                  {order.customer?.name || 'Consumidor Final'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                              <p className="text-[10px] font-medium text-gray-300">{new Date(order.createdAt).toLocaleTimeString()}</p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Valor Total</span>
                              <span className="text-xl font-black text-gray-900">R$ {(order.finalAmount || order.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <ChevronRight size={18} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <ProductGrid />
              )}
            </div>
          </main>

          {/* Lado Direito: Checkout Integrado */}
          <aside className="w-full lg:w-[450px] lg:sticky lg:top-8 shrink-0">
            <CartPanel />
          </aside>
        </div>
      </div>

      {/* Carrinho Mobile Integrado */}
      {!isMobile && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40">
          <GlassSurface className="p-4 rounded-3xl shadow-2xl border-blue-100 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-lg font-black text-gray-900 tracking-tight">R$ {totals.total.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{cart.length} itens</p>
              </div>
            </div>
            <Button
              onClick={() => setShowPaymentModal(true)}
              className="px-6 h-12 rounded-xl font-black tracking-widest uppercase text-xs"
            >
              FECHAR PEDIDO
            </Button>
          </GlassSurface>
        </div>
      )}

      {/* PWA Mobile Cart (Overlay fixo se for PWA/Puro Mobile) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 pb-8 z-40 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase">Subtotal</span>
            <span className="text-2xl font-black text-blue-600 tracking-tighter">R$ {totals.total.toFixed(2)}</span>
          </div>
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="px-8 h-12 rounded-2xl font-black"
          >
            PAGAR
          </Button>
        </div>
      )}

      {/* Modais */}
      <AnimatePresence>
        {showOpenModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Unlock className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold">Abrir Caixa</h2>
                <p className="text-gray-500 mt-1">Informe o fundo de manejo inicial</p>
              </div>
              <div className="space-y-4">
                <input
                  type="number"
                  autoFocus
                  value={openingBalance || ''}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full h-20 text-4xl font-black text-center bg-gray-100 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 outline-none"
                  placeholder="0,00"
                />
                <Button
                  onClick={async () => {
                    try {
                      await posService.openSession({ openingBalance });
                      setShowOpenModal(false);
                      fetchSession();
                      toast.success('Caixa aberto com sucesso!');
                    } catch (error: any) {
                      const msg = error.response?.data?.error || 'Erro ao abrir caixa';
                      toast.error(msg);
                    }
                  }}
                  className="w-full py-4 text-lg font-bold bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirmar Abertura
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCloseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold">Fechar Caixa</h2>
                <p className="text-gray-500 mt-1">Informe o saldo final em caixa</p>
              </div>
              <div className="space-y-4">
                <input
                  type="number"
                  id="closingBalance"
                  autoFocus
                  className="w-full h-20 text-4xl font-black text-center bg-gray-100 border-2 border-gray-200 rounded-2xl focus:border-red-500 outline-none"
                  placeholder="0,00"
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCloseModal(false)}
                    className="flex-1 py-4 text-lg"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      const val = (document.getElementById('closingBalance') as HTMLInputElement).value;
                      try {
                        await posService.closeSession(session.id, { closingBalance: Number(val), notes: 'Fechamento de rotina' });
                        setShowCloseModal(false);
                        setSession(null);
                        toast.success('Caixa fechado com sucesso!');
                      } catch (error) {
                        toast.error('Erro ao fechar caixa');
                      }
                    }}
                    className="flex-1 py-4 text-lg bg-red-600 hover:bg-red-700"
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pagamento</h2>
                  <p className="text-gray-500">Escolha a forma de pagamento</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Grid de Métodos */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  {PAYMENT_METHODS.filter(m => !m.requiresStaff || (selectedCustomer?.isStaff || !!selectedCustomer?.user?.staffProfile)).map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setCurrentPayment({ ...currentPayment, method: method.id })}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${currentPayment.method === method.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                    >
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: method.bgColor }}
                      >
                        <method.icon className="w-7 h-7" style={{ color: method.color }} />
                      </div>
                      <span className="font-bold">{method.name}</span>
                    </button>
                  ))}
                </div>

                {/* Valor */}
                <div className="bg-gray-50 rounded-2xl p-5 mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-3">Valor</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={currentPayment.amount || ''}
                      onChange={(e) => setCurrentPayment({ ...currentPayment, amount: Number(e.target.value) })}
                      className="flex-1 h-16 text-3xl font-black text-center bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="0,00"
                    />
                    <button
                      onClick={() => setCurrentPayment({ ...currentPayment, amount: remainingToPay })}
                      className="px-6 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200"
                    >
                      Restante
                    </button>
                  </div>
                </div>

                <Button
                  onClick={addPayment}
                  disabled={currentPayment.amount <= 0}
                  className="w-full py-4 text-lg font-bold"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Adicionar Pagamento
                </Button>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 font-semibold">Total da Venda</span>
                  <span className="text-4xl font-black text-gray-900">R$ {totals.total.toFixed(2)}</span>
                </div>
                {remainingToPay > 0 ? (
                  <div className="flex items-center justify-between p-4 bg-amber-100 rounded-xl">
                    <span className="font-bold text-amber-800">Falta pagar</span>
                    <span className="text-2xl font-black text-amber-700">R$ {remainingToPay.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-emerald-100 rounded-xl">
                    <span className="font-bold text-emerald-800">Troco</span>
                    <span className="text-2xl font-black text-emerald-700">R$ {changeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCustomerSearch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Buscar Cliente</h2>
                  <button onClick={() => setShowCustomerSearch(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nome ou telefone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-4 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {customerResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Digite para buscar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerResults.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerSearch(false);
                          setCustomerSearch('');
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-lg">{customer.name}</p>
                          <p className="text-gray-500">{customer.phone || 'Sem telefone'}</p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOrderDetailModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col lg:flex-row gap-6"
            >
              {/* Receipt View */}
              <div className="flex-1 overflow-y-auto">
                <ThermalReceipt order={selectedOrder} />
              </div>

              {/* Management Actions */}
              <div className="w-full lg:w-72 flex flex-col gap-4">
                <Card className="p-5 bg-white shadow-2xl border-none">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Gerenciar Venda</h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setLastOrder(selectedOrder);
                        setTimeout(() => window.print(), 100);
                      }}
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl font-bold"
                    >
                      <Printer size={18} className="mr-3" />
                      Reimprimir
                    </Button>
                    <Button
                      onClick={() => shareToWhatsApp(selectedOrder)}
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl font-bold border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                    >
                      <MessageSquare size={18} className="mr-3" />
                      Reenviar WhatsApp
                    </Button>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
                    <Button
                      onClick={() => toast.success('Módulo de devolução em breve')}
                      variant="outline"
                      className="w-full justify-start h-12 rounded-xl font-bold"
                    >
                      <Package size={18} className="mr-3" />
                      Devolver Item
                    </Button>
                    <Button
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      variant="outline"
                      disabled={selectedOrder.status === 'CANCELLED'}
                      className="w-full justify-start h-12 rounded-xl font-bold border-red-100 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={18} className="mr-3" />
                      {selectedOrder.status === 'CANCELLED' ? 'Já Cancelada' : 'Cancelar Venda'}
                    </Button>
                  </div>
                </Card>

                <Button
                  onClick={() => setShowOrderDetailModal(false)}
                  variant="primary"
                  className="h-14 rounded-xl font-black tracking-widest uppercase"
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Confirmar Venda</h2>
                <p className="text-gray-500 text-sm">Resumo final antes da emissão</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <span className="text-blue-800 font-bold uppercase text-xs tracking-wider">Total a Receber</span>
                  <span className="text-2xl font-black text-blue-700">R$ {totals.total.toFixed(2)}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Cliente</span>
                    <span className="font-bold text-gray-900">{selectedCustomer?.name || 'Não Identificado'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Itens</span>
                    <span className="font-bold text-gray-900">{cart.length} item(s)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Pagamento</span>
                    <span className="font-bold text-gray-900">
                      {payments.map(p => PAYMENT_METHODS.find(m => m.id === p.method)?.name).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 h-14 font-bold border-gray-200"
                >
                  Alterar / Voltar
                </Button>
                <Button
                  onClick={handleFinalize}
                  className="flex-1 h-14 font-black text-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-xl"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Emitindo...' : 'CONFIRMAR'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceiptModal && lastOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md flex flex-col gap-6"
            >
              <div className="receipt-container scale-95 md:scale-100">
                <ThermalReceipt order={lastOrder} />
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => window.print()}
                    className="h-14 rounded-2xl font-black bg-white text-gray-900 hover:bg-gray-100 border-none shadow-xl"
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    IMPRIMIR
                  </Button>
                  <Button
                    onClick={() => shareToWhatsApp(lastOrder)}
                    className="h-14 rounded-2xl font-black bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-xl"
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    WHATSAPP
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={resetPOS}
                  className="h-16 rounded-2xl font-black text-white border-2 border-white/20 hover:bg-white/10 text-lg uppercase tracking-widest"
                >
                  NOVA VENDA
                </Button>
              </div>

              {/* Print Only Styles */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  body * { visibility: hidden; }
                  .receipt-print, .receipt-print * { visibility: visible; }
                  .receipt-print {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 72mm; /* Padrão térmica */
                    margin: 0;
                    padding: 4mm;
                    box-shadow: none;
                    border: none;
                  }
                  .receipt-container { padding: 0; margin: 0; }
                }
              `}} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default POS;
