import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card } from '../ui/Card';
import './NotificationControlPanel.css';

interface NotificationSetting {
    id: string;
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

export const NotificationControlPanel = () => {
    const [activeTab, setActiveTab] = useState<'global' | 'users' | 'stats'>('global');
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
            setSettings(response.data);
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
            await api.put(`/notification-settings/settings/${type}`, updates);
            loadSettings();
        } catch (error) {
            console.error('Erro ao atualizar configuração:', error);
            alert('Erro ao atualizar configuração');
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'APPOINTMENT_REMINDER': '📅 Lembrete de Agendamento',
            'QUOTE_UPDATE': '💰 Atualização de Orçamento',
            'CHAT_MESSAGE': '💬 Mensagem de Chat',
            'DAILY_REVIEW': '🌙 Revisão Diária'
        };
        return labels[type] || type;
    };

    if (loading && activeTab !== 'stats') {
        return (
            <Card>
                <div className="notification-control-panel">
                    <p>Carregando configurações...</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="notification-control-panel">
                <h2>🔔 Controle de Notificações (MASTER)</h2>

                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={activeTab === 'global' ? 'active' : ''}
                        onClick={() => setActiveTab('global')}
                    >
                        Configurações Globais
                    </button>
                    <button
                        className={activeTab === 'users' ? 'active' : ''}
                        onClick={() => setActiveTab('users')}
                    >
                        Por Usuário
                    </button>
                    <button
                        className={activeTab === 'stats' ? 'active' : ''}
                        onClick={() => setActiveTab('stats')}
                    >
                        Estatísticas
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'global' && (
                    <div className="tab-content">
                        <h3>Configurações Globais de Notificação</h3>
                        <div className="settings-list">
                            {settings.map(setting => (
                                <div key={setting.id} className="setting-item">
                                    <div className="setting-header">
                                        <h4>{getTypeLabel(setting.notificationType)}</h4>
                                        <label className="toggle-switch">
                                            <input
                                                type="checkbox"
                                                checked={setting.enabled}
                                                onChange={(e) => updateSetting(setting.notificationType, { enabled: e.target.checked })}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>

                                    {setting.enabled && (
                                        <div className="setting-details">
                                            <div className="setting-row">
                                                <label>Frequência:</label>
                                                <select
                                                    value={setting.frequency}
                                                    onChange={(e) => updateSetting(setting.notificationType, { frequency: e.target.value })}
                                                >
                                                    <option value="IMMEDIATE">Imediata</option>
                                                    <option value="HOURLY">Horária (máx 1/hora)</option>
                                                    <option value="DAILY">Diária (máx 1/dia)</option>
                                                    <option value="DISABLED">Desabilitado</option>
                                                </select>
                                            </div>

                                            <div className="setting-row">
                                                <label>Intervalo Mínimo (minutos):</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={setting.minInterval}
                                                    onChange={(e) => updateSetting(setting.notificationType, { minInterval: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="tab-content">
                        <h3>Controle por Usuário</h3>
                        <p className="info-text">
                            Para controle granular por usuário, utilize a matriz de notificações abaixo
                        </p>
                        {/* This will be implemented in UserNotificationMatrix component */}
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="tab-content">
                        <h3>Estatísticas (Últimos 7 dias)</h3>
                        {stats ? (
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <h4>Total Enviadas</h4>
                                    <div className="stat-value">{stats.totalSent}</div>
                                </div>
                                <div className="stat-card">
                                    <h4>Total Lidas</h4>
                                    <div className="stat-value">{stats.totalRead}</div>
                                </div>
                                <div className="stat-card">
                                    <h4>Taxa de Leitura</h4>
                                    <div className="stat-value">
                                        {stats.totalSent > 0
                                            ? `${((stats.totalRead / stats.totalSent) * 100).toFixed(1)}%`
                                            : '0%'
                                        }
                                    </div>
                                </div>

                                <div className="stats-by-type">
                                    <h4>Por Tipo:</h4>
                                    {Object.entries(stats.statsByType).map(([type, data]) => (
                                        <div key={type} className="type-stat">
                                            <span className="type-label">{getTypeLabel(type)}</span>
                                            <span>Enviadas: {data.sent}</span>
                                            <span>Lidas: {data.read}</span>
                                            <span>Taxa: {data.sent > 0 ? `${((data.read / data.sent) * 100).toFixed(1)}%` : '0%'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p>Carregando estatísticas...</p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
