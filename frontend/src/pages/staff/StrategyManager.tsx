import { useState, useEffect } from 'react';
import {
    Target,
    Plus,
    Search,
    Filter,
    Users,
    Briefcase,
    Calendar,
    TrendingUp,
    Trash2,
    Edit2,
    CheckCircle2,
    AlertCircle,
    Trophy,
    ArrowRight,
    Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import BackButton from '../../components/BackButton';
import Skeleton from '../../components/Skeleton';
import toast from 'react-hot-toast';
import { GoalProgressCard } from '../../components/staff/GoalProgressCard';

interface Goal {
    id: string;
    title: string;
    description?: string;
    targetValue: number;
    currentValue: number;
    initialValue: number;
    unit?: string;
    startDate: string;
    endDate: string;
    status: string;
    category?: string;
    department?: string;
    GoalAssignment: {
        StaffProfile: {
            id: string;
            user: { name: string };
        };
    }[];
}

export default function StrategyManager() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        targetValue: 0,
        initialValue: 0,
        unit: 'unid',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'GERAL',
        department: '',
        staffIds: [] as string[]
    });

    const [staffList, setStaffList] = useState<any[]>([]);

    const fetchGoals = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/goals');
            setGoals(response.data);
        } catch (err) {
            console.error('Erro ao buscar metas:', err);
            toast.error('Erro ao carregar metas');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await api.get('/hr/staff-profiles');
            setStaffList(response.data);
        } catch (err) {
            console.error('Erro ao buscar colaboradores:', err);
        }
    };

    useEffect(() => {
        fetchGoals();
        fetchStaff();
    }, []);

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/goals/${editingId}`, formData);
                toast.success('Meta atualizada com sucesso!');
            } else {
                await api.post('/goals', formData);
                toast.success('Meta criada com sucesso!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            fetchGoals();
            // Reset form
            setFormData({
                title: '',
                description: '',
                targetValue: 0,
                initialValue: 0,
                unit: 'unid',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: 'GERAL',
                department: '',
                staffIds: []
            });
        } catch (err: any) {
            toast.error(err.response?.data?.error || `Erro ao ${editingId ? 'atualizar' : 'criar'} meta`);
        }
    };

    const handleEditGoal = (goal: Goal) => {
        setEditingId(goal.id);
        const staffIds = goal.GoalAssignment?.map(ga => ga.StaffProfile.id) || [];

        setFormData({
            title: goal.title,
            description: goal.description || '',
            targetValue: goal.targetValue,
            initialValue: goal.initialValue,
            unit: goal.unit || 'unid',
            startDate: new Date(goal.startDate).toISOString().split('T')[0],
            endDate: new Date(goal.endDate).toISOString().split('T')[0],
            category: goal.category || 'GERAL',
            department: goal.department || '',
            staffIds: staffIds
        });
        setIsModalOpen(true);
    };

    const handleDeleteGoal = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta meta?')) return;
        try {
            await api.delete(`/goals/${id}`);
            toast.success('Meta excluída');
            fetchGoals();
        } catch (err) {
            toast.error('Erro ao excluir meta');
        }
    };

    const filteredGoals = goals.filter(g => {
        const matchesSearch = g.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || g.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <main className="p-6 md:p-10 bg-gray-50/50 dark:bg-transparent min-h-screen">
            <header className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-secondary dark:text-white flex items-center gap-3">
                            <Target className="text-primary" size={36} />
                            Gestão <span className="text-primary italic">Estratégica</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Defina objetivos, acompanhe o progresso e inspire sua equipe.</p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                description: '',
                                targetValue: 0,
                                initialValue: 0,
                                unit: 'unid',
                                startDate: new Date().toISOString().split('T')[0],
                                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                category: 'GERAL',
                                department: '',
                                staffIds: []
                            });
                            setIsModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary-dark text-secondary px-6 py-4 rounded-3xl shadow-xl shadow-primary/20 transition-all font-black flex items-center gap-2 active:scale-95 text-sm uppercase tracking-widest"
                    >
                        <Plus size={20} />
                        Nova Meta
                    </button>
                </div>
            </header>

            {/* Filters & Stats */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar metas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
                <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    {['ALL', 'ACTIVE', 'COMPLETED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-secondary text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                        >
                            {s === 'ALL' ? 'Todas' : s === 'ACTIVE' ? 'Ativas' : 'Concluídas'}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-80 bg-white dark:bg-gray-800 rounded-[32px] animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filteredGoals.map((goal) => (
                            <div key={goal.id} className="relative group">
                                <GoalProgressCard goal={goal} />
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={() => handleEditGoal(goal)}
                                        className="p-2 bg-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        className="p-2 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>

                    {filteredGoals.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
                            <Target size={48} className="mb-4 opacity-20" />
                            <p className="font-bold">Nenhuma meta encontrada</p>
                            <p className="text-sm">Clique em "Nova Meta" para começar.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Goal Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
                        >
                            <form onSubmit={handleCreateGoal} className="p-8 md:p-10 space-y-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-3xl font-black text-secondary dark:text-white">
                                        {editingId ? 'Editar' : 'Configurar'} <span className="text-primary italic">Meta</span>
                                    </h2>
                                    <button onClick={() => setIsModalOpen(false)} type="button" className="text-gray-400 hover:text-gray-600">
                                        <Circle className="fill-current" size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Título da Meta</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Ex: Recorde de Banhos Mensal"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Categoria</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
                                            >
                                                <option value="GERAL">Geral</option>
                                                <option value="SPA">SPA / Estética</option>
                                                <option value="LOGISTICA">Logística / Transporte</option>
                                                <option value="COMERCIAL">Vendas / Comercial</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Values */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Valor Alvo</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.targetValue}
                                                onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Valor Inicial</label>
                                            <input
                                                type="number"
                                                value={formData.initialValue}
                                                onChange={e => setFormData({ ...formData, initialValue: Number(e.target.value) })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 font-bold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Unidade</label>
                                            <input
                                                placeholder="ex: unid, R$, km"
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Início</label>
                                            <input
                                                required
                                                type="date"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Fim</label>
                                            <input
                                                required
                                                type="date"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>

                                    {/* Assignments */}
                                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-secondary dark:text-white">Responsáveis</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Departamento</label>
                                                <select
                                                    value={formData.department}
                                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                    className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
                                                >
                                                    <option value="">Nenhum (Específico por Pessoa)</option>
                                                    <option value="spa">SPA</option>
                                                    <option value="transport">Transporte</option>
                                                    <option value="atendimento">Atendimento</option>
                                                    <option value="gestao">Gestão</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ou Selecionar Colaboradores</label>
                                                <div className="h-32 overflow-y-auto p-2 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800">
                                                    {staffList.map(staff => (
                                                        <label key={staff.id} className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl cursor-pointer transition-colors">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.staffIds.includes(staff.id)}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        setFormData({ ...formData, staffIds: [...formData.staffIds, staff.id] });
                                                                    } else {
                                                                        setFormData({ ...formData, staffIds: formData.staffIds.filter(id => id !== staff.id) });
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{staff.user?.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-primary text-secondary font-black rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95"
                                    >
                                        {editingId ? 'Salvar Alterações' : 'Criar Meta'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </main>
    );
}
