import { useState, useEffect } from 'react';
import { X, Info, Cpu, Calendar, Clock, Zap, Server, Database, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { APP_VERSION } from '../constants/version';

interface SystemInfo {
    version: string;
    serverTime: string;
    aiProvider: string;
    aiModel: string;
    environment: string;
    uptime?: string;
}

interface SystemInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SystemInfoModal({ isOpen, onClose }: SystemInfoModalProps) {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchSystemInfo();
        }
    }, [isOpen]);

    const fetchSystemInfo = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
            const baseUrl = apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;

            const response = await fetch(`${baseUrl}/health`);
            const data = await response.json();

            setSystemInfo({
                version: data.version || APP_VERSION,
                serverTime: data.serverTime || new Date().toISOString(),
                aiProvider: data.version?.includes('GEMINI') ? 'Google Gemini' : 'OpenAI',
                aiModel: data.version?.includes('GEMINI') ? 'Gemini 1.5 Flash' : 'GPT-4',
                environment: import.meta.env.MODE || 'production',
                uptime: data.uptime
            });
        } catch (error) {
            console.error('Failed to fetch system info:', error);
            setSystemInfo({
                version: APP_VERSION,
                serverTime: new Date().toISOString(),
                aiProvider: 'Indisponível',
                aiModel: 'Indisponível',
                environment: import.meta.env.MODE || 'production'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-bg-surface border border-border rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-6 border-b border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center">
                                    <Info className="text-accent" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-heading">Informações do Sistema</h2>
                                    <p className="text-xs text-body-secondary">7Pet Management Platform</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-body-secondary hover:text-heading"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent"></div>
                            </div>
                        ) : systemInfo ? (
                            <>
                                {/* Version */}
                                <InfoCard
                                    icon={<Cpu size={18} />}
                                    label="Versão do Sistema"
                                    value={systemInfo.version}
                                    color="text-blue-500"
                                />

                                {/* AI Provider */}
                                <InfoCard
                                    icon={<Zap size={18} />}
                                    label="Provedor de IA"
                                    value={systemInfo.aiProvider}
                                    color="text-purple-500"
                                />

                                {/* AI Model */}
                                <InfoCard
                                    icon={<Server size={18} />}
                                    label="Modelo de IA"
                                    value={systemInfo.aiModel}
                                    color="text-indigo-500"
                                />

                                {/* Server Time */}
                                <InfoCard
                                    icon={<Clock size={18} />}
                                    label="Hora do Servidor"
                                    value={format(new Date(systemInfo.serverTime), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                    color="text-green-500"
                                />

                                {/* Environment */}
                                <InfoCard
                                    icon={<Database size={18} />}
                                    label="Ambiente"
                                    value={systemInfo.environment === 'production' ? 'Produção' : 'Desenvolvimento'}
                                    color="text-orange-500"
                                />

                                {/* Client Version */}
                                <InfoCard
                                    icon={<Shield size={18} />}
                                    label="Versão do Cliente"
                                    value={APP_VERSION}
                                    color="text-cyan-500"
                                />
                            </>
                        ) : null}
                    </div>

                    {/* Footer */}
                    <div className="bg-bg-elevated p-4 border-t border-border">
                        <p className="text-xs text-body-secondary text-center">
                            © 2024-2026 7Pet. Todos os direitos reservados.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border hover:border-accent/30 transition-colors">
            <div className={`${color} shrink-0`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-body-secondary">{label}</p>
                <p className="text-sm font-semibold text-heading truncate">{value}</p>
            </div>
        </div>
    );
}
