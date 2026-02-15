import {
    Calculator,
    Dog,
    AlertCircle,
    CheckCircle2,
    CalendarDays
} from 'lucide-react';

interface QuotePet {
    name?: string;
    coatType?: string;
    weight?: number;
    healthIssues?: string;
    temperament?: string;
    observations?: string;
}

interface CustomerPet {
    id: string;
    name: string;
    breed?: string;
    age?: string;
    observations?: string;
}

interface Quote {
    pet?: QuotePet;
    type?: string;
    hairLength?: string;
    hasKnots?: boolean;
    knotRegions?: string;
    hasParasites?: boolean;
    transportPeriod?: string;
}

interface QuotePricingVariablesProps {
    quote: Quote;
    desiredAt: string;
    setDesiredAt: (val: string) => void;
    scheduledAt: string;
    setScheduledAt: (val: string) => void;
    transportAt?: string;
    setTransportAt?: (val: string) => void;
    transportLevaAt: string;
    setTransportLevaAt: (val: string) => void;
    transportTrazAt: string;
    setTransportTrazAt: (val: string) => void;
    petId: string | null;
    customerPets: CustomerPet[];
    onPetChange: (id: string) => void;
    isRecurring: boolean;
    setIsRecurring: (val: boolean) => void;
    recurrenceFrequency: string;
    setRecurrenceFrequency: (val: string) => void;

    // New editable fields
    hairLength: string;
    setHairLength: (val: string) => void;
    hasKnots: boolean;
    setHasKnots: (val: boolean) => void;
    knotRegions: string;
    setKnotRegions: (val: string) => void;
    hasParasites: boolean;
    setHasParasites: (val: boolean) => void;
    wantsMedicatedBath: boolean;
    setWantsMedicatedBath: (val: boolean) => void;
    petQuantity: number;
    setPetQuantity: (val: number) => void;
}

