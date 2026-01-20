import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator,
    MapPin,
    DollarSign,
    CheckCircle2,
    XCircle,
    Copy,
    Download,
    History,
    Trash2,
    ChevronDown,
    ChevronUp,
    AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as devTransportSim from '../../../services/devTransportSim';

const TransportSimulator: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<devTransportSim.TransportSimResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [history, setHistory] = useState(devTransportSim.getHistory());

    const [formData, setFormData] = useState({
        plan: 'TL1' as 'TL1' | 'TL2',
        mode: 'LEVA_TRAZ' as 'LEVA' | 'TRAZ' | 'LEVA_TRAZ',
        destinationIsThePet: true,
        address1: '',
        address2: '',
        stopAddress: '',
        addStop: false,
        discountPercent: 0,
        kmRateOverride: undefined as number | undefined,
        minRateOverride: undefined as number | undefined
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSimulate = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const payload: devTransportSim.SimulateTransportRequest = {
                plan: formData.plan,
                mode: formData.mode,
                destinationIsThePet: formData.destinationIsThePet,
                address1: formData.address1,
                address2: formData.address2 || undefined,
                stopAddress: formData.addStop ? formData.stopAddress || undefined : undefined,
                discountPercent: formData.discountPercent || 0,
                kmRateOverride: formData.kmRateOverride,
                minRateOverride: formData.minRateOverride
            };

            const data = await devTransportSim.simulateTransport(payload);
            setResult(data);
            toast.success('Simulação concluída!');
        } catch (err: any) {
            console.error('Simulation error:', err);
            const errorMsg = err.response?.data?.messageUser || err.response?.data?.error || err.message || 'Erro desconhecido';
            const devMsg = err.response?.data?.messageDev;
            setError(devMsg ? `${errorMsg} (Dev: ${devMsg})` : errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setFormData({
            plan: 'TL1',
            mode: 'LEVA_TRAZ',
            destinationIsThePet: true,
            address1: '',
            address2: '',
            stopAddress: '',
            addStop: false,
            discountPercent: 0,
            kmRateOverride: undefined,
            minRateOverride: undefined
        });
        setResult(null);
        setError(null);
    };

    const handleCopyMemory = async () => {
        if (!result) return;
        const memory = devTransportSim.generateCalculationMemory(result);
        const success = await devTransportSim.copyToClipboard(memory);
        if (success) {
            toast.success('Memória copiada!');
        } else {
            toast.error('Erro ao copiar');
        }
    };

    const handleCopyJSON = async () => {
        if (!result) return;
        const success = await devTransportSim.copyToClipboard(JSON.stringify(result, null, 2));
        if (success) {
            toast.success('JSON copiado!');
        } else {
            toast.error('Erro ao copiar');
        }
    };

    const handleSaveToHistory = () => {
        if (!result) return;
        devTransportSim.saveToHistory(result);
        setHistory(devTransportSim.getHistory());
        toast.success('Salvo no histórico!');
    };

    const handleExportJSON = () => {
        if (!result) return;
        const filename = `transport-sim-${result.checksum}-${Date.now()}.json`;
        devTransportSim.downloadJSON(result, filename);
        toast.success('JSON exportado!');
    };

    const handleLoadFromHistory = (entry: devTransportSim.HistoryEntry) => {
        const { scenario } = entry.result;
        setFormData({
            plan: scenario.plan,
            mode: scenario.mode,
            destinationIsThePet: scenario.destinationIsThePet,
            address1: scenario.address1,
            address2: scenario.address2 || '',
            stopAddress: scenario.stopAddress || '',
            addStop: !!scenario.stopAddress,
            discountPercent: scenario.discountPercent,
            kmRateOverride: scenario.kmRate !== 2.0 ? scenario.kmRate : undefined,
            minRateOverride: scenario.minRate !== 1.5 ? scenario.minRate : undefined
        });
        setResult(entry.result);
        setShowHistory(false);
        toast.success('Teste carregado!');
    };

    const handleClearHistory = () => {
        if (confirm('Limpar todo o histórico?')) {
            devTransportSim.clearHistory();
            setHistory([]);
            toast.success('Histórico limpo!');
        }
    };

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 backdrop-blur-xl rounded-[40px] border border-purple-500/20 overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-purple-500/10 bg-purple-950/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                                <Calculator size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">
                                    Simulador de Transporte
                                </h3>
                                <p className="text-purple-300/60 text-sm font-mono">
                                    Sandbox • MASTER Only • Zero Banco
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-xl text-sm font-bold transition-all border border-purple-500/20 flex items-center gap-2"
                        >
                            <History size={16} />
                            Histórico ({history.length})
                        </button>
                    </div>
                </div>

                <div className="p-8 md:p-10 space-y-8">
                    {/* Configuration Card */}
                    <div className="bg-slate-800/30 rounded-[32px] p-8 border border-white/5">
                        <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                            <MapPin size={20} className="text-purple-400" />
                            Configuração
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Plan */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Plano
                                </label>
                                <select
                                    name="plan"
                                    value={formData.plan}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                >
                                    <option value="TL1">TL1</option>
                                    <option value="TL2">TL2</option>
                                </select>
                            </div>

                            {/* Mode */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Modo
                                </label>
                                <select
                                    name="mode"
                                    value={formData.mode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                >
                                    <option value="LEVA">Só Leva</option>
                                    <option value="TRAZ">Só Traz</option>
                                    <option value="LEVA_TRAZ">Leva & Traz</option>
                                </select>
                            </div>

                            {/* Destination Toggle */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer bg-slate-900/30 p-4 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all">
                                    <input
                                        type="checkbox"
                                        name="destinationIsThePet"
                                        checked={formData.destinationIsThePet}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/20 text-purple-500 focus:ring-purple-500/50"
                                    />
                                    <span className="text-white font-medium">Destino é The Pet</span>
                                </label>
                            </div>

                            {/* Address 1 */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Endereço 1 (Cliente) *
                                </label>
                                <input
                                    type="text"
                                    name="address1"
                                    value={formData.address1}
                                    onChange={handleChange}
                                    placeholder="Ex: Av Paulista 1000, São Paulo"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder-slate-500"
                                />
                            </div>

                            {/* Address 2 (TL2) */}
                            {formData.plan === 'TL2' && !formData.destinationIsThePet && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Endereço 2 (Destino) *
                                    </label>
                                    <input
                                        type="text"
                                        name="address2"
                                        value={formData.address2}
                                        onChange={handleChange}
                                        placeholder="Ex: Rua Augusta 500, São Paulo"
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder-slate-500"
                                    />
                                </div>
                            )}

                            {/* Add Stop Toggle */}
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer bg-slate-900/30 p-4 rounded-xl border border-white/5 hover:border-purple-500/20 transition-all">
                                    <input
                                        type="checkbox"
                                        name="addStop"
                                        checked={formData.addStop}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-white/20 text-purple-500 focus:ring-purple-500/50"
                                    />
                                    <span className="text-white font-medium">Adicionar Parada (Leva2/Traz2)</span>
                                </label>
                            </div>

                            {/* Stop Address */}
                            {formData.addStop && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Endereço da Parada
                                    </label>
                                    <input
                                        type="text"
                                        name="stopAddress"
                                        value={formData.stopAddress}
                                        onChange={handleChange}
                                        placeholder="Ex: Rua da Consolação 500, São Paulo"
                                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder-slate-500"
                                    />
                                </div>
                            )}

                            {/* Discount */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                    Desconto %
                                </label>
                                <input
                                    type="number"
                                    name="discountPercent"
                                    value={formData.discountPercent}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                />
                            </div>

                            {/* Advanced Section */}
                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors font-medium text-sm"
                                >
                                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    Avançado (Overrides)
                                </button>

                                <AnimatePresence>
                                    {showAdvanced && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="grid grid-cols-2 gap-4 mt-4 overflow-hidden"
                                        >
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    KM Rate Override
                                                </label>
                                                <input
                                                    type="number"
                                                    name="kmRateOverride"
                                                    value={formData.kmRateOverride || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        kmRateOverride: e.target.value ? parseFloat(e.target.value) : undefined
                                                    })}
                                                    step="0.1"
                                                    placeholder="2.0"
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder-slate-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                                    MIN Rate Override
                                                </label>
                                                <input
                                                    type="number"
                                                    name="minRateOverride"
                                                    value={formData.minRateOverride || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        minRateOverride: e.target.value ? parseFloat(e.target.value) : undefined
                                                    })}
                                                    step="0.1"
                                                    placeholder="1.5"
                                                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white font-medium focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all placeholder-slate-600"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mt-8">
                            <button
                                type="button"
                                onClick={handleSimulate}
                                disabled={loading || !formData.address1}
                                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Calculator size={20} />
                                        Simular
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                            >
                                Limpar
                            </button>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 flex items-start gap-4"
                        >
                            <XCircle className="text-red-400 shrink-0" size={24} />
                            <div className="flex-1">
                                <h5 className="text-red-400 font-bold mb-1">Erro na Simulação</h5>
                                <p className="text-red-200/80 text-sm font-mono">{error}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Result Display - Part 2 continues in next file creation */}
                    {result && (
                        <ResultDisplay
                            result={result}
                            onCopyMemory={handleCopyMemory}
                            onCopyJSON={handleCopyJSON}
                            onSaveToHistory={handleSaveToHistory}
                            onExportJSON={handleExportJSON}
                            showDetails={showDetails}
                            onToggleDetails={() => setShowDetails(!showDetails)}
                        />
                    )}
                </div>
            </motion.div>

            {/* History Panel */}
            <AnimatePresence>
                {showHistory && (
                    <HistoryPanel
                        history={history}
                        onLoad={handleLoadFromHistory}
                        onClear={handleClearHistory}
                        onClose={() => setShowHistory(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Result Display Component
interface ResultDisplayProps {
    result: devTransportSim.TransportSimResult;
    onCopyMemory: () => void;
    onCopyJSON: () => void;
    onSaveToHistory: () => void;
    onExportJSON: () => void;
    showDetails: boolean;
    onToggleDetails: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
    result,
    onCopyMemory,
    onCopyJSON,
    onSaveToHistory,
    onExportJSON,
    showDetails,
    onToggleDetails
}) => {
    const memory = devTransportSim.generateCalculationMemory(result);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-900/10 border border-emerald-500/20 rounded-[32px] p-8 space-y-6"
        >
            {/* Badge Header */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="text-emerald-400" size={16} />
                    <span className="text-emerald-300 font-mono text-sm font-bold">
                        {result.checksum}
                    </span>
                </div>
                <div className="text-slate-400 font-mono text-xs">
                    {result.engineVersion}
                </div>
                <div className="text-slate-500 font-mono text-xs">
                    {new Date(result.timestamp).toLocaleString('pt-BR')}
                </div>
            </div>

            <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-400" />
                Memória de Cálculo
            </h4>

            {/* Memory Block */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5">
                <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                    {memory}
                </pre>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={onCopyMemory}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all text-sm font-bold"
                >
                    <Copy size={16} />
                    Copiar Texto
                </button>
                <button
                    onClick={onCopyJSON}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all text-sm font-bold"
                >
                    <Copy size={16} />
                    Copiar JSON
                </button>
                <button
                    onClick={onSaveToHistory}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl transition-all text-sm font-bold border border-purple-500/20"
                >
                    <History size={16} />
                    Salvar
                </button>
                <button
                    onClick={onExportJSON}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-xl transition-all text-sm font-bold border border-indigo-500/20"
                >
                    <Download size={16} />
                    Exportar
                </button>
            </div>

            {/* Details Toggle */}
            <button
                onClick={onToggleDetails}
                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-300 transition-colors font-medium text-sm py-2"
            >
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Detalhes por Pernada
            </button>

            {/* Detailed Breakdown */}
            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 space-y-4">
                            {result.legs.map((leg, idx) => (
                                <div key={idx} className="flex flex-col gap-2 pb-4 border-b border-white/5 last:border-0">
                                    <div className="font-bold text-white text-sm">{leg.kind}</div>
                                    <div className="text-xs text-slate-400 space-y-1">
                                        <div>Origem: {leg.originAddress}</div>
                                        <div>Destino: {leg.destinationAddress}</div>
                                        <div className="flex gap-4">
                                            <span>Dist: {leg.distanceKm.toFixed(1)} km</span>
                                            <span>Dur: {leg.durationMin} min</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <span>Cobra KM: {leg.chargeKm.toFixed(1)}</span>
                                            <span>Cobra MIN: {leg.chargeMin}</span>
                                        </div>
                                        <div className="text-emerald-400 font-bold">
                                            Subtotal: {devTransportSim.formatCurrency(leg.subtotal)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// History Panel Component
interface HistoryPanelProps {
    history: devTransportSim.HistoryEntry[];
    onLoad: (entry: devTransportSim.HistoryEntry) => void;
    onClear: () => void;
    onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onLoad, onClear, onClose }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-slate-900/30 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden"
        >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                    <History size={20} />
                    Histórico Local ({history.length}/20)
                </h4>
                <div className="flex gap-2">
                    <button
                        onClick={onClear}
                        disabled={history.length === 0}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl transition-all text-sm font-bold border border-red-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Trash2 size={14} />
                        Limpar
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl transition-all text-sm font-bold"
                    >
                        Fechar
                    </button>
                </div>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                {history.length === 0 ? (
                    <div className="text-center py-12">
                        <AlertCircle className="mx-auto text-slate-600 mb-3" size={32} />
                        <p className="text-slate-500 font-medium">Nenhum teste salvo</p>
                    </div>
                ) : (
                    history.map((entry) => (
                        <button
                            key={entry.id}
                            onClick={() => onLoad(entry)}
                            className="w-full p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all text-left group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-white font-bold text-sm">
                                            {entry.result.scenario.plan} • {entry.result.scenario.mode}
                                        </span>
                                        <span className="text-slate-500 font-mono text-xs">
                                            {entry.result.checksum}
                                        </span>
                                    </div>
                                    <div className="text-slate-400 text-xs truncate">
                                        {entry.result.scenario.address1}
                                    </div>
                                    <div className="text-slate-500 text-xs mt-1">
                                        {new Date(entry.timestamp).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-bold text-sm shrink-0">
                                    {devTransportSim.formatCurrency(entry.result.totals.totalAfterDiscount)}
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default TransportSimulator;
