import React from 'react';
import { Calculator, RefreshCcw, CheckCircle2 } from 'lucide-react';

interface QuoteTransportCalculatorProps {
    transportType: 'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF';
    setTransportType: (val: 'ROUND_TRIP' | 'PICK_UP' | 'DROP_OFF') => void;
    transportAddress: string;
    setTransportAddress: (val: string) => void;
    hasDifferentReturnAddress: boolean;
    setHasDifferentReturnAddress: (val: boolean) => void;
    transportDestinationAddress: string;
    setTransportDestinationAddress: (val: string) => void;
    onCalculate: () => void;
    isCalculating: boolean;
    calculation: any;
    onLegChange: (leg: string, field: string, value: string) => void;
    discount: number;
    setDiscount: (val: number) => void;
    onApply: () => void;
}

const QuoteTransportCalculator: React.FC<QuoteTransportCalculatorProps> = ({
    transportType,
    setTransportType,
    transportAddress,
    setTransportAddress,
    hasDifferentReturnAddress,
    setHasDifferentReturnAddress,
    transportDestinationAddress,
    setTransportDestinationAddress,
    onCalculate,
    isCalculating,
    calculation,
    onLegChange,
    discount,
    setDiscount,
    onApply
}) => {
    return (
        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-black text-secondary dark:text-white mb-4 flex items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400">
                    <Calculator size={20} />
                </div>
                Cálculo de Transporte (Leva e Traz)
            </h3>

            <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-[32px] border border-purple-100 dark:border-purple-900/30">
                <div className="flex flex-wrap gap-4 mb-6">
                    {(['ROUND_TRIP', 'PICK_UP', 'DROP_OFF'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setTransportType(type)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border-2 ${transportType === type ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400'}`}
                        >
                            {type === 'ROUND_TRIP' ? 'Leva e Traz (Completo)' : type === 'PICK_UP' ? 'Busca (Ida)' : 'Entrega (Volta)'}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2 px-2">Endereço de Busca (Origem)</label>
                            <input
                                type="text"
                                value={transportAddress}
                                onChange={(e) => setTransportAddress(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-200 transition-all text-purple-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                placeholder="Endereço onde o pet está..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-2">
                        <input
                            type="checkbox"
                            id="diffAddress"
                            checked={hasDifferentReturnAddress}
                            onChange={(e) => setHasDifferentReturnAddress(e.target.checked)}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800"
                        />
                        <label htmlFor="diffAddress" className="text-xs font-bold text-gray-500 dark:text-gray-400 cursor-pointer select-none">Entrega em endereço diferente?</label>
                    </div>

                    {hasDifferentReturnAddress && (
                        <div className="flex-1 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2 px-2">Endereço de Entrega (Destino)</label>
                            <input
                                type="text"
                                value={transportDestinationAddress}
                                onChange={(e) => setTransportDestinationAddress(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border-transparent rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-purple-200 transition-all text-purple-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                placeholder="Endereço para onde o pet vai..."
                            />
                        </div>
                    )}

                    <div className="flex justify-end mt-2">
                        <button
                            onClick={onCalculate}
                            disabled={isCalculating}
                            className="px-8 py-3 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                        >
                            {isCalculating ? <RefreshCcw size={18} className="animate-spin" /> : <Calculator size={18} />}
                            {isCalculating ? 'Calculando...' : 'Calcular Transporte'}
                        </button>
                    </div>
                </div>

                {calculation && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-purple-100 dark:border-purple-900/30 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-purple-50/50 dark:bg-purple-900/20 text-[10px] uppercase font-black text-purple-400 tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/30">Etapa</th>
                                        <th className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/30">Distância</th>
                                        <th className="px-6 py-4 border-b border-purple-100 dark:border-purple-900/30">Tempo</th>
                                        <th className="px-6 py-4 text-right border-b border-purple-100 dark:border-purple-900/30">Valor (R$)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {['largada', 'leva', 'traz', 'retorno'].map((leg: any) => {
                                        const legData = calculation.breakdown[leg];
                                        if (!legData) return null;

                                        const labels: any = {
                                            largada: { title: 'Largada', sub: 'Base → Origem' },
                                            leva: { title: 'Leva', sub: 'Origem → Base' },
                                            traz: { title: 'Traz', sub: 'Base → Destino' },
                                            retorno: { title: 'Retorno', sub: 'Destino → Base' }
                                        };

                                        return (
                                            <tr key={leg} className="group hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700 dark:text-white">{labels[leg].title}</span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500">{labels[leg].sub}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={legData.distance}
                                                        onChange={(e) => onLegChange(leg, 'distance', e.target.value)}
                                                        className="w-24 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-purple-200 transition-all text-center"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={legData.duration}
                                                        onChange={(e) => onLegChange(leg, 'duration', e.target.value)}
                                                        className="w-24 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-purple-200 transition-all text-center"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={legData.price}
                                                        onChange={(e) => onLegChange(leg, 'price', e.target.value)}
                                                        className="w-28 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-black text-purple-600 dark:text-purple-400 focus:ring-2 focus:ring-purple-200 transition-all"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>

                                <tfoot className="bg-purple-50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-900/30">
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest">Total Bruto</span>
                                                <span className="text-sm font-bold text-gray-400 dark:text-gray-500">R$ {calculation.total.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1">Desconto (%)</span>
                                                <input
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                    className="w-20 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-primary focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-colors"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-right font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest">Total com Desconto</td>
                                        <td className="px-6 py-4 text-right font-black text-xl text-purple-700 dark:text-purple-400">
                                            R$ {(calculation.total * (1 - discount / 100)).toFixed(2)}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={4} className="px-6 pb-6 text-right">
                                            <button
                                                onClick={onApply}
                                                className="px-6 py-2 bg-green-500 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ml-auto"
                                            >
                                                <CheckCircle2 size={16} />
                                                Aplicar ao Orçamento
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default QuoteTransportCalculator;
