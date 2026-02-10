import { Sparkles, Car, PackagePlus } from 'lucide-react';

interface QuoteTypeSelectorProps {
    onSelect: (type: 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE') => void;
    onCancel: () => void;
}

export function QuoteTypeSelector({ onSelect, onCancel }: QuoteTypeSelectorProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Novo Orçamento</h2>
                        <p className="text-zinc-500 dark:text-zinc-400">Selecione o tipo de serviço desejado</p>
                    </div>
                    <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-700">
                        ✕
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* SPA Only */}
                    <button
                        onClick={() => onSelect('SPA')}
                        className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-center"
                    >
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                            <Sparkles size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Estética (SPA)</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Banhos, tosas e tratamentos estéticos. O cliente traz o pet ou não necessita de transporte da 7Pet.
                        </p>
                    </button>

                    {/* SPA + Transport */}
                    <button
                        onClick={() => onSelect('SPA_TRANSPORTE')}
                        className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-violet-100 dark:border-zinc-800 hover:border-violet-500 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all text-center"
                    >
                        <div className="absolute top-4 right-4 bg-violet-100 text-violet-700 text-xs font-bold px-2 py-1 rounded-full">
                            MAIS COMUM
                        </div>
                        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                            <PackagePlus size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">SPA + Transporte</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Serviço completo. Inclui busca (Leva) e/ou entrega (Traz) do pet junto com os serviços de estética.
                        </p>
                    </button>

                    {/* Transport Only */}
                    <button
                        onClick={() => onSelect('TRANSPORTE')}
                        className="group relative flex flex-col items-center p-8 rounded-xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all text-center"
                    >
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                            <Car size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">Apenas Transporte</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Serviço exclusivo de Táxi Dog. Apenas deslocamento sem serviços de estética vinculados.
                        </p>
                    </button>
                </div>

                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 text-center">
                    <p className="text-xs text-zinc-400">
                        O formulário será adaptado automaticamente com base na sua escolha.
                    </p>
                </div>
            </div>
        </div>
    );
}
