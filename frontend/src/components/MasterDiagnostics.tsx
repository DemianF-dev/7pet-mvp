/**
 * Master Diagnostics Panel
 * Only accessible by MASTER users or in development mode
 * Shows error history, SW status, and performance metrics
 */

import React, { useState } from 'react';
import { useErrorStore } from '../store/errorStore';
import { useAuthStore } from '../store/authStore';
import { AlertTriangle, CheckCircle, Download, Trash2, Wifi, WifiOff, Activity, Package } from 'lucide-react';

const MasterDiagnostics: React.FC = () => {
    const { user, isInitialized } = useAuthStore();
    const { errors, clearErrors } = useErrorStore();
    const [swStatus, setSwStatus] = useState<any>(null);

    // Initializing state to avoid flashes
    if (!isInitialized) {
        return null;
    }

    // Security: Only show for MASTER or in dev
    const isMaster = user?.role === 'MASTER';
    const isDev = import.meta.env.DEV;

    if (!isMaster && !isDev) {
        return (
            <div className="p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold">Acesso Negado</h2>
                <p className="text-muted-foreground">Este painel é exclusivo para usuários MASTER.</p>
            </div>
        );
    }

    // Check SW status on mount
    React.useEffect(() => {
        checkServiceWorkerStatus();
    }, []);

    const checkServiceWorkerStatus = async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                setSwStatus({
                    registered: !!registration,
                    active: !!registration?.active,
                    waiting: !!registration?.waiting,
                    installing: !!registration?.installing,
                    scope: registration?.scope,
                });
            } catch (err) {
                console.error('Failed to check SW status:', err);
                setSwStatus({ error: true });
            }
        } else {
            setSwStatus({ supported: false });
        }
    };

    const exportErrors = () => {
        const data = {
            exportedAt: new Date().toISOString(),
            buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
            userAgent: navigator.userAgent,
            errors: errors,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `7pet-errors-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const online = navigator.onLine;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h1 className="text-2xl font-bold mb-2">🔧 Master Diagnostics</h1>
                <p className="text-muted-foreground">
                    Sistema de diagnóstico e monitoramento de erros
                </p>
            </div>

            {/* Status Cards */}
            <div className="grid md:grid-cols-3 gap-4">
                {/* Connection Status */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        {online ? (
                            <Wifi className="w-5 h-5 text-green-500" />
                        ) : (
                            <WifiOff className="w-5 h-5 text-destructive" />
                        )}
                        <h3 className="font-semibold">Conexão</h3>
                    </div>
                    <p className={`text-sm ${online ? 'text-green-600' : 'text-destructive'}`}>
                        {online ? 'Online' : 'Offline'}
                    </p>
                </div>

                {/* Error Count */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <h3 className="font-semibold">Erros Rastreados</h3>
                    </div>
                    <p className="text-2xl font-bold">{errors.length}/20</p>
                </div>

                {/* Build Version */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Versão</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {import.meta.env.VITE_APP_VERSION || 'development'}
                    </p>
                </div>
            </div>

            {/* Service Worker Status */}
            {swStatus && (
                <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Service Worker</h2>
                        {swStatus.registered && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                    </div>

                    {swStatus.supported === false ? (
                        <p className="text-sm text-muted-foreground">Service Worker não suportado</p>
                    ) : swStatus.error ? (
                        <p className="text-sm text-destructive">Erro ao verificar status</p>
                    ) : (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Registrado:</span>
                                <span>{swStatus.registered ? '✅ Sim' : '❌ Não'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ativo:</span>
                                <span>{swStatus.active ? '✅ Sim' : '❌ Não'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Aguardando:</span>
                                <span>{swStatus.waiting ? '⏳ Sim' : '❌ Não'}</span>
                            </div>
                            {swStatus.scope && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Escopo:</span>
                                    <span className="font-mono text-xs">{swStatus.scope}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Error History */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Histórico de Erros</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={exportErrors}
                            disabled={errors.length === 0}
                            className="
                                px-4 py-2 bg-primary text-primary-foreground rounded-lg
                                font-medium text-sm hover:bg-primary/90
                                disabled:opacity-50 disabled:cursor-not-allowed
                                flex items-center gap-2
                            "
                        >
                            <Download className="w-4 h-4" />
                            Exportar JSON
                        </button>
                        <button
                            onClick={clearErrors}
                            disabled={errors.length === 0}
                            className="
                                px-4 py-2 bg-destructive text-destructive-foreground rounded-lg
                                font-medium text-sm hover:bg-destructive/90
                                disabled:opacity-50 disabled:cursor-not-allowed
                                flex items-center gap-2
                            "
                        >
                            <Trash2 className="w-4 h-4" />
                            Limpar
                        </button>
                    </div>
                </div>

                {errors.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                        <p className="text-muted-foreground">Nenhum erro registrado</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {errors.map((error) => (
                            <div
                                key={error.id}
                                className="bg-destructive/5 border border-destructive/20 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                                        <span className="font-semibold text-sm">{error.name}</span>
                                        <span className="text-xs px-2 py-0.5 bg-destructive/10 rounded">
                                            {error.type}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(error.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>

                                <p className="text-sm text-foreground/90 mb-2 font-mono">
                                    {error.message}
                                </p>

                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span>📍 {error.route}</span>
                                    <span>{error.online ? '🟢 Online' : '🔴 Offline'}</span>
                                </div>

                                {error.stack && (
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                                            Ver stack trace
                                        </summary>
                                        <pre className="mt-2 p-3 bg-background rounded text-xs overflow-x-auto border border-border">
                                            {error.stack}
                                        </pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performance Hint */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold mb-1">Dica de Performance</h3>
                        <p className="text-sm text-muted-foreground">
                            Este painel mantém os últimos 20 erros em memória. Para análises mais profundas,
                            exporte os dados em JSON e use ferramentas externas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MasterDiagnostics;
