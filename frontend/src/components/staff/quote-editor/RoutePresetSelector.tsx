import React, { useState, useEffect } from 'react';
import { Star, MapPin, Trash2, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import toast from 'react-hot-toast';

interface RoutePreset {
    id: string;
    name: string;
    type: 'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF';
    origin?: string;
    destination?: string;
    stops?: any;
}

interface RoutePresetSelectorProps {
    customerId: string;
    petId?: string;
    onSelect: (preset: RoutePreset) => void;
    onClose: () => void;
}

const RoutePresetSelector: React.FC<RoutePresetSelectorProps> = ({ customerId, petId, onSelect, onClose }) => {
    const [presets, setPresets] = useState<RoutePreset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPresets = async () => {
            if (!customerId) return;
            try {
                const response = await api.get('/quotes/transport/presets', {
                    params: { customerId, petId }
                });
                setPresets(response.data);
            } catch (error) {
                console.error('Erro ao buscar favoritos:', error);
                toast.error('Erro ao carregar rotas favoritas');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPresets();
    }, [customerId, petId]);

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja remover este favorito?')) return;

        setDeletingId(id);
        try {
            await api.delete(`/quotes/transport/presets/${id}`);
            setPresets(presets.filter(p => p.id !== id));
            toast.success('Favorito removido');
        } catch (error) {
            console.error('Erro ao deletar:', error);
            toast.error('Erro ao remover favorito');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
        >
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    Rotas Favoritas
                </h4>
                <button onClick={onClose} className="text-xs text-blue-500 hover:underline">Fechar</button>
            </div>

            <div className="max-h-60 overflow-y-auto">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-primary" />
                    </div>
                ) : presets.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                        Nenhuma rota salva para este cliente.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {presets.map(preset => (
                            <div
                                key={preset.id}
                                onClick={() => {
                                    onSelect(preset);
                                    onClose();
                                }}
                                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group transition-colors flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{preset.name}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <MapPin size={10} />
                                        <span className="truncate max-w-[180px]">{preset.origin}</span>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                            {preset.type === 'ROUND_TRIP' ? 'Leva e Traz' : preset.type === 'PICK_UP' ? 'Busca' : 'Entrega'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, preset.id)}
                                    disabled={deletingId === preset.id}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    {deletingId === preset.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default RoutePresetSelector;
