import React from 'react';

interface Pet {
    id: string;
    name: string;
    species: string;
}

interface PetDateSelectionProps {
    pets: Pet[];
    selectedPetId: string;
    onPetChange: (id: string) => void;
    desiredDate: string;
    onDateChange: (date: string) => void;
    desiredTime: string;
    onTimeChange: (time: string) => void;
}

const PetDateSelection = ({
    pets,
    selectedPetId,
    onPetChange,
    desiredDate,
    onDateChange,
    desiredTime,
    onTimeChange
}: PetDateSelectionProps) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-10 pb-10 border-b border-gray-100">
            <div className="flex-1 space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Sobre qual Pet?</label>
                <select
                    required
                    value={selectedPetId}
                    onChange={(e) => onPetChange(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold appearance-none transition-all"
                >
                    <option value="">Selecione o pet...</option>
                    {pets.map(pet => (
                        <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                    ))}
                </select>
            </div>
            <div className="flex-1 space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Data Pretendida</label>
                <input
                    type="date"
                    value={desiredDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                />
            </div>
            <div className="flex-1 space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Horário</label>
                <input
                    type="time"
                    step="900"
                    value={desiredTime}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/20 rounded-2xl px-6 py-4 shadow-sm text-secondary font-bold transition-all"
                />
            </div>
        </div>
    );
};

export default PetDateSelection;
