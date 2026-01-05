import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Calculator, DollarSign, Clock, Gauge } from 'lucide-react';
import api from '../../services/api';
import StaffSidebar from '../../components/StaffSidebar';
import LoadingButton from '../../components/LoadingButton';
import Breadcrumbs from '../../components/staff/Breadcrumbs';
import BackButton from '../../components/BackButton';

export default function TransportConfig() {
    const [settings, setSettings] = useState<{ [key: string]: number | string }>({
        // Preços por KM
        kmPriceLargada: 2.0,
        kmPriceLeva: 2.0,
        kmPriceTraz: 2.0,
        kmPriceRetorno: 2.0,
        // Preços por Minuto
        minPriceLargada: 1.5,
        minPriceLeva: 1.5,
        minPriceTraz: 1.5,
        minPriceRetorno: 1.5,
        // Tempos de manuseio
        handlingTimeLargada: 0,
        handlingTimeLeva: 0,
        handlingTimeTraz: 0,
        handlingTimeRetorno: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/transport-settings');
            // We keep values as they come (numbers) or defaults if undefined. 
            // The inputs will handle them. 
            setSettings({
                kmPriceLargada: res.data.kmPriceLargada ?? 2.0,
                kmPriceLeva: res.data.kmPriceLeva ?? 2.0,
                kmPriceTraz: res.data.kmPriceTraz ?? 2.0,
                kmPriceRetorno: res.data.kmPriceRetorno ?? 2.0,
                minPriceLargada: res.data.minPriceLargada ?? 1.5,
                minPriceLeva: res.data.minPriceLeva ?? 1.5,
                minPriceTraz: res.data.minPriceTraz ?? 1.5,
                minPriceRetorno: res.data.minPriceRetorno ?? 1.5,
                handlingTimeLargada: res.data.handlingTimeLargada ?? 0,
                handlingTimeLeva: res.data.handlingTimeLeva ?? 0,
                handlingTimeTraz: res.data.handlingTimeTraz ?? 0,
                handlingTimeRetorno: res.data.handlingTimeRetorno ?? 0
            });
        } catch (err) {
            console.error('Erro ao carregar configurações:', err);
            setError('Falha ao carregar configurações.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Ensure we send numbers
            const payload = Object.fromEntries(
                Object.entries(settings).map(([key, val]) => [key, val === '' ? 0 : Number(val)])
            );

            await api.put('/transport-settings', payload);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error('Erro ao salvar:', err);
            setError('Erro ao salvar as configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        // Update state directly with the string value to allow decimals (e.g. "2.") to exist while typing
        setSettings(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (isLoading) return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <StaffSidebar />
            <main className="flex-1 md:ml-64 p-6 md:p-10">
                <header className="mb-10">
                    <Breadcrumbs />
                    <BackButton className="mb-4 ml-[-1rem]" />
                    <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4">
                        <div className="h-[2px] w-6 bg-primary"></div>
                        CONFIGURAÇÕES DO SISTEMA
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-secondary flex items-center gap-4">
                        <div className="p-4 bg-indigo-100 rounded-[24px] text-indigo-600">
                            <Calculator size={40} />
                        </div>
                        Configuração de Orçamentos
                    </h1>
                    <p className="text-gray-500 mt-3 text-lg">Defina os valores utilizados para cálculo automático de transportes baseado em dados reais do Google Maps.</p>
                </header>

                <form onSubmit={handleSubmit} className="max-w-6xl space-y-8">
                    {/* KM Pricing Section */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-black text-secondary mb-3 flex items-center gap-3">
                            <Gauge className="text-indigo-500" size={24} />
                            Valores por Quilômetro
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Valores multiplicados pela distância REAL obtida do Google Maps. Não há taxas fixas - tudo é calculado por KM rodado.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Largada</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.kmPriceLargada}
                                        onChange={(e) => handleChange('kmPriceLargada', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">Casa → 7Pet</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Leva</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.kmPriceLeva}
                                        onChange={(e) => handleChange('kmPriceLeva', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">7Pet → Destino</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Traz</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.kmPriceTraz}
                                        onChange={(e) => handleChange('kmPriceTraz', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">Destino → 7Pet</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Retorno</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.kmPriceRetorno}
                                        onChange={(e) => handleChange('kmPriceRetorno', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">7Pet → Casa</p>
                            </div>
                        </div>
                    </div>

                    {/* Minute Pricing Section */}
                    <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h2 className="text-xl font-black text-secondary mb-3 flex items-center gap-3">
                            <Clock className="text-green-500" size={24} />
                            Valores por Minuto
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Valores multiplicados pelo tempo REAL da viagem obtido do Google Maps. Também não há taxas fixas.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Min. Largada</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.minPriceLargada}
                                        onChange={(e) => handleChange('minPriceLargada', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">Casa → 7Pet</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Min. Leva/Traz</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.minPriceLeva}
                                        onChange={(e) => {
                                            handleChange('minPriceLeva', e.target.value);
                                            handleChange('minPriceTraz', e.target.value); // Sync both
                                        }}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">Serviço completo</p>
                            </div>

                            <div className="space-y-2 opacity-50">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Min. Traz (Auto)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.minPriceTraz}
                                        disabled
                                        className="w-full pl-12 pr-4 py-4 bg-gray-100 border-2 border-transparent rounded-2xl font-bold text-xl text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">Igual ao Leva</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Min. Retorno</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={settings.minPriceRetorno}
                                        onChange={(e) => handleChange('minPriceRetorno', e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-green-500/30 focus:bg-white rounded-2xl font-bold text-xl text-secondary transition-all"
                                    />
                                </div>
                                <p className="text-[9px] text-gray-400">7Pet → Casa</p>
                            </div>
                        </div>
                    </div>

                    {/* Handling Time Section */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-[32px] border border-gray-200">
                        <h2 className="text-xl font-black text-secondary mb-3 flex items-center gap-3">
                            <Clock className="text-orange-500" size={24} />
                            Tempos de Manuseio Adicionais
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Minutos FIXOS adicionados ao tempo real do Google Maps (opcional, pode deixar zero).
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center block">Largada</label>
                                <input
                                    type="number"
                                    value={settings.handlingTimeLargada}
                                    onChange={(e) => handleChange('handlingTimeLargada', e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-gray-200 focus:border-orange-500/30 rounded-2xl font-black text-2xl text-center text-secondary transition-all"
                                    placeholder="0"
                                />
                                <p className="text-[9px] text-gray-400 text-center">minutos</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center block">Leva</label>
                                <input
                                    type="number"
                                    value={settings.handlingTimeLeva}
                                    onChange={(e) => handleChange('handlingTimeLeva', e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-gray-200 focus:border-orange-500/30 rounded-2xl font-black text-2xl text-center text-secondary transition-all"
                                    placeholder="0"
                                />
                                <p className="text-[9px] text-gray-400 text-center">minutos</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center block">Traz</label>
                                <input
                                    type="number"
                                    value={settings.handlingTimeTraz}
                                    onChange={(e) => handleChange('handlingTimeTraz', e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-gray-200 focus:border-orange-500/30 rounded-2xl font-black text-2xl text-center text-secondary transition-all"
                                    placeholder="0"
                                />
                                <p className="text-[9px] text-gray-400 text-center">minutos</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center block">Retorno</label>
                                <input
                                    type="number"
                                    value={settings.handlingTimeRetorno}
                                    onChange={(e) => handleChange('handlingTimeRetorno', e.target.value)}
                                    className="w-full p-4 bg-white border-2 border-gray-200 focus:border-orange-500/30 rounded-2xl font-black text-2xl text-center text-secondary transition-all"
                                    placeholder="0"
                                />
                                <p className="text-[9px] text-gray-400 text-center">minutos</p>
                            </div>
                        </div>
                    </div>

                    {/* Example Calculation */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-[32px] border-2 border-indigo-100">
                        <h3 className="text-lg font-black text-indigo-900 mb-4">💡 Exemplo de Cálculo</h3>
                        <div className="space-y-2 text-sm">
                            <p className="text-indigo-700">
                                <span className="font-black">Largada (10km, 15min):</span> (10 × R$ {Number(settings.kmPriceLargada).toFixed(2)}) + (15 × R$ {Number(settings.minPriceLargada).toFixed(2)}) = <span className="font-black text-indigo-900">R$ {((10 * Number(settings.kmPriceLargada)) + (15 * Number(settings.minPriceLargada))).toFixed(2)}</span>
                            </p>
                            <p className="text-purple-700">
                                <span className="font-black">Leva/Traz (5km, 8min cada):</span> 2 × [(5 × R$ {Number(settings.kmPriceLeva).toFixed(2)}) + (8 × R$ {Number(settings.minPriceLeva).toFixed(2)})] = <span className="font-black text-purple-900">R$ {(2 * ((5 * Number(settings.kmPriceLeva)) + (8 * Number(settings.minPriceLeva)))).toFixed(2)}</span>
                            </p>
                            <p className="text-indigo-700">
                                <span className="font-black">Retorno (10km, 15min):</span> (10 × R$ {Number(settings.kmPriceRetorno).toFixed(2)}) + (15 × R$ {Number(settings.minPriceRetorno).toFixed(2)}) = <span className="font-black text-indigo-900">R$ {((10 * Number(settings.kmPriceRetorno)) + (15 * Number(settings.minPriceRetorno))).toFixed(2)}</span>
                            </p>
                            <div className="pt-3 mt-3 border-t-2 border-indigo-200">
                                <p className="text-indigo-900 font-black text-lg">
                                    TOTAL: R$ {(
                                        ((10 * Number(settings.kmPriceLargada)) + (15 * Number(settings.minPriceLargada))) +
                                        (2 * ((5 * Number(settings.kmPriceLeva)) + (8 * Number(settings.minPriceLeva)))) +
                                        ((10 * Number(settings.kmPriceRetorno)) + (15 * Number(settings.minPriceRetorno)))
                                    ).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border-2 border-red-100">
                            <AlertCircle size={24} />
                            <span className="font-bold">{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 text-green-600 rounded-2xl flex items-center gap-3 border-2 border-green-100 animate-in slide-in-from-top-2">
                            <CheckCircle2 size={24} />
                            <span className="font-bold">Configurações salvas com sucesso!</span>
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <LoadingButton
                            type="submit"
                            isLoading={isSaving}
                            loadingText="Salvando..."
                            className="px-10 py-5 rounded-[24px] text-lg font-black bg-secondary hover:bg-secondary/90 shadow-xl shadow-secondary/20 uppercase tracking-wider"
                            rightIcon={<Save size={24} />}
                        >
                            Salvar Alterações
                        </LoadingButton>
                    </div>
                </form>
            </main>
        </div>
    );
}
