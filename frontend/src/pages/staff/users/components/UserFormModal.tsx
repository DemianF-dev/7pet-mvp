import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Lock, Unlock, Shield, Briefcase, Check, Trash2, RotateCcw } from 'lucide-react';

import {
    UserData,
    UserFormData,
    RolePermission,
    TabType
} from '../types';
import { PERMISSION_MODULES } from '../../../../constants/permissions';
import { DIVISION_LABELS, getDivisionBgClass, getDivisionTextClass } from '../../../../constants/divisions';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedUser: UserData | null;
    tab: TabType;
    showModalPassword: boolean;
    setShowModalPassword: (show: boolean) => void;
    rolePermissions: RolePermission[];
    isMaster: boolean;
    currentUser: any;
    onSave: (formData: UserFormData) => Promise<void>;
    onDelete: (user: UserData) => Promise<void>;
    onRestore: (user: UserData) => Promise<void>;
    onRoleChange: (role: string, setFormData: (data: any) => void) => void;
    togglePermission: (moduleId: string) => void;
    onViewCustomer: (id: string) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
    isOpen,
    onClose,
    selectedUser,
    tab,
    showModalPassword,
    setShowModalPassword,
    rolePermissions,
    isMaster,
    currentUser,
    onSave,
    onDelete,
    onRestore,
    onRoleChange,
    togglePermission,
    onViewCustomer
}) => {
    const [formData, setFormData] = useState<UserFormData>({
        firstName: '',
        lastName: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        notes: '',
        division: 'CLIENTE',
        role: '',
        permissions: [],
        birthday: '',
        admissionDate: '',
        document: '',
        address: '',
        color: '#3B82F6',
        isEligible: false,
        isSupportAgent: false,
        active: true,
        allowCustomerProfile: false,
        isCustomRole: false,
        pauseMenuEnabled: false,
        allowedGames: []
    });

    const isTrash = tab === 'trash';

    // Initialize form data when selected user changes
    React.useEffect(() => {
        if (selectedUser) {
            let permissions: string[] = [];
            try {
                if (selectedUser.permissions) permissions = typeof selectedUser.permissions === 'string' ? JSON.parse(selectedUser.permissions) : selectedUser.permissions;
            } catch (e) { console.error("Error parsing permissions", e); }

            // Check if role is standard or custom
            const isStandardRole = selectedUser.role === 'MASTER' || selectedUser.role === 'CLIENTE' || rolePermissions.some(rp => rp.role === selectedUser.role);

            setFormData({
                firstName: selectedUser.firstName || '',
                lastName: selectedUser.lastName || '',
                name: selectedUser.name || selectedUser.customer?.name || '',
                email: selectedUser.email,
                password: '',
                phone: selectedUser.phone || '',
                notes: selectedUser.notes || '',
                division: selectedUser.division || 'CLIENTE',
                role: selectedUser.role || '',
                permissions,
                birthday: selectedUser.birthday ? new Date(selectedUser.birthday).toISOString().split('T')[0] : '',
                admissionDate: selectedUser.admissionDate ? new Date(selectedUser.admissionDate).toISOString().split('T')[0] : '',
                document: selectedUser.document || '',
                address: selectedUser.address || '',
                color: selectedUser.color || '#3B82F6',
                isEligible: selectedUser.isEligible !== undefined ? selectedUser.isEligible : false,
                isSupportAgent: selectedUser.isSupportAgent !== undefined ? selectedUser.isSupportAgent : false,
                active: selectedUser.active !== undefined ? selectedUser.active : true,
                allowCustomerProfile: selectedUser.allowCustomerProfile || false,
                isCustomRole: selectedUser.role ? !isStandardRole : false,
                pauseMenuEnabled: selectedUser.pauseMenuEnabled || false,
                allowedGames: Array.isArray(selectedUser.allowedGames) ? selectedUser.allowedGames : []
            });
        }
    }, [selectedUser, rolePermissions]);

    const handleSave = async () => {
        await onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[80]"
                />
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-[80] flex flex-col"
                >
                    {/* Protection Message */}
                    {selectedUser && (selectedUser.role?.toUpperCase() === 'ADMIN' || selectedUser.role?.toUpperCase() === 'MASTER') && !isMaster && (
                        <div className="bg-red-500 text-white p-3 text-center text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            <Shield size={14} /> Somente o Master pode editar perfis Administrativos ou Master
                        </div>
                    )}

                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-black text-secondary">{selectedUser ? 'Editar Perfil' : 'Novo Colaborador'}</h3>
                                {selectedUser && (
                                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${selectedUser.isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${selectedUser.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                        {selectedUser.isOnline ? 'Online' : 'Offline'}
                                    </div>
                                )}
                            </div>
                            <p className="text-sm font-bold text-gray-400">{formData.email || 'Cadastre os dados abaixo'}</p>
                        </div>
                        <X size={24} className="cursor-pointer text-gray-400" onClick={onClose} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Primeiro Nome</label>
                                <input
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">Sobrenome</label>
                                <input
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">E-mail</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-black text-gray-400 uppercase mb-2">
                                    {selectedUser ? 'Redefinir Senha' : 'Senha Provisória'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={selectedUser ? "Deixe em branco para manter a atual" : "••••••••"}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3 font-bold text-secondary outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {isMaster && selectedUser?.plainPassword != null && (
                                    <div className="mt-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-primary" />
                                                <span className="text-[10px] font-black text-secondary uppercase tracking-tight">Senha Atual Registrada</span>
                                            </div>
                                            <button
                                                onClick={() => setShowModalPassword(!showModalPassword)}
                                                className={`p-1.5 rounded-lg transition-all ${showModalPassword ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-gray-400 shadow-sm'}`}
                                            >
                                                {showModalPassword ? <Unlock size={14} /> : <Lock size={14} />}
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-center p-3 bg-white rounded-xl border border-gray-100 shadow-inner">
                                            <span className={`text-sm font-black tracking-widest ${showModalPassword ? 'text-secondary font-mono select-all' : 'text-gray-200'}`}>
                                                {showModalPassword ? selectedUser.plainPassword : '••••••••'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase"><Briefcase size={14} /> Divisão & Cargo</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 mb-1">Divisão / Departamento</label>
                                    <select
                                        value={formData.division}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const isCliente = val === 'CLIENTE';
                                            setFormData({
                                                ...formData,
                                                division: val,
                                                role: isCliente ? 'CLIENTE' : (formData.role === 'CLIENTE' ? 'OPERACIONAL' : formData.role),
                                                permissions: isCliente ? [] : formData.permissions
                                            });
                                        }}
                                        className={`w-full border-none rounded-xl px-4 py-3 font-bold ${getDivisionBgClass(formData.division)} ${getDivisionTextClass(formData.division)}`}
                                    >
                                        {Object.entries(DIVISION_LABELS)
                                            .map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                    </select>
                                    <p className="text-[9px] text-gray-400 mt-1 italic">A divisão determina os acessos padrão do usuário no sistema.</p>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 mb-1">Cargo / Função</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={(formData as any).isCustomRole ? 'CUSTOM' : formData.role || 'OPERACIONAL'}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === 'CUSTOM') {
                                                    setFormData({ ...formData, role: '', isCustomRole: true } as any);
                                                } else {
                                                    onRoleChange(val, setFormData);
                                                }
                                            }}
                                            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 font-bold text-secondary"
                                        >
                                            <option value="CLIENTE">Perfil: Cliente (Predefinido)</option>

                                            {/* Only Master can create other Masters */}
                                            {isMaster && <option value="MASTER">👑 MASTER (Super Usuário)</option>}

                                            {rolePermissions
                                                .filter(rp => rp.role !== 'CLIENTE' && rp.role !== 'MASTER')
                                                // Only Master can create Admins
                                                .filter(rp => isMaster || rp.role !== 'ADMIN')
                                                .map(rp => (
                                                    <option key={rp.role} value={rp.role}>
                                                        {rp.label || rp.role}
                                                    </option>
                                                ))
                                            }
                                            <option value="CUSTOM">+ Digitar novo cargo...</option>
                                        </select>
                                    </div>

                                    {(formData as any).isCustomRole && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                value={formData.role}
                                                onChange={e => setFormData({ ...formData, role: e.target.value.toUpperCase() })}
                                                placeholder="Digite o nome do novo cargo..."
                                                className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 font-bold text-secondary"
                                                autoFocus
                                            />
                                            <p className="text-[9px] text-primary font-bold mt-1 uppercase italic">Este cargo será salvo e poderá ser usado em outros perfis.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {formData.division !== 'CLIENTE' && (
                            <div className="pt-4 border-t border-gray-50 mt-4">
                                <label className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl cursor-pointer hover:bg-primary/10 transition-colors border border-primary/10">
                                    <input
                                        type="checkbox"
                                        checked={formData.isEligible}
                                        onChange={e => setFormData({ ...formData, isEligible: e.target.checked })}
                                        className="w-5 h-5 rounded-lg text-primary focus:ring-primary transition-all"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-secondary uppercase tracking-tight">Elegível para Execução</div>
                                        <div className="text-[10px] font-bold text-gray-400">Define se este profissional aparece nas listas de seleção para serviços e logística.</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.isEligible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {formData.isEligible ? 'ATIVO' : 'INATIVO'}
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors border border-blue-100 mt-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.isSupportAgent}
                                        onChange={e => setFormData({ ...formData, isSupportAgent: e.target.checked })}
                                        className="w-5 h-5 rounded-lg text-blue-500 focus:ring-blue-500 transition-all"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-secondary uppercase tracking-tight">Agente de Suporte</div>
                                        <div className="text-[10px] font-bold text-gray-400">Permite que clientes iniciem conversas de suporte com este colaborador.</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.isSupportAgent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {formData.isSupportAgent ? 'HABILITADO' : 'DESABILITADO'}
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-2xl cursor-pointer hover:bg-orange-50 transition-colors border border-orange-100 mt-3">
                                    <input
                                        type="checkbox"
                                        checked={formData.allowCustomerProfile}
                                        onChange={e => setFormData({ ...formData, allowCustomerProfile: e.target.checked })}
                                        className="w-5 h-5 rounded-lg text-orange-500 focus:ring-orange-500 transition-all"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-secondary uppercase tracking-tight">Permitir uso como Cliente</div>
                                        <div className="text-[10px] font-bold text-gray-400">Autoriza este colaborador a ser selecionado como cliente em vendas e orçamentos.</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.allowCustomerProfile ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {formData.allowCustomerProfile ? 'AUTORIZADO' : 'NEGADO'}
                                    </div>
                                </label>
                            </div>
                        )}

                        {/* Customer Status Controls */}
                        {(formData.division === 'CLIENTE' || formData.allowCustomerProfile) && (
                            <div className="pt-4 border-t border-gray-50 mt-4 space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                                    <Shield size={14} /> Status e Acesso do Cliente
                                </h4>

                                {/* Risk Level Classification */}
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-tight">Nível de Classificação</div>
                                        <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shadow-sm ${(formData as any).customer?.riskLevel === 'Nivel 3' ? 'bg-red-500 text-white shadow-red-100' :
                                            (formData as any).customer?.riskLevel === 'Nivel 2' ? 'bg-amber-500 text-white shadow-amber-100' :
                                                'bg-green-500 text-white shadow-green-100'
                                            }`}>
                                            {(formData as any).customer?.riskLevel || 'Nivel 1'}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Nivel 1', 'Nivel 2', 'Nivel 3'].map(lvl => (
                                            <button
                                                key={lvl}
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    customer: {
                                                        ...((formData as any).customer || {}),
                                                        riskLevel: lvl
                                                    }
                                                } as any)}
                                                className={`py-2 rounded-xl text-[10px] font-black transition-all border ${((formData as any).customer?.riskLevel || 'Nivel 1') === lvl
                                                    ? (lvl === 'Nivel 3' ? 'bg-red-500 border-red-500 text-white shadow-md' :
                                                        lvl === 'Nivel 2' ? 'bg-amber-500 border-amber-500 text-white shadow-md' :
                                                            'bg-green-600 border-green-600 text-white shadow-md')
                                                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                                    }`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 italic leading-tight">
                                        {(formData as any).customer?.riskLevel === 'Nivel 3' ? '⚠️ CRÍTICO: Problemas graves ou comportamento indesejado.' :
                                            (formData as any).customer?.riskLevel === 'Nivel 2' ? '🔶 ATENÇÃO: Requer cuidados ou possui histórico de pendências.' :
                                                '✅ NORMAL: Cliente exemplar sem restrições registradas.'}
                                    </p>
                                </div>

                                {/* Status Display */}
                                {!((formData as any).customer?.isBlocked) && ((formData as any).customer?.canRequestQuotes !== false) && (
                                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white">
                                            <Check size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-black text-green-700 uppercase tracking-tight">Disponível (Tudo OK)</div>
                                            <div className="text-[10px] font-bold text-green-600/70">O cliente possui acesso total ao sistema e orçamentos.</div>
                                        </div>
                                    </div>
                                )}

                                {/* Block Quotes */}
                                <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl cursor-pointer hover:bg-amber-100 transition-colors border border-amber-200">
                                    <input
                                        type="checkbox"
                                        checked={!((formData as any).customer?.canRequestQuotes ?? true)}
                                        onChange={e => setFormData({
                                            ...formData,
                                            customer: {
                                                ...((formData as any).customer || {}),
                                                canRequestQuotes: !e.target.checked
                                            }
                                        } as any)}
                                        className="w-5 h-5 rounded-lg text-amber-500 focus:ring-amber-500 transition-all transition-all"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-amber-700 uppercase tracking-tight">Bloquear Orçamentos</div>
                                        <div className="text-[10px] font-bold text-amber-600/70">Inadimplência ou restrição. Impede novos pedidos.</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${!((formData as any).customer?.canRequestQuotes ?? true) ? 'bg-amber-200 text-amber-700' : 'bg-green-100 text-green-600'}`}>
                                        {!((formData as any).customer?.canRequestQuotes ?? true) ? 'BLOQUEADO' : 'LIBERADO'}
                                    </div>
                                </label>

                                {/* Block System */}
                                <label className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl cursor-pointer hover:bg-red-100 transition-colors border border-red-200">
                                    <input
                                        type="checkbox"
                                        checked={(formData as any).customer?.isBlocked ?? false}
                                        onChange={e => setFormData({
                                            ...formData,
                                            customer: {
                                                ...((formData as any).customer || {}),
                                                isBlocked: e.target.checked
                                            }
                                        } as any)}
                                        className="w-5 h-5 rounded-lg text-red-500 focus:ring-red-500 transition-all transition-all"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-red-700 uppercase tracking-tight">Bloquear Acesso ao Sistema</div>
                                        <div className="text-[10px] font-bold text-red-600/70">Impede login e recuperação de senha. Histórico mantido.</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${(formData as any).customer?.isBlocked ? 'bg-red-200 text-red-700' : 'bg-green-100 text-green-600'}`}>
                                        {(formData as any).customer?.isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                                    </div>
                                </label>

                                {/* Link to customer profile */}
                                {(formData as any).customer?.id && (
                                    <button
                                        onClick={() => onViewCustomer((formData as any).customer.id)}
                                        className="w-full flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-blue-50 transition-all group mt-2 text-left"
                                    >
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                                            <Briefcase size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-black text-blue-700 uppercase">Ver Perfil Completo do Cliente</div>
                                            <div className="text-[9px] font-bold text-blue-400 italic">Ver pets, histórico de orçamentos e faturamento.</div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase"><Lock size={14} /> Permissões Específicas</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {PERMISSION_MODULES.map(m => (
                                    <label key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.includes(m.id)}
                                            onChange={() => togglePermission(m.id)}
                                            className="w-4 h-4 rounded text-primary"
                                        />
                                        <span className="text-xs font-bold text-secondary">{m.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Gamification (Dev Only) */}
                        {currentUser?.email === 'oidemianf@gmail.com' && (
                            <div className="pt-4 border-t border-gray-50 mt-4 space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                                    <Shield size={14} /> Gamification & Privilégios (Dev Only)
                                </h4>
                                <label className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl cursor-pointer hover:bg-purple-100 transition-colors border border-purple-200">
                                    <input
                                        type="checkbox"
                                        checked={formData.pauseMenuEnabled}
                                        onChange={e => setFormData({ ...formData, pauseMenuEnabled: e.target.checked })}
                                        className="w-5 h-5 rounded-lg text-purple-600 focus:ring-purple-600 transition-all"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-black text-purple-700 uppercase tracking-tight">Habilitar Menu PAUSA</div>
                                        <div className="text-[10px] font-bold text-purple-600/70">Libera acesso aos mini-games e atividades de pausa.</div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${formData.pauseMenuEnabled ? 'bg-purple-200 text-purple-800' : 'bg-gray-100 text-gray-400'}`}>
                                        {formData.pauseMenuEnabled ? 'LIBERADO' : 'BLOQUEADO'}
                                    </div>
                                </label>

                                {formData.pauseMenuEnabled && (
                                    <div className="space-y-2 mt-2 pl-4 border-l-2 border-purple-100">
                                        <h5 className="text-[10px] font-bold text-gray-400 uppercase">Jogos Permitidos</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'paciencia-pet', label: 'Paciência Pet' },
                                                { id: 'petmatch', label: 'Pet Match' },
                                                { id: 'zen-espuma', label: 'Zen Pad — Espuma' },
                                                { id: 'coleira', label: 'Desenrosca a Coleira' }
                                            ].map(game => {
                                                const allowed = Array.isArray(formData.allowedGames) ? formData.allowedGames : [];
                                                const isAllowed = allowed.includes(game.id);
                                                return (
                                                    <label key={game.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isAllowed}
                                                            onChange={() => {
                                                                const newGames = isAllowed
                                                                    ? allowed.filter((g: string) => g !== game.id)
                                                                    : [...allowed, game.id];
                                                                setFormData({ ...formData, allowedGames: newGames });
                                                            }}
                                                            className="rounded text-purple-600 focus:ring-purple-500"
                                                        />
                                                        <span className="text-xs font-medium text-gray-600">{game.label}</span>
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        {selectedUser && (
                            <div className="flex gap-2">
                                {isTrash ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                onClose();
                                                onRestore(selectedUser);
                                            }}
                                            className="flex items-center gap-2 text-green-600 font-extra-bold text-[10px] uppercase tracking-widest hover:underline"
                                        >
                                            <RotateCcw size={14} /> Restaurar Perfil
                                        </button>
                                        {isMaster && (
                                            <button
                                                onClick={() => onDelete(selectedUser)}
                                                className="flex items-center gap-2 text-red-500 font-extra-bold text-[10px] uppercase tracking-widest hover:underline border-l border-gray-200 ml-2 pl-4"
                                            >
                                                <Trash2 size={14} /> Excluir Definitivamente
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => onDelete(selectedUser)}
                                        disabled={!!(selectedUser && (selectedUser.role?.toUpperCase() === 'ADMIN' || selectedUser.role?.toUpperCase() === 'MASTER') && !isMaster)}
                                        className="flex items-center gap-2 text-red-500 font-black text-xs hover:underline disabled:opacity-30 disabled:no-underline"
                                    >
                                        <Trash2 size={16} /> Excluir Conta
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="flex gap-3 ml-auto">
                            <button onClick={onClose} className="px-6 py-3 font-bold text-gray-400">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={!!(selectedUser && (selectedUser.role?.toUpperCase() === 'ADMIN' || selectedUser.role?.toUpperCase() === 'MASTER') && !isMaster)}
                                className="btn-primary px-8 py-3 flex items-center gap-2 disabled:opacity-50 disabled:grayscale cursor-pointer"
                            >
                                <Save size={18} /> Salvar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};