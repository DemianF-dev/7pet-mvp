import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Calendar,
    Clock,
    FileText,
    Copy,
    Printer,
    CheckCircle2,
    User,
    Package,
    ArrowRight,
    ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PackageInvoiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await api.get(`/recurrence/invoices/${id}`);
                setInvoice(response.data);
            } catch (error) {
                toast.error('Erro ao carregar detalhes da fatura.');
                navigate('/staff/recurrence');
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id, navigate]);

    const handleCopy = async () => {
        if (!confirm('Deseja copiar esta fatura (Estrutura e Ajustes Manuais) para o próximo mês?')) return;
        setCopying(true);
        try {
            const response = await api.post(`/recurrence/invoices/${id}/copy`);
            toast.success('Fatura copiada com sucesso!');
            navigate(`/staff/recurrence/invoices/${response.data.id}`);
        } catch (error) {
            toast.error('Erro ao copiar fatura.');
        } finally {
            setCopying(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <button
                onClick={() => navigate('/staff/recurrence')}
                className="flex items-center gap-2 text-sm font-bold text-body-secondary hover:text-heading mb-6 transition-colors"
            >
                <ChevronLeft size={18} /> Voltar para Recorrentes
            </button>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] uppercase tracking-wider ${invoice.status === 'RASCUNHO' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                            }`}>
                            {invoice.status}
                        </span>
                        <span className="text-body-secondary/30">•</span>
                        <span className="text-sm font-bold text-body-secondary">
                            Ref: {months[invoice.periodMonth - 1]} / {invoice.periodYear}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-heading uppercase tracking-tighter">
                        Pacote {invoice.type}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-body-secondary">
                        <User size={16} />
                        <span className="font-medium">{invoice.customer.name}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        disabled={copying}
                        className="flex items-center gap-2 bg-bg-surface border border-border px-4 py-2.5 rounded-xl font-bold text-sm hover:border-accent transition-all disabled:opacity-50"
                    >
                        {copying ? 'Copiando...' : <><Copy size={16} /> Copiar p/ Próximo Mês</>}
                    </button>
                    <button className="flex items-center gap-2 bg-heading text-bg-surface px-4 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                        <Printer size={16} /> Imprimir
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Items Section */}
                    <section>
                        <h2 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
                            <Package size={20} className="text-accent" /> Itens do Pacote
                        </h2>
                        <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-bg-subtle/50 text-[10px] font-bold uppercase tracking-widest text-body-secondary border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3">Descrição</th>
                                        <th className="px-6 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {invoice.lines.map((line: any) => (
                                        <tr key={line.id} className="text-sm hover:bg-bg-subtle/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-heading">{line.description}</div>
                                                <div className="text-xs text-body-secondary mt-0.5 uppercase tracking-tighter">{line.sourceType}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-heading">
                                                R$ {line.total.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-bg-subtle/50 border-t border-border">
                                    <tr>
                                        <td className="px-6 py-4 font-bold text-heading">Subtotal</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-heading text-lg">
                                            R$ {invoice.subtotal.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>

                    {/* Linked Appointments Details */}
                    <section>
                        <h2 className="text-lg font-bold text-heading mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-accent" /> Agendamentos Vinculados
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {invoice.links.map((link: any) => (
                                <div key={link.id} className="bg-bg-surface border border-border p-4 rounded-xl flex items-center justify-between group hover:border-accent transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-accent/5 text-accent rounded-lg">
                                            <ArrowRight size={18} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-heading">
                                                {format(new Date(link.appointment.startAt), "eeee, dd 'de' MMMM", { locale: ptBR })}
                                            </div>
                                            <div className="text-xs text-body-secondary">
                                                {link.appointment.pet.name} • {link.appointment.services?.map((s: any) => s.name).join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer">
                                        Ver Agendamento <ExternalLink size={14} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Stats / Info */}
                <div className="space-y-6">
                    <div className="bg-bg-surface border border-border rounded-2xl p-6">
                        <h3 className="font-bold text-heading mb-4">Informações Financeiras</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase text-body-secondary mb-1 block">Data de Vencimento</label>
                                <div className="flex items-center gap-2 text-heading font-bold">
                                    <Calendar size={16} className="text-accent" />
                                    {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-body-secondary mb-1 block">Total da Fatura</label>
                                <div className="text-2xl font-bold text-accent tracking-tighter">
                                    R$ {invoice.total.toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <hr className="my-6 border-border" />

                        {invoice.status === 'RASCUNHO' ? (
                            <button
                                onClick={async () => {
                                    if (!confirm('Emitir fatura? Esta ação é irreversível.')) return;
                                    try {
                                        await api.patch(`/recurrence/invoices/${id}/emit`);
                                        toast.success('Fatura emitida!');
                                        window.location.reload();
                                    } catch (err) {
                                        toast.error('Erro ao emitir fatura.');
                                    }
                                }}
                                className="w-full bg-success text-white py-3 rounded-xl font-bold shadow-lg shadow-success/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} /> Emitir Fatura
                            </button>
                        ) : (
                            <div className="bg-success/5 border border-success/10 p-4 rounded-xl flex gap-3">
                                <CheckCircle2 className="text-success shrink-0" size={20} />
                                <p className="text-xs text-success font-medium">Esta fatura já foi emitida e não pode ser editada.</p>
                            </div>
                        )}
                    </div>

                    {invoice.notes && (
                        <div className="bg-bg-surface border border-border rounded-2xl p-6">
                            <h3 className="font-bold text-heading mb-2 flex items-center gap-2">
                                <FileText size={18} className="text-body-secondary" /> Observações
                            </h3>
                            <p className="text-sm text-body-secondary leading-relaxed">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
