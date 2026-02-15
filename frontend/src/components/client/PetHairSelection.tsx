import { motion } from 'framer-motion';
import { Dog, Cat, Star } from 'lucide-react';

interface Pet {
    id: string;
    name: string;
    species: string;
    weight?: number;
    breed?: string;
}

interface PetHairSelectionProps {
    pets: Pet[];
    selectedPetId: string;
    onPetChange: (id: string) => void;
    hairLength: string;
    onHairLengthChange: (length: string) => void;
    onNext: () => void;
    quoteType: string | null;
}

const PetHairSelection: React.FC<PetHairSelectionProps> = ({
    pets,
    selectedPetId,
    onPetChange,
    hairLength,
    onHairLengthChange,
    onNext,
    quoteType
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-10"
        >
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-gray-50">
                <div className="max-w-2xl mx-auto space-y-12">
                    {/* Pet Selection */}
                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-secondary">Para qual <span className="text-primary italic">Pet</span>?</h2>
                            <p className="text-gray-400 text-sm mt-2">Selecione o pet que receberá o atendimento</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {pets.map(pet => (
                                <button
                                    key={pet.id}
                                    type="button"
                                    onClick={() => onPetChange(pet.id)}
                                    className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 group ${selectedPetId === pet.id ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-gray-50 border-transparent hover:border-primary/20 text-secondary'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedPetId === pet.id ? 'bg-white/20' : 'bg-white shadow-sm group-hover:bg-primary group-hover:text-white'}`}>
                                        {pet.species.toLowerCase().includes('gato') ? <Cat size={24} /> : <Dog size={24} />}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm uppercase tracking-tight">{pet.name}</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedPetId === pet.id ? 'text-white/70' : 'text-gray-400'}`}>
                                            {pet.breed || 'SRD'} • {pet.weight ? `${pet.weight}kg` : 'Peso N/I'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {/* TODO: Add Pet redirect if needed, but for now just placeholder */ }}
                                className="p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-gray-400 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-all group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-primary/10">
                                    <Star size={20} />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Novo Pet</span>
                            </button>
                        </div>
                    </div>

                    {/* Hair Length Selection - Only for SPA */}
                    {quoteType !== 'TRANSPORTE' && selectedPetId && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 pt-10 border-t border-gray-50"
                        >
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-secondary">E o <span className="text-primary italic">Pelo</span> dele?</h2>
                                <p className="text-gray-400 text-sm mt-2">Isso define quais serviços e preços são ideais para ele</p>
                            </div>

                            <div className="flex bg-gray-50 p-2 rounded-[32px] border border-gray-100 max-w-md mx-auto">
                                {['curto', 'medio', 'longo'].map((length) => (
                                    <button
                                        key={length}
                                        type="button"
                                        onClick={() => onHairLengthChange(length)}
                                        className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${hairLength === length ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-gray-400 hover:text-secondary'}`}
                                    >
                                        {length === 'curto' ? 'Curto' : length === 'medio' ? 'Médio' : 'Longo'}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    <div className="pt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={!selectedPetId || (quoteType !== 'TRANSPORTE' && !hairLength)}
                            className="btn-primary px-12 py-5 rounded-[28px] text-lg disabled:opacity-50 disabled:grayscale transition-all"
                        >
                            Próximo Passo
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PetHairSelection;
