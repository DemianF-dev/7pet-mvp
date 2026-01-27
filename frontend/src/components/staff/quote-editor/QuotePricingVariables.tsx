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
    onPetChange
}) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4 text-secondary dark:text-white font-black text-sm uppercase tracking-widest">
                <Calculator size={16} className="text-primary" />
                Variáveis de Precificação
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Pet Básico */}
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 col-span-2">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Pet</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Dog size={16} className="text-gray-400" />
                            {customerPets.length > 0 ? (
                                <select
                                    value={petId || ''}
                                    onChange={(e) => onPetChange(e.target.value)}
                                    className="bg-transparent border-none font-black text-secondary dark:text-white focus:ring-0 p-0 text-sm cursor-pointer hover:text-primary transition-colors dark:bg-gray-700"
                                >
                                    <option value="">Selecionar Pet</option>
                                    {customerPets.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.breed || 'SRD'})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="font-black text-secondary dark:text-white">{quote.pet?.name || 'N/A'}</span>
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
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Pelagem</p>
                    <p className="font-bold text-secondary dark:text-white text-sm">{quote.hairLength || quote.pet?.coatType || 'Não inf.'}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {quote.hasKnots ? (
                            <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">Com Nós</span>
                        ) : (
                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-600 text-[9px] font-black rounded uppercase">Sem Nós</span>
                        )}
                        {quote.knotRegions && <span className="text-[9px] text-gray-400 block w-full truncate" title={quote.knotRegions}>{quote.knotRegions}</span>}
                    </div>
                </div>

                {/* Peso & Porte */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Peso/Porte</p>
                    <p className="font-bold text-secondary dark:text-white text-sm">{quote.pet?.weight ? `${quote.pet.weight} kg` : 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{quote.pet?.weight && quote.pet.weight < 10 ? 'Pequeno' : quote.pet?.weight && quote.pet.weight < 25 ? 'Médio' : 'Grande'}</p>
                </div>

                {/* Transporte */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Transporte</p>
                    {quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE' ? (
                        <>
                            <p className="font-bold text-secondary dark:text-white text-sm">Leva e Traz</p>
                            <p className="text-[10px] text-purple-500 font-black mt-1 uppercase">{quote.transportPeriod || 'Período N/A'}</p>
                        </>
                    ) : (
                        <p className="font-bold text-gray-400 text-sm">Próprio Meio</p>
                    )}
                </div>

                {/* Saúde/Vermes */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Saúde</p>
                    {quote.hasParasites || (quote.pet?.healthIssues && quote.pet.healthIssues.toLowerCase().includes('pulga')) ? (
                        <p className="font-bold text-red-500 text-sm flex items-center gap-1"><AlertCircle size={12} /> Parasitas</p>
                    ) : (
                        <p className="font-bold text-green-500 text-sm flex items-center gap-1"><CheckCircle2 size={12} /> Sem observações</p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1">Vacinas: Verif. Carteira</p>
                </div>

                {/* Temperamento */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2">Temperamento</p>
                    <p className="font-bold text-secondary dark:text-white text-sm">{quote.pet?.temperament || 'Não inf.'}</p>
                </div>

                {/* Datas e Horários */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm col-span-2 md:col-span-3 lg:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Preferência do Cliente */}
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
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
                    {(quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE') && (
                        <>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
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
                                <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-2">
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
