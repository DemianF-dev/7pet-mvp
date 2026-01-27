import { Scissors, Trash2, Plus } from 'lucide-react';
import ServiceAutocomplete from '../ServiceAutocomplete';

interface Service {
    id: string;
    name: string;
    basePrice: number;
    category?: string;
}

interface SpaDetails {
    hasKnots: boolean;
    knotRegions: string[];
    hairLength: string;
    hasParasites: boolean;
    parasiteTypes: string;
    parasiteComments: string;
    wantsMedicatedBath: boolean;
}

interface SPAServicesSectionProps {
    selectedPetId: string;
    banhoServices: Service[];
    tosaServices: Service[];
    extraServices: Service[];
    selectedBanhoId: string;
    setSelectedBanhoId: (id: string) => void;
    selectedTosaId: string;
    setSelectedTosaId: (id: string) => void;
    items: { serviceId: string; quantity: number; price?: number; description?: string }[];
    onAddItem: () => void;
    onRemoveItem: (index: number) => void;
    onUpdateItem?: (index: number, field: string, value: string | number) => void;
    onServiceSelect: (index: number, id: string) => void;
    spaDetails: SpaDetails;
    setSpaDetails: React.Dispatch<React.SetStateAction<SpaDetails>>;
    toggleKnotRegion: (region: string) => void;
}

const KNOT_REGIONS = [
    'Orelhas',
    'Rostinho',
    'Pescoço',
    'Barriga',
    'Pata Frontal Esquerda',
    'Pata Frontal Direita',
    'Pata Traseira Esquerda',
    'Pata Traseira Direita',
    'Bumbum',
    'Rabo'
];

