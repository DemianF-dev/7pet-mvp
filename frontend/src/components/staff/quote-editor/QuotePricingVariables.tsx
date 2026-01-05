import React from 'react';
import {
    Calculator,
    Dog,
    AlertCircle,
    CheckCircle2,
    CalendarDays
} from 'lucide-react';

interface QuotePricingVariablesProps {
    quote: any;
    desiredAt: string;
    setDesiredAt: (val: string) => void;
    scheduledAt: string;
    setScheduledAt: (val: string) => void;
    transportAt: string;
    setTransportAt: (val: string) => void;
}

const QuotePricingVariables: React.FC<QuotePricingVariablesProps> = ({
    quote,
    desiredAt,
    setDesiredAt,
    scheduledAt,
    setScheduledAt,
    transportAt,
    setTransportAt
}) => {
    return (
        <div>
            <div className="flex items-center gap-2 mb-4 text-secondary font-black text-sm uppercase tracking-widest">
                <Calculator size={16} className="text-primary" />
                Variáveis de Precificação
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Pet Básico */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pet</p>
                    <div className="flex items-center gap-2">
                        <Dog size={16} className="text-gray-400" />
                        <span className="font-black text-secondary">{quote.pet?.name || 'N/A'}</span>
                        <span className="text-xs text-gray-400">({quote.pet?.breed || 'SRD'} - {quote.pet?.age || 'Idade N/A'})</span>
                    </div>
                    {quote.pet?.observations && (
                        <p className="text-xs text-red-400 mt-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                            ⚠️ Obs: {quote.pet.observations}
                        </p>
                    )}
                </div>

                {/* Pelagem & Nós */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
                    <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 rounded-bl-2xl -mr-1 -mt-1 group-hover:bg-blue-100 transition-colors"></div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Pelagem</p>
                    <p className="font-bold text-secondary text-sm">{quote.hairLength || quote.pet?.coatType || 'Não inf.'}</p>
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
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">Peso/Porte</p>
                    <p className="font-bold text-secondary text-sm">{quote.pet?.weight ? `${quote.pet.weight} kg` : 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{quote.pet?.weight && quote.pet.weight < 10 ? 'Pequeno' : quote.pet?.weight && quote.pet.weight < 25 ? 'Médio' : 'Grande'}</p>
                </div>

                {/* Transporte */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Transporte</p>
                    {quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE' ? (
                        <>
                            <p className="font-bold text-secondary text-sm">Leva e Traz</p>
                            <p className="text-[10px] text-purple-500 font-black mt-1 uppercase">{quote.transportPeriod || 'Período N/A'}</p>
                        </>
                    ) : (
                        <p className="font-bold text-gray-400 text-sm">Próprio Meio</p>
                    )}
                </div>

                {/* Saúde/Vermes */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Saúde</p>
                    {quote.hasParasites || (quote.pet?.healthIssues && quote.pet.healthIssues.toLowerCase().includes('pulga')) ? (
                        <p className="font-bold text-red-500 text-sm flex items-center gap-1"><AlertCircle size={12} /> Parasitas</p>
                    ) : (
                        <p className="font-bold text-green-500 text-sm flex items-center gap-1"><CheckCircle2 size={12} /> Sem observações</p>
                    )}
                    <p className="text-[9px] text-gray-400 mt-1">Vacinas: Verif. Carteira</p>
                </div>

                {/* Temperamento */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-2">Temperamento</p>
                    <p className="font-bold text-secondary text-sm">{quote.pet?.temperament || 'Não inf.'}</p>
                </div>

                {/* Datas e Horários */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm col-span-2 md:col-span-3 lg:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            className="w-full bg-gray-50 border-none rounded-xl text-xs font-bold text-secondary focus:ring-2 focus:ring-primary/20"
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
                            className="w-full bg-primary/5 border-none rounded-xl text-xs font-bold text-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Sugestão Transporte */}
                    {(quote.type === 'SPA_TRANSPORTE' || quote.type === 'TRANSPORTE') && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                                <Calculator size={10} />
                                Sugestão Transp. (Operador)
                            </p>
                            <input
                                type="datetime-local"
                                value={transportAt}
                                onChange={(e) => setTransportAt(e.target.value)}
                                className="w-full bg-purple-50 border-none rounded-xl text-xs font-bold text-purple-700 focus:ring-2 focus:ring-purple-200"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuotePricingVariables;
