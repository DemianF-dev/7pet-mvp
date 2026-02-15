import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, History, RotateCcw, AlertCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface AuditLogEntry {
    id: string;
    action: string;
    performedByName: string;
    previousData: any;
    newData: any;
    createdAt: string;
    reason?: string;
}

interface AuditLogModalProps {
    entityType: string;
    entityId: string;
    onClose: () => void;
    isAdmin: boolean;
    onRollback?: () => void;
}

export default function AuditLogModal({ entityType, entityId, onClose, isAdmin, onRollback }: AuditLogModalProps) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, [entityType, entityId]);

    const fetchLogs = async () => {
        try {
            const response = await api.get(`/audit/${entityType}/${entityId}`);
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching logs:', error);
            toast.error('Erro ao carregar histórico');
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = async (logId: string) => {
        if (!window.confirm('ATENÇÃO: Isso reverterá o item para o estado ANTERIOR a esta alteração. Deseja continuar?')) return;

        try {
            await api.post(`/audit/${logId}/rollback`);
            toast.success('Rollback realizado com sucesso!');
            fetchLogs();
            if (onRollback) onRollback();
        } catch (error) {
            console.error('Rollback error:', error);
            toast.error('Erro ao realizar rollback');
        }
    };

    const formatDiff = (prev: any, curr: any) => {
        // Simple diff logic - could be improved with a library
        // For now, listing changes in top-level keys
        if (!prev || !curr) return 'Dados indisponíveis para comparação';

        const changes: string[] = [];
        const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

        allKeys.forEach(key => {
            if (key === 'updatedAt' || key === 'createdAt') return;
            if (JSON.stringify(prev[key]) !== JSON.stringify(curr[key])) {
                changes.push(`${key}: ${JSON.stringify(prev[key])} -> ${JSON.stringify(curr[key])}`);
            }
        });

        if (changes.length === 0) return 'Nenhuma alteração detectada (update sem mudanças)';

        return (
            <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                {changes.map((change, i) => (
                    <li key={i} className="break-all">{change}</li>
                ))}
            </ul>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Histórico de Alterações</h3>
                            <p className="text-sm text-gray-500 font-medium">Log de auditoria completo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Carregando histórico...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">Nenhuma alteração registrada.</div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="relative pl-8 pb-8 border-l-2 border-dashed border-gray-200 last:border-0 last:pb-0">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-500"></div>

                                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-purple-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                                                {log.action}
                                            </span>
                                            <p className="text-sm font-bold text-gray-800">
                                                Alterado por: <span className="text-purple-600">{log.performedByName}</span>
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {isAdmin && log.action === 'UPDATE' && (
                                            <button
                                                onClick={() => handleRollback(log.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                            >
                                                <RotateCcw size={12} /> Rollback
                                            </button>
                                        )}
                                    </div>

                                    {log.reason && (
                                        <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg text-xs font-medium mb-3 flex items-start gap-2">
                                            <AlertCircle size={14} className="mt-0.5" />
                                            {log.reason}
                                        </div>
                                    )}

                                    <div className="bg-white rounded-xl p-3 border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Alterações</p>
                                        {formatDiff(log.previousData, log.newData)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
}
