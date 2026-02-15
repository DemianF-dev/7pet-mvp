import { Truck, MapPin, Minus, Plus, RefreshCcw } from 'lucide-react';

interface TransportDetails {
    origin: string;
    destination: string;
    returnAddress: string;
    stopAddress?: string;
    transportType: string;
    period: string;
    petQuantity: number;
    isReturnSame: boolean;
}

interface TransportSectionProps {
    transportDetails: TransportDetails;
    setTransportDetails: React.Dispatch<React.SetStateAction<TransportDetails>>;
    onCalculate?: () => void;
    isCalculating?: boolean;
    transportInfo?: { distanceKm?: number; durationMin?: number; price?: number; distanceText?: string; durationText?: string; distanceValue?: number; durationValue?: number; estimatedPrice?: number } | null;
    quoteType: string | null;
    shopAddress: string;
}

const TransportSection = ({
    transportDetails,
    setTransportDetails,
    quoteType,
    shopAddress
}: TransportSectionProps) => {
    void shopAddress; // Silence unused warning - may be used for default destination
    return (
        <div className="mb-12 animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-secondary mb-8 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500"><Truck size={20} /></div>
                Logística de Transporte
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Endereço de Origem (Busca)</label>
                        <div className="relative group">
                            <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                            <input
                                type="text"
                                value={transportDetails.origin}
                                onChange={(e) => setTransportDetails(prev => ({ ...prev, origin: e.target.value }))}
                                placeholder="Rua, Número, Bairro, Cidade..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500/20 rounded-2xl pl-16 pr-8 py-5 shadow-sm text-secondary font-bold transition-all"
                            />
                        </div>
                    </div>

                    {quoteType === 'TRANSPORTE' ? (
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Endereço de Destino (Leva)</label>
                            <div className="relative group">
                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
                                <input
                                    type="text"
                                    value={transportDetails.destination}
                                    onChange={(e) => setTransportDetails(prev => ({ ...prev, destination: e.target.value }))}
                                    placeholder="Para onde levamos o pet?"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500/20 rounded-2xl pl-16 pr-8 py-5 shadow-sm text-secondary font-bold transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-white rounded-3xl border border-orange-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shadow-sm"><MapPin size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destino do SPA</p>
                                <p className="text-[11px] font-bold text-secondary">{shopAddress}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Tipo de Transporte */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Tipo de Transporte</label>
                        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                            {[
                                { value: 'LEVA_E_TRAZ', label: 'Leva e Traz' },
                                { value: 'SO_LEVA', label: 'Só Leva' },
                                { value: 'SO_TRAZ', label: 'Só Traz' }
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTransportDetails(prev => ({ ...prev, transportType: option.value }))}
                                    className={`py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all ${(transportDetails.transportType || 'LEVA_E_TRAZ') === option.value
                                            ? 'bg-orange-500 text-white shadow-lg'
                                            : 'text-gray-400 hover:text-secondary'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-orange-50 rounded-[32px] border border-orange-100/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">Retorno no mesmo endereço?</span>
                            <button
                                type="button"
                                onClick={() => setTransportDetails(prev => ({ ...prev, isReturnSame: !prev.isReturnSame, returnAddress: prev.isReturnSame ? '' : prev.origin }))}
                                className={`w-12 h-7 rounded-full transition-all relative ${transportDetails.isReturnSame ? 'bg-orange-500' : 'bg-gray-200'}`}
                                disabled={(transportDetails.transportType || 'LEVA_E_TRAZ') !== 'LEVA_E_TRAZ'}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${transportDetails.isReturnSame ? 'left-6 shadow-md' : 'left-1'}`} />
                            </button>
                        </div>
                        {!transportDetails.isReturnSame && (transportDetails.transportType || 'LEVA_E_TRAZ') === 'LEVA_E_TRAZ' && (
                            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] mb-2 block ml-1">Outro endereço para retorno</label>
                                <input
                                    type="text"
                                    value={transportDetails.returnAddress}
                                    onChange={(e) => setTransportDetails(prev => ({ ...prev, returnAddress: e.target.value }))}
                                    placeholder="Endereço de destino final..."
                                    className="w-full bg-white border-2 border-orange-100 rounded-xl px-5 py-4 text-sm shadow-sm font-bold text-secondary"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Período Preferencial</label>
                        <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                            {['MANHA', 'TARDE', 'NOITE'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setTransportDetails(prev => ({ ...prev, period: p }))}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${transportDetails.period === p ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-secondary'}`}
                                >
                                    {p === 'MANHA' ? 'Manhã' : p === 'TARDE' ? 'Tarde' : 'Noite'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-secondary font-bold text-sm uppercase tracking-tight">Qtd. de Pets</span>
                        </div>
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                            <button
                                type="button"
                                onClick={() => setTransportDetails(prev => ({ ...prev, petQuantity: Math.max(1, prev.petQuantity - 1) }))}
                                className="p-2 text-gray-400 hover:text-secondary transition-colors"
                            >
                                <Minus size={16} />
                            </button>
                            <span className="font-bold text-secondary min-w-[20px] text-center">{transportDetails.petQuantity}</span>
                            <button
                                type="button"
                                onClick={() => setTransportDetails(prev => ({ ...prev, petQuantity: prev.petQuantity + 1 }))}
                                className="p-2 text-gray-400 hover:text-secondary transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hint for the client */}
            <div className="mt-6">
                <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 px-6 py-4 rounded-2xl text-[10px] font-bold text-blue-600 shadow-sm">
                    <RefreshCcw size={16} className="text-blue-500" />
                    Valores de transporte serão calculados e validados pelo nosso operacional em seu orçamento final.
                </div>
            </div>
        </div>
    );
};

export default TransportSection;
