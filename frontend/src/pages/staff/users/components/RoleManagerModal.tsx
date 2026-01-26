import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Plus, Users, Check, Trash2 } from 'lucide-react';
import { RolePermission, NewRoleData } from '../types';
import { PERMISSION_MODULES } from '../../../../constants/permissions';
import { useRoles } from '../hooks/useRoles';

interface RoleManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: any[];
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({ isOpen, onClose, users }) => {
    const {
        rolePermissions,
        selectedConfigRole,
        editingRoleLabel,
        editingRolePerms,
        hasRoleChanges,
        isAddingRole,
        newRoleData,
        setSelectedConfigRole,
        setEditingRoleLabel,
        setEditingRolePerms,
        setHasRoleChanges,
        setIsAddingRole,
        setNewRoleData,
        handleSaveRoleConfig,
        handleCreateRole,
        handleDeleteRole,
        togglePermission
    } = useRoles({ users, isMaster: true });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-secondary/60 backdrop-blur-sm z-[90]" />
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{
                        position: 'fixed', left: window.innerWidth > 768 ? '280px' : '5%', top: '40px',
                        zIndex: 100, width: 'calc(100% - 320px)', maxWidth: '850px', maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column'
                    }}
                    className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
                >
                    <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                        <div>
                            <h3 className="text-2xl font-black text-secondary flex items-center gap-3"><Lock size={22} className="text-primary" /> Configurar Cargos</h3>
                            <p className="text-sm font-bold text-gray-400">Personalize o nome e permissões padrão de cada função</p>
                        </div>
                        <X size={24} className="cursor-pointer text-gray-400" onClick={onClose} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 space-y-8">
                        <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-50">
                            {rolePermissions.map(rp => (
                                <div key={rp.role} className="relative group">
                                    <button
                                        onClick={() => setSelectedConfigRole(rp.role)}
                                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedConfigRole === rp.role ? 'bg-secondary text-white shadow-xl scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    >
                                        {rp.label || rp.role}
                                    </button>
                                    {rp.role.toUpperCase() !== 'MASTER' && (
                                        <button
                                            onClick={() => handleDeleteRole(rp.role)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                            title="Excluir Cargo"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setIsAddingRole(!isAddingRole)} className="px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-[10px] font-black uppercase hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                                <Plus size={14} /> Novo Cargo
                            </button>
                        </div>

                        {isAddingRole && (
                            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 grid grid-cols-2 gap-4">
                                <input placeholder="CÓDIGO (EX: VENDEDOR)" value={newRoleData.slug} onChange={e => setNewRoleData({ ...newRoleData, slug: e.target.value.toUpperCase() })} className="bg-white px-5 py-3 rounded-2xl font-bold text-xs" />
                                <input placeholder="NOME (EX: Vendedor)" value={newRoleData.label} onChange={e => setNewRoleData({ ...newRoleData, label: e.target.value })} className="bg-white px-5 py-3 rounded-2xl font-bold text-xs" />
                                <button onClick={handleCreateRole} className="col-span-2 bg-primary text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Criar Cargo</button>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Editar Nome de Exibição</label>
                                <input
                                    value={editingRoleLabel}
                                    onChange={e => { setEditingRoleLabel(e.target.value); setHasRoleChanges(true); }}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-black text-secondary text-lg"
                                />
                            </div>

                            <div>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4">Módulos Liberados por Padrão</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {PERMISSION_MODULES.map(m => {
                                        const active = editingRolePerms.includes(m.id);
                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => togglePermission(m.id)}
                                                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all flex items-center justify-between ${active ? 'bg-white border-primary shadow-xl shadow-primary/5' : 'bg-white/50 border-transparent opacity-60'}`}
                                            >
                                                <span className={`text-xs font-black ${active ? 'text-secondary' : 'text-gray-400'}`}>{m.label}</span>
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${active ? 'bg-primary text-white' : 'bg-gray-100'}`}>
                                                    {active && <Check size={14} />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="pt-8 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuários Vinculados ({users.filter(u => u.role?.toUpperCase() === selectedConfigRole?.toUpperCase()).length})</h4>
                                    </div>

                                    <div className="space-y-3">
                                        {users.filter(u => u.role?.toUpperCase() === selectedConfigRole?.toUpperCase()).length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {users.filter(u => u.role?.toUpperCase() === selectedConfigRole?.toUpperCase()).map(user => (
                                                    <div key={user.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50 group hover:bg-white hover:shadow-lg transition-all">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg" style={{ backgroundColor: user.color || '#3B82F6' }}>
                                                            {user.name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-secondary text-sm truncate">{user.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 truncate uppercase">{user.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4">
                                                    <Users size={20} />
                                                </div>
                                                <p className="text-sm font-bold text-gray-400">Nenhum colaborador vinculado a este cargo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                        <p className="text-[10px] font-extra-bold text-gray-400 uppercase tracking-widest">{hasRoleChanges ? '⚠ Você tem alterações não salvas' : '✅ Configurações salvas'}</p>
                        <div className="flex gap-4 items-center">
                            {selectedConfigRole?.toUpperCase() !== 'MASTER' && (
                                <button
                                    onClick={() => handleDeleteRole(selectedConfigRole)}
                                    className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> Excluir Cargo
                                </button>
                            )}
                            <button onClick={onClose} className="font-bold text-gray-400 px-4">Fechar</button>
                            <button
                                onClick={handleSaveRoleConfig}
                                disabled={!hasRoleChanges}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${hasRoleChanges ? 'bg-primary text-white shadow-xl hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};