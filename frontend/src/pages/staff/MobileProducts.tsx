import { useState, useEffect } from 'react';
import {
    Plus, Package, Search,
    MoreHorizontal, Edit2,
    AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { MobileShell } from '../../layouts/MobileShell';
import { Badge, IconButton, Button, EmptyState } from '../../components/ui';
import { toast } from 'react-hot-toast';

interface Product {
    id: string;
    seqId?: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
}

export const MobileProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<'active' | 'trash'>('active');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const endpoint = tab === 'trash' ? '/products/trash' : '/products';
            const response = await api.get(endpoint);
            setProducts(response.data);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            toast.error('Erro ao carregar lista de produtos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [tab]);

    const filteredProducts = products.filter(p => {
        return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <MobileShell
            title="Estoque & Produtos"
            rightAction={
                <button className="p-2 text-primary active:scale-90 transition-transform">
                    <Plus size={24} strokeWidth={2.5} />
                </button>
            }
        >
            <div className="p-4 space-y-6">
                {/* Search & Tabs */}
                <div className="space-y-4">
                    <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl">
                        <button
                            onClick={() => setTab('active')}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'active' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'text-gray-400'}`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setTab('trash')}
                            className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tab === 'trash' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400'}`}
                        >
                            Lixeira
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                {/* Products List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando estoque...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <EmptyState
                            icon={Package}
                            title="Nenhum produto"
                            description={searchTerm ? "Nenhum resultado para sua busca." : "Seu estoque está vazio."}
                        />
                    ) : (
                        filteredProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-zinc-900 rounded-[32px] p-5 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col gap-4 active:scale-[0.98] transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${product.stock <= 5 ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                            <Package size={28} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-secondary dark:text-white uppercase leading-tight">{product.name}</h3>
                                            <p className="text-[10px] font-bold text-primary mt-0.5">PR-{String((product.seqId || 0) + 1999).padStart(4, '0')}</p>
                                            <Badge variant="neutral" className="mt-2 px-2 py-0.5 text-[9px] font-bold">{product.category}</Badge>
                                        </div>
                                    </div>
                                    <IconButton icon={MoreHorizontal} variant="ghost" className="text-gray-400" aria-label="Opções do produto" />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estoque</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-bold ${product.stock <= 5 ? 'text-red-500' : 'text-secondary dark:text-white'}`}>
                                                {product.stock}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">unidades</span>
                                        </div>
                                        {product.stock <= 5 && (
                                            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-red-500">
                                                <AlertTriangle size={10} /> ESTOQUE BAIXO
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Preço Venda</p>
                                        <div className="flex flex-col">
                                            <span className="text-lg font-bold text-primary">
                                                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-400">unidade</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        className="rounded-xl font-bold text-[10px]"
                                        icon={Edit2}
                                    >
                                        EDITAR
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        fullWidth
                                        className="rounded-xl font-bold text-[10px]"
                                        icon={ArrowUpRight}
                                    >
                                        DETALHES
                                    </Button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Float Action Button */}
            {tab === 'active' && (
                <div className="fixed bottom-24 right-6 pointer-events-none">
                    <button className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all pointer-events-auto">
                        <Plus size={32} strokeWidth={3} />
                    </button>
                </div>
            )}
        </MobileShell>
    );
};
