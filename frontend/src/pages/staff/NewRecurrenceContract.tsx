import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Save, Calendar, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CustomerAutocomplete from '../../components/CustomerAutocomplete';
import Breadcrumbs from '../../components/staff/Breadcrumbs';

export default function NewRecurrenceContract() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialType = location.state?.type || 'SPA';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        customerId: '',
        title: '',
        type: initialType,
        frequency: 'MENSAL',
        status: 'ATIVO',
        billingDay: 5,
        defaultDiscountPercent: 0,
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.customerId) {
            toast.error('Selecione um cliente.');
            return;
        }
        if (!formData.title) {
            toast.error('Defina um título para o contrato.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/recurrence/contracts', formData);
            toast.success('Contrato criado com sucesso!');
            navigate('/staff/recurrence');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Erro ao criar contrato.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <header className="mb-8">
                <Breadcrumbs />
                <button
                    onClick={() => navigate('/staff/recurrence')}
                    className="flex items-center gap-2 text-body-secondary hover:text-heading transition-colors font-bold mb-4"
                >
                    <ChevronLeft size={20} /> Voltar
                </button>
                <h1 className="text-3xl font-black text-heading uppercase tracking-tight">Novo Contrato de Recorrência</h1>
                <p className="text-body-secondary mt-1">Configurar novo pacote recorrente para cliente</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-bg-surface border border-border rounded-[32px] p-8 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Cliente */}
                        <div className="col-span-full">
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Cliente</label>
                            <CustomerAutocomplete
                                value={formData.customerId}
                                onSelect={(id) => setFormData({ ...formData, customerId: id })}
                                className="w-full"
                            />
                        </div>

                        {/* Título */}
                        <div className="col-span-full">
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Título do Contrato</label>
                            <input
                                type="text"
                                className="w-full bg-bg-subtle border border-border rounded-xl px-4 py-3 outline-none focus:border-accent font-bold"
                                placeholder="Ex: Pacote Banho Semanal + Tosa"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Tipo de Serviço</label>
                            <div className="flex gap-2">
                                {['SPA', 'TRANSPORTE'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type })}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === type
                                                ? 'bg-heading text-bg-surface'
                                                : 'bg-bg-subtle text-body-secondary hover:bg-border'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Frequência */}
                        <div>
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Frequência</label>
                            <select
                                className="w-full bg-bg-subtle border border-border rounded-xl px-4 py-3 outline-none focus:border-accent font-bold"
                                value={formData.frequency}
                                onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                            >
                                <option value="SEMANAL">Semanal</option>
                                <option value="QUINZENAL">Quinzenal</option>
                                <option value="MENSAL">Mensal</option>
                            </select>
                        </div>

                        {/* Dia de Faturamento */}
                        <div>
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Dia de Vencimento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-body-secondary" size={18} />
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    className="w-full bg-bg-subtle border border-border rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent font-bold"
                                    placeholder="Dia"
                                    value={formData.billingDay}
                                    onChange={e => setFormData({ ...formData, billingDay: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Desconto Padrão */}
                        <div>
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Desconto Padrão (%)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-body-secondary" size={18} />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full bg-bg-subtle border border-border rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent font-bold"
                                    value={formData.defaultDiscountPercent}
                                    onChange={e => setFormData({ ...formData, defaultDiscountPercent: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="col-span-full">
                            <label className="text-xs font-bold text-body-secondary uppercase tracking-widest pl-1 mb-2 block">Observações Internas</label>
                            <textarea
                                className="w-full bg-bg-subtle border border-border rounded-xl px-4 py-3 outline-none focus:border-accent font-medium min-h-[100px]"
                                placeholder="Detalhes sobre o acordo..."
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/staff/recurrence')}
                        className="px-6 py-3 rounded-xl font-bold text-body-secondary hover:text-heading hover:bg-bg-subtle transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-accent text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Salvando...' : 'Criar Contrato'}
                    </button>
                </div>
            </form>
        </div>
    );
}
