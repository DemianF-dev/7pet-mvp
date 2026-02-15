import { Scissors, Truck, Sparkles, ChevronRight } from 'lucide-react';

type QuoteType = 'SPA' | 'TRANSPORTE' | 'SPA_TRANSPORTE';

interface QuoteTypeSelectionProps {
    onSelect: (type: QuoteType) => void;
}

const QuoteTypeSelection = ({ onSelect }: QuoteTypeSelectionProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button
                type="button"
                onClick={() => onSelect('SPA')}
                className="group relative bg-white p-10 rounded-[48px] shadow-sm hover:shadow-2xl hover:shadow-primary/10 border border-gray-100 transition-all flex flex-col items-center text-center overflow-hidden active:scale-95"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Scissors size={40} />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">Serviços de SPA</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">Banho, tosa e cuidados especiais.</p>
                <div className="mt-8 p-2 bg-gray-50 rounded-full text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                    <ChevronRight size={24} />
                </div>
            </button>

            <button
                type="button"
                onClick={() => onSelect('TRANSPORTE')}
                className="group relative bg-white p-10 rounded-[48px] shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 border border-gray-100 transition-all flex flex-col items-center text-center overflow-hidden active:scale-95"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-orange-500/20 group-hover:bg-orange-500 transition-colors" />
                <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                    <Truck size={40} />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">Apenas Transporte</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">Logística Leva e Traz profissional.</p>
                <div className="mt-8 p-2 bg-gray-50 rounded-full text-gray-400 group-hover:text-orange-500 group-hover:bg-orange-50 transition-all">
                    <ChevronRight size={24} />
                </div>
            </button>

            <button
                type="button"
                onClick={() => onSelect('SPA_TRANSPORTE')}
                className="group relative bg-gradient-to-br from-secondary to-secondary/90 p-10 rounded-[48px] shadow-xl hover:shadow-secondary/20 border border-gray-800 transition-all flex flex-col items-center text-center overflow-hidden active:scale-95"
            >
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">SPA + Transporte</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed">O combo completo com praticidade.</p>
                <div className="mt-8 p-2 bg-white/5 rounded-full text-white/40 group-hover:text-primary group-hover:bg-white transition-all">
                    <ChevronRight size={24} />
                </div>
            </button>
        </div>
    );
};

export default QuoteTypeSelection;
