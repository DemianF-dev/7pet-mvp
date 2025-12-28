import { useState, useEffect } from 'react';
import { X, Dog, Heart, Info, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PetFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    isLoading?: boolean;
}

export default function PetForm({ isOpen, onClose, onSubmit, initialData, isLoading }: PetFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        species: 'Cachorro',
        breed: '',
        weight: '',
        observations: '',
        preferences: '',
        coatType: 'CURTA',
        usesPerfume: false,
        usesOrnaments: false,
        marketingConsent: false,
        temperament: '',
        firstTime: false,
        age: '',
        healthIssues: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                species: initialData.species || 'Cachorro',
                breed: initialData.breed || '',
                weight: initialData.weight?.toString() || '',
                observations: initialData.observations || '',
                preferences: initialData.preferences || '',
                coatType: initialData.coatType || 'CURTA',
                usesPerfume: initialData.usesPerfume || false,
                usesOrnaments: initialData.usesOrnaments || false,
                marketingConsent: initialData.marketingConsent || false,
                temperament: initialData.temperament || '',
                firstTime: initialData.firstTime || false,
                age: initialData.age || '',
                healthIssues: initialData.healthIssues || '',
            });
        } else {
            setFormData({
                name: '',
                species: 'Cachorro',
                breed: '',
                weight: '',
                observations: '',
                preferences: '',
                coatType: 'CURTA',
                usesPerfume: false,
                usesOrnaments: false,
                marketingConsent: false,
                temperament: '',
                firstTime: false,
                age: '',
                healthIssues: '',
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const weightValue = formData.weight ? parseFloat(formData.weight) : undefined;
        onSubmit({
            ...formData,
            weight: isNaN(weightValue as any) ? undefined : weightValue
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-secondary/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-8 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
                                    <Dog size={24} />
                                </div>
                                <h2 className="text-2xl font-extrabold text-secondary">
                                    {initialData ? 'Editar Pet' : 'Novo Pet'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:text-secondary hover:bg-gray-100 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nome do Pet</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Rex"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Espécie</label>
                                    <select
                                        value={formData.species}
                                        onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium appearance-none"
                                    >
                                        <option value="Cachorro">Cachorro</option>
                                        <option value="Gato">Gato</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Raça (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Golden"
                                        value={formData.breed}
                                        onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Peso (kg)</label>
                                    <div className="relative">
                                        <Scale className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="number"
                                            step="0.1"
                                            placeholder="0.0"
                                            value={formData.weight}
                                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <Heart size={14} className="text-red-400" />
                                    Preferências / O que ele gosta?
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Gosta de carinho na barriga, petisco de frango"
                                    value={formData.preferences}
                                    onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                                    className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <Info size={14} />
                                    Observações Importantes
                                </label>
                                <textarea
                                    placeholder="Ex: Alérgico a Shampoo XPTO, tem medo de secador"
                                    rows={2}
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                    className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium resize-none shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Pelagem</label>
                                    <select
                                        value={formData.coatType}
                                        onChange={(e) => setFormData({ ...formData, coatType: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                    >
                                        <option value="CURTA">Curta</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="LONGA">Longa</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Idade</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 3 anos"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Temperamento</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Bravo, Dócil"
                                        value={formData.temperament}
                                        onChange={(e) => setFormData({ ...formData, temperament: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Saúde/Alergias</label>
                                    <input
                                        type="text"
                                        placeholder="Problemas de saúde"
                                        value={formData.healthIssues}
                                        onChange={(e) => setFormData({ ...formData, healthIssues: e.target.value })}
                                        className="w-full bg-gray-50 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all text-secondary font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 p-4 bg-gray-50 rounded-2xl">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.usesPerfume}
                                        onChange={(e) => setFormData({ ...formData, usesPerfume: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Perfume?</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.usesOrnaments}
                                        onChange={(e) => setFormData({ ...formData, usesOrnaments: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Enfeites?</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.marketingConsent}
                                        onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">Uso de Imagem?</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.firstTime}
                                        onChange={(e) => setFormData({ ...formData, firstTime: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-bold text-secondary group-hover:text-primary transition-colors">1ª Vez Banho?</span>
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 bg-gray-100 text-secondary font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Adicionar Pet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
