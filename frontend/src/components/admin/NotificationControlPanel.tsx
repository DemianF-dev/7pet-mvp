import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import './NotificationControlPanel.css';

interface NotificationSetting {
    id?: string;
    notificationType: string;
    enabled: boolean;
    frequency: string;
    allowedRoles: string;
    minInterval: number;
}

interface NotificationStats {
    totalSent: number;
    totalRead: number;
    statsByType: Record<string, { sent: number; read: number }>;
}

const SYSTEM_TYPES = [
    { type: 'SYSTEM_DAILY_REVIEW', label: '🌙 Revisão Diária (Admin/Staff)', defaultFrequency: '22:00' },
    { type: 'SYSTEM_APPOINTMENT_REMINDER_24H', label: '⏰ Lembrete de Agendamento (24h antes)', defaultFrequency: 'IMMEDIATE' },
    { type: 'SYSTEM_APPOINTMENT_REMINDER_1H', label: '🚀 Lembrete de Agendamento (1h antes)', defaultFrequency: 'IMMEDIATE' }
];

export const NotificationControlPanel = () => {
    const [activeTab, setActiveTab] = useState<'global' | 'system' | 'stats'>('system');
    const [settings, setSettings] = useState<NotificationSetting[]>([]);
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSettings();
        if (activeTab === 'stats') {
            loadStats();
        }
    }, [activeTab]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/notification-settings/settings');

            // Mescla settings retornadas com os defaults do sistema para garantir que apareçam
            const dbSettings = response.data as NotificationSetting[];

            // Garante que os tipos de sistema existam na lista
            const systemSettings = SYSTEM_TYPES.map(sys => {
                const existing = dbSettings.find(s => s.notificationType === sys.type);
                return existing || {
                    notificationType: sys.type,
                    enabled: true,
                    frequency: sys.defaultFrequency,
                    allowedRoles: '[]',
                    minInterval: 0
                };
            });

            // Filtra os que não são de sistema para a lista geral
            const otherSettings = dbSettings.filter(s => !SYSTEM_TYPES.some(sys => sys.type === s.notificationType));

            setSettings([...systemSettings, ...otherSettings]);
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await api.get('/notification-settings/stats?days=7');
            setStats(response.data);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    const updateSetting = async (type: string, updates: Partial<NotificationSetting>) => {
        try {
            // Optimistic update
            setSettings(prev => prev.map(s => s.notificationType === type ? { ...s, ...updates } : s));

            await api.put(`/notification-settings/settings/${type}`, updates);
            // Reload not essential if optimistic worked, but good for sync
        } catch (error) {
            console.error('Erro ao atualizar configuração:', error);
            alert('Erro ao atualizar configuração');
            loadSettings(); // Rollback
        }
    };

    const getTypeLabel = (type: string) => {
        const sysLabel = SYSTEM_TYPES.find(s => s.type === type)?.label;
        if (sysLabel) return sysLabel;

        const labels: Record<string, string> = {
            'APPOINTMENT_REMINDER': '📅 Notificações Gerais de Agendamento',
            'QUOTE_UPDATE': '💰 Atualização de Orçamento',
            'CHAT_MESSAGE': '💬 Mensagem de Chat',
            'DAILY_REVIEW': '🌙 Revisão Diária (Legado)'
        };
        return labels[type] || type;
    };

    const isSystemType = (type: string) => SYSTEM_TYPES.some(s => s.type === type);

    if (loading && activeTab !== 'stats' && settings.length === 0) {
        return (
            <Card>
                <div className="notification-control-panel flex flex-col items-center justify-center p-8">
                    <p>Carregando configurações...</p>
                </div>
            </Card>
        );
    }

    const systemSettings = settings.filter(s => isSystemType(s.notificationType));
    const globalSettings = settings.filter(s => !isSystemType(s.notificationType));

    return (
        <Card className="w-full">
            <div className="notification-control-panel">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">🔔 Central de Notificações</h2>
                </div>

                {/* Tabs */}
                <div className="tabs flex space-x-2 border-b mb-6">
                    <button
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'system' ? 'border-primary-500 text-primary-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('system')}
                    >
                        Automação do Sistema
                    </button>
                    <button
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'global' ? 'border-primary-500 text-primary-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('global')}
                    >
                        Tipos de Notificação
                    </button>
                    <button
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'stats' ? 'border-primary-500 text-primary-600 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Estatísticas
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'system' && (
                    <div className="tab-content space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 mb-4">
                            ℹ️ Estas configurações controlam as automações do sistema. O agendador roda a cada 1 minuto para verificar estas regras.
                        </div>

                        <div className="settings-list space-y-4">
                            {systemSettings.map(setting => (
                                <div key={setting.notificationType} className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-3">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{getTypeLabel(setting.notificationType)}</h4>
                                            <p className="text-sm text-gray-500">
                                                {setting.notificationType === 'SYSTEM_DAILY_REVIEW'
                                                    ? 'Envia resumo dos agendamentos do dia seguinte para toda a equipe.'
                                                    : setting.notificationType.includes('24H')
                                                        ? 'Lembra o cliente confirmando o horário 1 dia antes.'
                                                        : 'Avisa o cliente que o agendamento está próximo.'
                                                }
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={setting.enabled}
                                                onChange={(e) => updateSetting(setting.notificationType, { enabled: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>

                                    {setting.enabled && setting.notificationType === 'SYSTEM_DAILY_REVIEW' && (
                                        <div className="mt-3 pt-3 border-t flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <label className="text-xs font-semibold text-gray-600 mb-1">Horário de Envio</label>
                                                <input
                                                    type="time"
                                                    value={setting.frequency.includes(':') ? setting.frequency : '22:00'}
                                                    onChange={(e) => updateSetting(setting.notificationType, { frequency: e.target.value })}
                                                    className="border rounded px-2 py-1 text-sm w-32 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div className="text-xs text-gray-500 mt-4">
                                                O sistema verificará este horário exato todos os dias.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'global' && (
                    <div className="tab-content">
                        <h3 className="text-lg font-semibold mb-4">Tipos de Notificação Gerais</h3>
                        <div className="settings-list space-y-4">
                            {globalSettings.map(setting => (
                                <div key={setting.id || setting.notificationType} className="bg-white border rounded-lg p-4 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium">{getTypeLabel(setting.notificationType)}</h4>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={setting.enabled}
                                                onChange={(e) => updateSetting(setting.notificationType, { enabled: e.target.checked })}
                                            />
                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    {setting.enabled && (
                                        <div className="mt-2 text-xs text-gray-500">
                                            Frequência: {setting.frequency === 'IMMEDIATE' ? 'Imediata' : setting.frequency}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="tab-content">
                        <h3 className="text-lg font-semibold mb-4">Estatísticas (Últimos 7 dias)</h3>
                        {stats ? (
                            <div className="stats-grid grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="stat-card bg-blue-50 p-4 rounded-lg">
                                    <h4 className="text-sm text-blue-800 font-medium">Total Enviadas</h4>
                                    <div className="text-2xl font-bold text-blue-900">{stats.totalSent}</div>
                                </div>
                                <div className="stat-card bg-green-50 p-4 rounded-lg">
                                    <h4 className="text-sm text-green-800 font-medium">Total Lidas</h4>
                                    <div className="text-2xl font-bold text-green-900">{stats.totalRead}</div>
                                </div>
                                <div className="stat-card bg-purple-50 p-4 rounded-lg">
                                    <h4 className="text-sm text-purple-800 font-medium">Taxa de Leitura</h4>
                                    <div className="text-2xl font-bold text-purple-900">
                                        {stats.totalSent > 0
                                            ? `${((stats.totalRead / stats.totalSent) * 100).toFixed(1)}%`
                                            : '0%'
                                        }
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p>Carregando estatísticas...</p>
                        )}

                        {stats && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-700 mb-2">Detalhes por Tipo:</h4>
                                {Object.entries(stats.statsByType).map(([type, data]) => (
                                    <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                        <span className="font-medium text-gray-700">{getTypeLabel(type)}</span>
                                        <div className="flex space-x-4 text-gray-600">
                                            <span>Env: {data.sent}</span>
                                            <span>Lid: {data.read}</span>
                                            <span className="font-mono">{data.sent > 0 ? `${((data.read / data.sent) * 100).toFixed(0)}%` : '0%'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
