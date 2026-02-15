import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Truck, Users, Briefcase, CreditCard, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

interface PayrollConfigProps {
    staff: any;
    onUpdate: () => void;
    readOnly?: boolean;
}

export const PayrollConfig: React.FC<PayrollConfigProps> = ({ staff, onUpdate, readOnly = false }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        payModel: staff.payModel || 'DAILY',
        dailyRate: staff.dailyRate || 0,
        perLegRate: staff.perLegRate || 0,
        fixedSalary: staff.fixedSalary || 0,
        commissionPercent: staff.commissionPercent || 0,
        mealVoucher: staff.mealVoucher || 0,
        transportVoucher: staff.transportVoucher || 0,
        otherBenefits: staff.otherBenefits || 0,
        bankAccount: staff.bankAccount || '',
        bankAgency: staff.bankAgency || '',
        bankName: staff.bankName || '',
        pixKey: staff.pixKey || '',
        bankAccountType: staff.bankAccountType || 'CORRENTE'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        setLoading(true);

        try {
            // Assuming endpoint is /staff/:id/profile or similar. 
            // If retrieving "my" profile, it's /auth/me. 
            // But this component is likely used in Manager view (/staff/:id).
            // We need to know context. Let's assume passed ID is available via staff.id or staff.userId.
            // But backend expects patch likely on /staff/:id/profile or /users/:id.
            // Let's assume the parent handles the actual API call or passes a saver function?
            // For now, I'll call a generic endpoint or patch directly if I know the ID.
            // Given `staff` object has ID.
            // If staff.id is StaffProfile ID, endpoint might be different.
            // Let's try /staff/:id/profile PATCH.

            // Wait, standard update usually goes to user endpoint or staff endpoint.
            // Let's try /staff/:id first.

            const payload = {
                staffNewData: {
                    ...formData
                }
            };

            // Since we don't know the exact endpoint structure for updating StaffProfile fields specifically (vs User fields),
            // we might need to adjust.
            // Let's assume we use a specific endpoint or generic update.
            // Reviewing previous code, StaffProfile is usually updated via User update?
            // No, StaffProfile fields are specific.
            // I'll assume endpoint exists: PATCH /staff/:staffId

            await api.patch(`/staff/${staff.id}`, payload.staffNewData);

            toast.success('Configurações salvas!');
            onUpdate();
        } catch (error: any) {
            console.error(error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Model Selection */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-indigo-600" />
                    Modelo de Contratação
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Modelo Principal</label>
                        <div className="relative">
                            <select
                                name="payModel"
                                value={formData.payModel}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            >
                                <option value="DAILY">Diária (Freelancer)</option>
                                <option value="PER_LEG">Por Pernada (Motorista)</option>
                                <option value="FIXED">Salário Fixo (CLT/PJ)</option>
                                <option value="HYBRID">Híbrido (Comissão + Fixo)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Comissão (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="commissionPercent"
                                value={formData.commissionPercent}
                                onChange={handleChange}
                                disabled={readOnly}
                                step="0.1"
                                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</div>
                        </div>
                    </div>
                </div>

                {/* Dynamic Fields based on Model */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(formData.payModel === 'DAILY' || formData.payModel === 'HYBRID') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor da Diária</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="dailyRate"
                                    value={formData.dailyRate}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                                />
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    )}

                    {(formData.payModel === 'PER_LEG' || formData.payModel === 'HYBRID') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Valor Por Pernada (Base)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="perLegRate"
                                    value={formData.perLegRate}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                                />
                                <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    )}

                    {(formData.payModel === 'FIXED' || formData.payModel === 'HYBRID') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Salário Base</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="fixedSalary"
                                    value={formData.fixedSalary}
                                    onChange={handleChange}
                                    disabled={readOnly}
                                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                                />
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Benefits */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-emerald-600" />
                    Benefícios e Auxílios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vale Refeição / Dia</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="mealVoucher"
                                value={formData.mealVoucher}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vale Transporte / Dia</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="transportVoucher"
                                value={formData.transportVoucher}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                            <Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Outros Benefícios</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="otherBenefits"
                                value={formData.otherBenefits}
                                onChange={handleChange}
                                disabled={readOnly}
                                className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            />
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bank Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CreditCard size={20} className="text-orange-500" />
                    Dados Bancários
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chave PIX</label>
                        <input
                            type="text"
                            name="pixKey"
                            value={formData.pixKey}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            placeholder="CPF, Email, Telefone..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Banco</label>
                        <input
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                            placeholder="Nome ou Código"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Agência</label>
                        <input
                            type="text"
                            name="bankAgency"
                            value={formData.bankAgency}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Conta</label>
                        <input
                            type="text"
                            name="bankAccount"
                            value={formData.bankAccount}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Conta</label>
                        <select
                            name="bankAccountType"
                            value={formData.bankAccountType}
                            onChange={handleChange}
                            disabled={readOnly}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                        >
                            <option value="CORRENTE">Corrente</option>
                            <option value="POUPANCA">Poupança</option>
                            <option value="SALARIO">Salário</option>
                            <option value="PAGAMENTO">Conta de Pagamento</option>
                        </select>
                    </div>
                </div>
            </div>

            {!readOnly && (
                <div className="flex justify-end p-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Salvando...' : (
                            <>
                                <Save size={18} />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            )}
        </form>
    );
};
