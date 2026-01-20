import { useState, useEffect } from 'react';
import {
    Target,
    Plus,
    Search,
    TrendingUp,
    Trash2,
    Edit2,
    X,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { Card, Badge, IconButton, Button, Input, Select, GlassSurface } from '../../components/ui';
import QueryState from '../../components/system/QueryState';
import toast from 'react-hot-toast';
import { GoalProgressCard } from '../../components/staff/GoalProgressCard';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
        setError(null);
        try {
            const response = await api.get('/goals');
            setGoals(response.data);
        } catch (err) {
            console.error('Erro ao buscar metas:', err);
            setError('Não foi possível carregar as metas estratéticas.');
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
        <main className="p-[var(--space-6)] md:p-[var(--space-10)] bg-[var(--color-bg-primary)] min-h-screen">
            <header className="mb-[var(--space-10)]">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-[var(--space-4)]">
                            <IconButton
                                icon={ChevronLeft}
                                onClick={() => navigate(-1)}
                                variant="secondary"
                                aria-label="Voltar"
                            />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-[var(--font-weight-black)] text-[var(--color-text-primary)] tracking-tight flex items-center gap-3">
                            <Target className="text-[var(--color-accent-primary)] hidden md:block" size={40} strokeWidth={2.5} />
                            Gestão <span className="text-[var(--color-accent-primary)]">Estratégica</span>
                        </h1>
                        <p className="text-[var(--color-text-tertiary)] mt-3 text-lg font-medium">Defina objetivos e acompanhe o progresso da sua equipe.</p>
                    </div>

                    <Button
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
                        variant="primary"
                        className="h-14 px-8 font-[var(--font-weight-black)] text-xs tracking-widest uppercase"
                        icon={Plus}
                    >
                        NOVA META
                    </Button>
                </div>
            </header>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar metas pelo título..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={Search}
                        className="h-14"
                    />
                </div>
                <div className="flex gap-1.5 p-1.5 bg-[var(--color-bg-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] shadow-sm self-start">
                    {['ALL', 'ACTIVE', 'COMPLETED'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-6 py-2.5 rounded-lg text-[10px] font-[var(--font-weight-black)] uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-[var(--color-text-primary)] text-white shadow-md' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-fill-secondary)]'}`}
                        >
                            {s === 'ALL' ? 'Todas' : s === 'ACTIVE' ? 'Ativas' : 'Concluídas'}
                        </button>
                    ))}
                </div>
            </div>

            <QueryState
                isLoading={isLoading}
                error={error}
                isEmpty={filteredGoals.length === 0}
                onRetry={fetchGoals}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredGoals.map((goal, index) => (
                        <motion.div
                            key={goal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative group"
                        >
                            <GoalProgressCard goal={goal} />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                <IconButton
                                    icon={Edit2}
                                    onClick={() => handleEditGoal(goal)}
                                    variant="secondary"
                                    size="sm"
                                    aria-label="Editar"
                                />
                                <IconButton
                                    icon={Trash2}
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    variant="secondary"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-50"
                                    aria-label="Excluir"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </QueryState>

            {/* Create/Edit Goal Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl"
                        >
                            <Card className="p-0 overflow-hidden shadow-[var(--shadow-2xl)] border-transparent bg-[var(--color-bg-surface)]">
                                <form onSubmit={handleCreateGoal}>
                                    <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-[var(--color-border-subtle)]">
                                        <h2 className="text-2xl font-[var(--font-weight-black)] text-[var(--color-text-primary)]">
                                            {editingId ? 'Editar' : 'Configurar'} <span className="text-[var(--color-accent-primary)]">Meta</span>
                                        </h2>
                                        <IconButton icon={X} onClick={() => setIsModalOpen(false)} variant="ghost" aria-label="Fechar" size="sm" />
                                    </div>

                                    <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Título da Meta"
                                                required
                                                placeholder="Ex: Recorde de Banhos Mensal"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                            <Select
                                                label="Categoria"
                                                required
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                options={[
                                                    { value: 'GERAL', label: 'Geral' },
                                                    { value: 'SPA', label: 'SPA / Estética' },
                                                    { value: 'LOGISTICA', label: 'Logística / Transporte' },
                                                    { value: 'COMERCIAL', label: 'Vendas / Comercial' }
                                                ]}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <Input
                                                label="Valor Alvo"
                                                required
                                                type="number"
                                                value={formData.targetValue}
                                                onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                            />
                                            <Input
                                                label="Valor Inicial"
                                                type="number"
                                                value={formData.initialValue}
                                                onChange={e => setFormData({ ...formData, initialValue: Number(e.target.value) })}
                                            />
                                            <Input
                                                label="Unidade"
                                                placeholder="ex: unid, R$, km"
                                                value={formData.unit}
                                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <Input
                                                label="Início"
                                                required
                                                type="date"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                            <Input
                                                label="Fim"
                                                required
                                                type="date"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Responsabilidade</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <Select
                                                    label="Por Departamento"
                                                    value={formData.department}
                                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                                    options={[
                                                        { value: '', label: 'Nenhum (Específico por Pessoa)' },
                                                        { value: 'spa', label: 'SPA' },
                                                        { value: 'transport', label: 'Transporte' },
                                                        { value: 'atendimento', label: 'Atendimento' },
                                                        { value: 'gestao', label: 'Gestão' }
                                                    ]}
                                                />
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] ml-1">Por Colaborador</label>
                                                    <div className="h-32 overflow-y-auto p-3 border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] bg-[var(--color-fill-secondary)] custom-scrollbar">
                                                        {staffList.map(staff => (
                                                            <label key={staff.id} className="flex items-center gap-3 p-2 hover:bg-[var(--color-bg-surface)] rounded-lg cursor-pointer transition-colors group">
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
                                                                    className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary-alpha)]"
                                                                />
                                                                <span className="text-xs font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">{staff.user?.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 pt-4 flex gap-4 bg-[var(--color-fill-tertiary)]/30 border-t border-[var(--color-border-subtle)]">
                                        <Button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            CANCELAR
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className="flex-1 font-black tracking-widest"
                                        >
                                            {editingId ? 'SALVAR ALTERAÇÕES' : 'CRIAR META'}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Bottom safe area for mobile */}
            <div className="h-24 md:hidden" aria-hidden="true" />
        </main>
    );
}
