import { useState, useEffect } from 'react';
import {
    Plus,
    Edit2,
    Trash2,
    Package,
    Search,
    CheckSquare,
    Square,
    RefreshCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StaffSidebar from '../../components/StaffSidebar';
import api from '../../services/api';
import BackButton from '../../components/BackButton';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
}

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkMode, setIsBulkMode] = useState(false);

    const handleSelectAll = () => {
        if (selectedIds.length === filteredProducts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProducts.map(p => p.id));
        }
    };


    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: 0,
        stock: 0,
        category: 'Geral'
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || '',
                price: product.price,
                stock: product.stock,
                category: product.category || 'Geral'
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: 0,
                stock: 0,
                category: 'Geral'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.patch(`/products/${editingProduct.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            fetchProducts();
            setIsModalOpen(false);
        } catch (error: any) {
            alert(error.response?.data?.error || 'Erro ao salvar produto');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('ATENÇÃO: Deseja realmente excluir este produto?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchProducts();
        } catch (error) {
            alert('Erro ao excluir produto');
        }
    };

    const toggleSelect = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`ATENÇÃO: Deseja realmente excluir PERMANENTEMENTE os ${selectedIds.length} produtos selecionados?`)) return;
        try {
            await api.post('/products/bulk-delete', { ids: selectedIds });
            fetchProducts();
            setSelectedIds([]);
        } catch (error) {
            alert('Erro ao excluir produtos');
        }
    };

    const filteredProducts = products.filter(p => {
        return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.category?.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    const sortedProducts = [...filteredProducts];


    return (
        <div className="min-h-screen bg-gray-50 flex">
            <StaffSidebar />

            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                                <div className="h-[2px] w-6 bg-primary"></div>
                                GESTÃO DE ESTOQUE
                            </div>
                            <h1 className="text-4xl font-black text-secondary tracking-tight">Produtos</h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={() => setIsBulkMode(!isBulkMode)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black transition-all ${isBulkMode ? 'bg-secondary text-white shadow-xl' : 'bg-white text-gray-400 hover:text-secondary shadow-sm'}`}
                            >
                                <CheckSquare size={14} strokeWidth={isBulkMode ? 3 : 2} />
                                <span className="uppercase tracking-[0.15em]">{isBulkMode ? 'Sair da Seleção' : 'Ações em Massa'}</span>
                            </button>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar produto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all font-bold"
                                />
                            </div>

                            <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 uppercase text-xs tracking-widest transition-all">
                                <Plus size={20} /> Novo Produto
                            </button>
                        </div>
                    </div>
                </header>

                <AnimatePresence>
                    {(selectedIds.length > 0 || isBulkMode) && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-10 min-w-[500px]"
                        >
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleSelectAll}
                                    className="bg-white/10 hover:bg-white/20 text-[10px] font-black px-5 py-2 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2"
                                >
                                    {selectedIds.length === filteredProducts.length ? 'Desmarcar Todos' : 'Selecionar Tudo'}
                                </button>
                                <p className="text-sm font-black flex items-center gap-3 border-l border-white/10 pl-4">
                                    <span className="bg-primary px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-primary/20">{selectedIds.length}</span>
                                    itens no total
                                </p>
                            </div>
                            <div className="h-10 w-px bg-white/10 ml-auto"></div>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={() => { setSelectedIds([]); setIsBulkMode(false); }}
                                    className="text-[10px] font-black hover:text-gray-300 transition-colors uppercase tracking-[0.2em]"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedIds.length === 0}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${selectedIds.length > 0 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20 active:scale-95' : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                                >
                                    <Trash2 size={18} /> Apagar Agora
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center">
                            <RefreshCcw className="animate-spin text-primary mx-auto" size={48} />
                        </div>
                    ) : sortedProducts.length === 0 ? (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-[40px] bg-white">
                            <Package className="mx-auto text-gray-200 mb-4" size={64} />
                            <p className="text-gray-400 font-bold">Nenhum produto encontrado.</p>
                        </div>
                    ) : sortedProducts.map(product => (
                        <motion.div
                            layout
                            key={product.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:border-primary/20 transition-all relative overflow-hidden ${selectedIds.includes(product.id) ? 'ring-2 ring-primary' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${product.stock <= 5 ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                    <Package size={24} />
                                </div>
                                <div className="flex gap-2">
                                    {(isBulkMode || selectedIds.includes(product.id)) && (
                                        <button
                                            onClick={(e) => toggleSelect(product.id, e)}
                                            className={`p-2 rounded-xl transition-all shadow-md border ${selectedIds.includes(product.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-300 border-gray-100 hover:text-primary'}`}
                                        >
                                            {selectedIds.includes(product.id) ? <CheckSquare size={18} strokeWidth={3} /> : <Square size={18} strokeWidth={3} />}
                                        </button>
                                    )}
                                    <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                        <Edit2 size={16} className="text-gray-400" />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                                        <Trash2 size={16} className="text-red-400" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-secondary mb-1 uppercase truncate">{product.name}</h3>
                            <p className="text-gray-400 text-xs font-bold mb-4 line-clamp-2 h-8">{product.description || 'Sem descrição'}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                <div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Estoque</p>
                                    <p className={`text-sm font-black ${product.stock <= 5 ? 'text-red-500' : 'text-secondary'}`}>{product.stock} un</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Preço</p>
                                    <p className="text-lg font-black text-primary">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Product Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-secondary/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-8 w-full max-w-lg relative z-10 shadow-2xl"
                        >
                            <h2 className="text-3xl font-black text-secondary mb-8">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="Ex: Shampoo Antipulgas"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                                        placeholder="Detalhes adicionais..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                                className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Estoque</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.stock}
                                            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                                    >
                                        <option value="Geral">Geral</option>
                                        <option value="Higiene">Higiene</option>
                                        <option value="Acessórios">Acessórios</option>
                                        <option value="Alimentação">Alimentação</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 rounded-2xl font-black text-gray-400 uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Cancelar</button>
                                    <button type="submit" className="flex-1 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all">Salvar Produto</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