const QuotePricingVariables: React.FC<QuotePricingVariablesProps> = ({
    quote,
    desiredAt,
    setDesiredAt,
    scheduledAt,
    setScheduledAt,
    transportLevaAt,
    setTransportLevaAt,
    transportTrazAt,
    setTransportTrazAt,
    petId,
    customerPets,
    onPetChange,
    isRecurring,
    setIsRecurring,
    recurrenceFrequency,
    setRecurrenceFrequency,
    hairLength,
    setHairLength,
    hasKnots,
    setHasKnots,
    knotRegions,
    setKnotRegions,
    hasParasites,
    setHasParasites,
    wantsMedicatedBath,
    setWantsMedicatedBath,
    petQuantity,
    setPetQuantity,
}) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4 text-secondary dark:text-white font-bold text-sm uppercase tracking-widest">
                <Calculator size={16} className="text-primary" />
                Variáveis de Precificação
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Pet Básico */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Pet</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Dog size={16} className="text-gray-400" />
                            {customerPets.length > 0 ? (
                                <select
                                    value={petId || ''}
                                    onChange={(e) => onPetChange(e.target.value)}
                                    className="bg-transparent border-none font-bold text-secondary dark:text-white focus:ring-0 p-0 text-sm cursor-pointer hover:text-primary transition-colors dark:bg-gray-700"
                                >
                                    <option value="">Selecionar Pet</option>
                                    {customerPets.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.breed || 'SRD'})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-bold text-secondary dark:text-white">{quote.pet?.name || 'N/A'}</span>
                            )}
                        </div>
                        {petId && customerPets.find(p => p.id === petId) && (
                            <span className="text-xs text-gray-400">
                                ({customerPets.find(p => p.id === petId)?.breed || 'SRD'} - {customerPets.find(p => p.id === petId)?.age || 'Idade N/A'})
                            </span>
                        )}
                        {!petId && !quote.pet && (
                            <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                                <AlertCircle size={10} /> Pet não associado!
                            </p>
                        )}
                    </div>
                    {(petId ? customerPets.find(p => p.id === petId)?.observations : quote.pet?.observations) && (
                        <p className="text-xs text-red-400 mt-2 font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900">
                            ⚠️ Obs: {petId ? customerPets.find(p => p.id === petId)?.observations : quote.pet?.observations}
                        </p>
                    )}
                </div>

                {/* Pelagem & Nós */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-bl-2xl -mr-1 -mt-1 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors"></div>
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 block">Pelagem</label>
                    <select
                        value={hairLength}
                        onChange={(e) => setHairLength(e.target.value)}
                        className="bg-transparent border-none font-bold text-secondary dark:text-white p-0 text-sm focus:ring-0 w-full"
                    >
                        <option value="">Não inf.</option>
                        <option value="Curta">Curta</option>
                        <option value="Média">Média</option>
                        <option value="Longa">Longa</option>
                    </select>

                    <div className="flex flex-wrap gap-1 mt-2">
                        <button
                            type="button"
                            onClick={() => setHasKnots(!hasKnots)}
                            className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase transition-colors ${hasKnots ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                        >
                            {hasKnots ? 'Com Nós' : 'Sem Nós'}
                        </button>
                        {hasKnots && (
                            <input
                                type="text"
                                value={knotRegions}
                                onChange={(e) => setKnotRegions(e.target.value)}
                                placeholder="Regiões..."
                                className="text-[9px] text-gray-500 bg-gray-50 dark:bg-gray-700 border-none rounded p-1 w-full mt-1"
                            />
                        )}
                    </div>
                </div>

                {/* Peso & Porte */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Porte</p>
                    <p className="font-bold text-secondary dark:text-white text-sm">{quote.pet?.weight ? `${quote.pet.weight} kg` : 'N/A'}</p>
                    <div className="flex items-center gap-2 mt-1">
                        <label className="text-[9px] text-gray-400 uppercase font-bold">Qty Pet:</label>
                        <input
                            type="number"
                            value={petQuantity}
                            onChange={(e) => setPetQuantity(parseInt(e.target.value) || 1)}
                            className="bg-transparent border-none font-bold text-secondary dark:text-white p-0 text-[10px] focus:ring-0 w-10"
                        />
                    </div>
                </div>

                {/* Transporte */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Transporte</p>
                    {quote?.type === 'SPA_TRANSPORTE' || quote?.type === 'TRANSPORTE' ? (
                        <>
                            <p className="font-bold text-secondary dark:text-white text-sm">Leva e Traz</p>
                            <p className="text-[10px] text-purple-500 font-bold mt-1 uppercase">{quote.transportPeriod || 'Período N/A'}</p>
                        </>
                    ) : (
                        <p className="font-bold text-gray-400 text-sm">Próprio Meio</p>
                    )}
                </div>

                {/* Saúde/Vermes */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Parasitas</p>
                    <button
                        type="button"
                        onClick={() => setHasParasites(!hasParasites)}
                        className={`font-bold text-sm flex items-center gap-1 transition-colors ${hasParasites ? 'text-red-500' : 'text-green-500'}`}
                    >
                        {hasParasites ? (
                            <><AlertCircle size={12} /> Com Parasitas</>
                        ) : (
                            <><CheckCircle2 size={12} /> Sem Parasitas</>
                        )}
                    </button>
                    <p className="text-[9px] text-gray-400 mt-1">Vacinas: Verif. Carteira</p>
                    <button
                        type="button"
                        onClick={() => setWantsMedicatedBath(!wantsMedicatedBath)}
                        className={`text-[9px] mt-2 font-bold px-2 py-1 rounded transition-all flex items-center gap-1 ${wantsMedicatedBath ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                        {wantsMedicatedBath ? '✨ Banho Medicamentoso' : 'Banho Padrão'}
                    </button>
                </div>

                {/* Temperamento */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2">Temperamento</p>
                    <p className="font-bold text-secondary dark:text-white text-sm">{quote.pet?.temperament || 'Não inf.'}</p>
                </div>

                {/* Recorrência Granular */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 p-5 rounded-3xl border border-purple-100 dark:border-purple-800/30 col-span-2 md:col-span-3 lg:col-span-5">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRecurring ? 'bg-purple-500 text-white shadow-lg shadow-purple-200' : 'bg-gray-200 text-gray-400 dark:bg-gray-700'}`}>
                                <CalendarDays size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Plano de Recorrência (v2)</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${isRecurring ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/40' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}
                                    >
                                        {isRecurring ? 'Ativo' : 'Inativo'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {isRecurring && (
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                {(quote?.type === 'SPA' || quote?.type === 'SPA_TRANSPORTE') && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                            {quote?.type === 'SPA_TRANSPORTE' ? 'Frequência do Plano (Baseado no SPA)' : 'Frequência SPA'}
                                        </label>
                                        <select
                                            value={recurrenceFrequency}
                                            onChange={(e) => setRecurrenceFrequency(e.target.value)}
                                            className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 focus:ring-2 focus:ring-purple-500/20"
                                        >
                                            <option value="MENSAL">Mensal (5%)</option>
                                            <option value="QUINZENAL">Quinzenal (7%)</option>
                                            <option value="SEMANAL">Semanal (10%)</option>
                                        </select>
                                    </div>
                                )}


                            </div>
                        )}
                    </div>
                </div>

                {/* Datas e Horários */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 md:col-span-3 lg:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Preferência do Cliente */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle size={10} className="text-orange-400" />
                            Preferência Cliente
                        </p>
                        <input
                            type="datetime-local"
                            value={desiredAt}
                            onChange={(e) => setDesiredAt(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-xs font-bold text-secondary dark:text-white focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Sugestão SPA */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                            <CalendarDays size={10} />
                            Sugestão SPA (Operador)
                        </p>
                        <input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="w-full bg-primary/5 dark:bg-primary/20 border-none rounded-xl text-xs font-bold text-primary dark:text-primary-light focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Sugestão Transporte */}
                    {(quote?.type === 'SPA_TRANSPORTE' || quote?.type === 'TRANSPORTE') && (
                        <>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                    <Calculator size={10} />
                                    Horário LEVA (Busca)
                                </p>
                                <input
                                    type="datetime-local"
                                    value={transportLevaAt}
                                    onChange={(e) => setTransportLevaAt(e.target.value)}
                                    className="w-full bg-orange-50 dark:bg-orange-900/20 border-none rounded-xl text-xs font-bold text-orange-700 dark:text-orange-300 focus:ring-2 focus:ring-orange-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest flex items-center gap-2">
                                    <Calculator size={10} />
                                    Horário TRAZ (Entrega)
                                </p>
                                <input
                                    type="datetime-local"
                                    value={transportTrazAt}
                                    onChange={(e) => setTransportTrazAt(e.target.value)}
                                    className="w-full bg-teal-50 dark:bg-teal-900/20 border-none rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 focus:ring-2 focus:ring-teal-200"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuotePricingVariables;