const SPAServicesSection = ({
    selectedPetId,
    banhoServices,
    tosaServices,
    extraServices,
    selectedBanhoId,
    setSelectedBanhoId,
    selectedTosaId,
    setSelectedTosaId,
    items,
    onAddItem,
    onRemoveItem,
    onServiceSelect,
    spaDetails,
    setSpaDetails,
    toggleKnotRegion
}: SPAServicesSectionProps) => {
    const totalFiltered = banhoServices.length + tosaServices.length + extraServices.length;

    return (
        <div className="mb-12 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-secondary flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Scissors size={20} /></div>
                    Seção SPA
                </h2>
                {selectedPetId && totalFiltered > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">
                            {totalFiltered} Serviços Disponíveis
                        </span>
                    </div>
                )}
            </div>

            {/* Service Selection */}
            <div className="space-y-4 mb-8">
                {/* Banhos Section */}
                <div className="flex flex-col gap-3 bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-1">Banho</label>
                        <p className="text-[11px] text-primary font-bold ml-1 mb-3 italic">Tradicional ou com hidratação ideal para o pelo do pet</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <ServiceAutocomplete
                                services={banhoServices}
                                value={selectedBanhoId}
                                onSelect={setSelectedBanhoId}
                                placeholder={selectedPetId ? "Selecione o tipo de banho..." : "Selecione um pet primeiro..."}
                            />
                        </div>
                        {selectedBanhoId && (
                            <button type="button" onClick={() => setSelectedBanhoId('')} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tosas Section */}
                <div className="flex flex-col gap-3 bg-gray-50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-1">Tosa</label>
                        <p className="text-[11px] text-primary font-bold ml-1 mb-3 italic">Higiênica, Geral (Máquina ou Tesoura), Bebê</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex-1">
                            <ServiceAutocomplete
                                services={tosaServices}
                                value={selectedTosaId}
                                onSelect={setSelectedTosaId}
                                placeholder={selectedPetId ? "Selecione o tipo de tosa..." : "Selecione um pet primeiro..."}
                            />
                        </div>
                        {selectedTosaId && (
                            <button type="button" onClick={() => setSelectedTosaId('')} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Serviços Extras Section */}
                <div className="flex flex-col gap-3 bg-gray-100/50 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-1">Serviços Extras</label>
                        <p className="text-[11px] text-primary font-bold ml-1 mb-3 italic">Hidratação, Escovação de Dentes, Corte de Unhas, etc.</p>
                    </div>
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-4 items-center mb-3">
                            <div className="flex-1">
                                <ServiceAutocomplete
                                    services={extraServices}
                                    value={item.serviceId}
                                    onSelect={(id) => onServiceSelect(index, id)}
                                    placeholder={selectedPetId ? "Selecione um serviço extra..." : "Selecione um pet primeiro..."}
                                />
                            </div>
                            {items.length > 0 && (
                                <button type="button" onClick={() => onRemoveItem(index)} className="p-3 text-red-400 hover:bg-red-50 rounded-2xl transition-all">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={onAddItem}
                        className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all text-xs uppercase tracking-widest mt-2"
                    >
                        <Plus size={16} /> Adicionar outro serviço
                    </button>
                </div>
            </div>

            {/* SPA Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 bg-white p-4 md:p-8 rounded-[24px] md:rounded-[40px] border border-gray-100 shadow-sm">
                <div className="space-y-6">
                    {/* Hair Length removed - now in Step 2 */}

                    <div className="flex items-center justify-between p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-[32px] border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-secondary font-black text-xs md:text-sm uppercase tracking-tight">Presença de Parasitas?</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pulgas ou Carrapatos</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSpaDetails(prev => ({ ...prev, hasParasites: !prev.hasParasites }))}
                            className={`w-14 h-8 rounded-full transition-all relative ${spaDetails.hasParasites ? 'bg-red-500' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${spaDetails.hasParasites ? 'left-7 shadow-lg' : 'left-1'}`} />
                        </button>
                    </div>

                    {spaDetails.hasParasites && (
                        <div className="p-4 md:p-6 bg-red-50/50 rounded-2xl md:rounded-[32px] border border-red-100 animate-in zoom-in-95 duration-300 space-y-4">
                            <label className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] block ml-1">Qual tipo de parasita?</label>
                            <div className="flex flex-wrap gap-3">
                                {['PULGA', 'CARRAPATO', 'AMBOS'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setSpaDetails(prev => ({ ...prev, parasiteTypes: type }))}
                                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${spaDetails.parasiteTypes === type ? 'bg-red-500 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:border-red-300'}`}
                                    >
                                        {type === 'AMBOS' ? 'Ambos' : type.charAt(0) + type.slice(1).toLowerCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Comentários (opcional)</label>
                                <textarea
                                    value={spaDetails.parasiteComments || ''}
                                    onChange={(e) => setSpaDetails(prev => ({ ...prev, parasiteComments: e.target.value }))}
                                    placeholder="Ex: Pulgas no pescoço, carrapatos nas patas..."
                                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all text-sm resize-none"
                                    rows={3}
                                />
                            </div>

                            <div className="p-4 bg-white rounded-2xl border border-red-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-secondary font-black text-sm">💊 Banho Medicamentoso Antipulgas?</span>
                                        <span className="text-[10px] font-bold text-gray-400">Aplicação de antipulgas após o banho</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSpaDetails(prev => ({ ...prev, wantsMedicatedBath: !prev.wantsMedicatedBath }))}
                                        className={`w-14 h-8 rounded-full transition-all relative ${spaDetails.wantsMedicatedBath ? 'bg-green-500' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${spaDetails.wantsMedicatedBath ? 'left-7 shadow-lg' : 'left-1'}`} />
                                    </button>
                                </div>
                                {spaDetails.wantsMedicatedBath && (
                                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Custo Estimado:</p>
                                        <p className="text-lg font-black text-green-600">
                                            R$ 45,00
                                            <span className="text-[10px] text-gray-400 ml-2 font-bold">será adicionado ao orçamento</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 md:p-6 bg-gray-50 rounded-2xl md:rounded-[32px] border border-gray-100">
                        <div className="flex flex-col">
                            <span className="text-secondary font-black text-xs md:text-sm uppercase tracking-tight">Possui Nós no Pelo?</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Para desembaraço</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSpaDetails(prev => ({ ...prev, hasKnots: !prev.hasKnots }))}
                            className={`w-14 h-8 rounded-full transition-all relative ${spaDetails.hasKnots ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${spaDetails.hasKnots ? 'left-7 shadow-lg' : 'left-1'}`} />
                        </button>
                    </div>

                    {spaDetails.hasKnots && (
                        <div className="p-4 md:p-6 bg-primary/5 rounded-2xl md:rounded-[32px] border border-primary/10 animate-in zoom-in-95 duration-300">
                            <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 block ml-1 text-center">Onde estão os nós?</label>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {KNOT_REGIONS.map(region => (
                                    <button
                                        key={region}
                                        type="button"
                                        onClick={() => toggleKnotRegion(region)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${spaDetails.knotRegions.includes(region) ? 'bg-primary text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:border-primary/30'}`}
                                    >
                                        {region}
                                    </button>
                                ))}
                            </div>
                            {spaDetails.knotRegions.length > 0 && (
                                <div className="mt-4 p-4 bg-white rounded-2xl border border-primary/20">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Custo Estimado de Desembolo:</p>
                                    {(() => {
                                        const PRICES: Record<string, number> = {
                                            'orelhas': 7.50,
                                            'rostinho': 15.00,
                                            'pescoço': 15.00,
                                            'barriga': 12.50,
                                            'pata frontal esquerda': 7.50,
                                            'pata frontal direita': 7.50,
                                            'pata traseira esquerda': 7.50,
                                            'pata traseira direita': 7.50,
                                            'bumbum': 12.50,
                                            'rabo': 10.00
                                        };
                                        const total = spaDetails.knotRegions.reduce((acc: number, region: string) => {
                                            const price = PRICES[region.toLowerCase()] || 0;
                                            return acc + price;
                                        }, 0);
                                        return (
                                            <p className="text-lg font-black text-primary">
                                                R$ {total.toFixed(2)}
                                                <span className="text-[10px] text-gray-400 ml-2 font-bold">será adicionado ao orçamento</span>
                                            </p>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SPAServicesSection;
