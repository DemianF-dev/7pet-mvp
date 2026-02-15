import { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X, Plus } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Alert {
    id: string;
    type: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    message: string;
    isActive: boolean;
    createdAt: string;
}

interface CustomerAlertsSectionProps {
    customerId: string;
}

export default function CustomerAlertsSection({ customerId }: CustomerAlertsSectionProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [alertType, setAlertType] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('INFO');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAlerts();
    }, [customerId]);

    const fetchAlerts = async () => {
        try {
            const res = await api.get(`/customers/${customerId}/alerts?active=true`);
            setAlerts(res.data || []);
        } catch (error) {
            console.error('Erro ao carregar alertas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAlert = async () => {
        if (!title || !message) {
            toast.error('Título e mensagem são obrigatórios');
            return;
        }

        try {
            await api.post(`/customers/${customerId}/alerts`, {
                type: alertType,
                title,
                message
            });

            toast.success('Alerta criado!');
            setShowAddModal(false);
            setTitle('');
            setMessage('');
            fetchAlerts();
        } catch (error) {
            toast.error('Erro ao criar alerta');
        }
    };

    const handleResolveAlert = async (alertId: string) => {
        try {
            await api.patch(`/customers/alerts/${alertId}/resolve`);
            toast.success('Alerta resolvido!');
            fetchAlerts();
        } catch (error) {
            toast.error('Erro ao resolver alerta');
        }
    };

    const handleDeleteAlert = async (alertId: string) => {
        if (!window.confirm('Excluir este alerta?')) return;

        try {
            await api.delete(`/customers/alerts/${alertId}`);
            toast.success('Alerta excluído!');
            fetchAlerts();
        } catch (error) {
            toast.error('Erro ao excluir alerta');
        }
    };

    if (loading) return <div className="animate-pulse surface-card h-32" />;

    if (alerts.length === 0) return null; // Don't show section if no alerts

    const getAlertConfig = (type: string) => {
        switch (type) {
            case 'CRITICAL':
                return {
                    surfaceClass: 'status-error-surface',
                    icon: <AlertTriangle size={20} />,
                    badgeClass: 'status-error-badge'
                };
            case 'WARNING':
                return {
                    surfaceClass: 'status-warning-surface',
                    icon: <AlertTriangle size={20} />,
                    badgeClass: 'status-warning-badge'
                };
            default:
                return {
                    surfaceClass: 'status-info-surface',
                    icon: <Info size={20} />,
                    badgeClass: 'status-info-badge'
                };
        }
    };

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle size={16} /> Avisos Ativos ({alerts.length})
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="text-xs font-bold text-accent hover:text-heading transition-colors flex items-center gap-1"
                >
                    <Plus size={14} /> Novo Aviso
                </button>
            </div>

            <div className="space-y-3">
                {alerts.map(alert => {
                    const config = getAlertConfig(alert.type);
                    return (
                        <div
                            key={alert.id}
                            className={`p-5 rounded-[32px] ${config.surfaceClass} transition-all`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.badgeClass} flex-shrink-0`}>
                                    {config.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${config.badgeClass}`}>
                                            {alert.type}
                                        </span>
                                        <p className="text-sm font-bold text-heading">
                                            {alert.title}
                                        </p>
                                    </div>
                                    <p className="text-sm text-body-secondary font-medium leading-relaxed mb-3">
                                        {alert.message}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleResolveAlert(alert.id)}
                                            className="text-xs font-bold text-success hover:opacity-80 transition-opacity flex items-center gap-1"
                                        >
                                            <CheckCircle size={14} /> Marcar como Resolvido
                                        </button>
                                        <span className="text-muted">•</span>
                                        <button
                                            onClick={() => handleDeleteAlert(alert.id)}
                                            className="text-xs font-bold text-error hover:opacity-80 transition-opacity"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ADD ALERT MODAL */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="glass-elevated p-8 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-heading">Novo Aviso</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-heading transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                                    Tipo de Aviso
                                </label>
                                <div className="flex gap-2">
                                    {(['INFO', 'WARNING', 'CRITICAL'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setAlertType(type)}
                                            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${alertType === type
                                                    ? type === 'CRITICAL'
                                                        ? 'status-error-badge'
                                                        : type === 'WARNING'
                                                            ? 'status-warning-badge'
                                                            : 'status-info-badge'
                                                    : 'surface-input text-muted'
                                                }`}
                                        >
                                            {type === 'CRITICAL' && '🔴 Crítico'}
                                            {type === 'WARNING' && '⚠️ Aviso'}
                                            {type === 'INFO' && 'ℹ️ Info'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full surface-input px-4 py-3 font-bold text-heading"
                                    placeholder="Ex: Cliente inadimplente"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">
                                    Mensagem
                                </label>
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    className="w-full surface-input px-4 py-3 font-bold text-heading resize-none"
                                    rows={4}
                                    placeholder="Descreva o aviso em detalhes..."
                                />
                            </div>

                            <button
                                onClick={handleAddAlert}
                                className="w-full btn-primary py-4 font-bold uppercase text-sm tracking-widest"
                            >
                                Criar Aviso
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
