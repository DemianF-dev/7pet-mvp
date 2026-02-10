import { useState, useMemo } from 'react';
import {
    Shield, Search, Plus, Filter,
    Edit2, Lock,
    Trash2, RotateCcw,
    Mail, User as UserIcon,
    ShieldAlert
} from 'lucide-react';
import { MobileShell } from '../../../../layouts/MobileShell';
import { UserData } from '../types';
import { AppImage } from '../../../../components/ui';

interface MobileUsersProps {
    users: UserData[];
    isLoading: boolean;
    onEdit: (user: UserData) => void;
    onDelete: (user: UserData) => void;
    onRestore: (user: UserData) => void;
    onNew: () => void;
    onTogglePassword: (id: string) => void;
    visiblePasswordIds: string[];
}

const DIVISION_COLORS: Record<string, string> = {
    'SPA': 'text-pink-600 bg-pink-100 dark:bg-pink-900/30',
    'LOGISTICA': 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    'DIRETORIA': 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    'ADMIN': 'text-gray-600 bg-gray-100 dark:bg-zinc-800',
    'COMERCIAL': 'text-green-600 bg-green-100 dark:bg-green-900/30',
    'OPERACIONAL': 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
};

export const MobileUsers = ({
    users,
    isLoading,
    onEdit,
    onDelete,
    onRestore,
    onNew,
    onTogglePassword,
    visiblePasswordIds
}: MobileUsersProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDivision, setFilterDivision] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const divisions = useMemo(() => {
        const set = new Set(users.map(u => u.division).filter(Boolean));
        return Array.from(set).sort() as string[];
    }, [users]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDivision = !filterDivision || u.division === filterDivision;
            return matchesSearch && matchesDivision;
        }).sort((a, b) => {
            // Deleted users at the bottom
            if (a.deletedAt && !b.deletedAt) return 1;
            if (!a.deletedAt && b.deletedAt) return -1;
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [users, searchTerm, filterDivision]);

    return (
        <MobileShell
            title="Usuários & Acessos"
            rightAction={
                <button
                    onClick={onNew}
                    className="p-2 text-blue-600 active:scale-90 transition-transform"
                >
                    <Plus size={28} strokeWidth={2.5} />
                </button>
            }
        >
            <div className="space-y-6 pb-24">
                {/* Search & Stats */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="search"
                                placeholder="Buscar usuários..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400'}`}
                        >
                            <Filter size={20} />
                        </button>
                    </div>

                    {showFilters && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            <button
                                onClick={() => setFilterDivision(null)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${!filterDivision
                                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                    }`}
                            >
                                TODOS
                            </button>
                            {divisions.map(div => (
                                <button
                                    key={div}
                                    onClick={() => setFilterDivision(div)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${filterDivision === div
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                        }`}
                                >
                                    {div.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Users List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando Segurança...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-10">
                            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mb-6">
                                <Shield size={40} className="opacity-10" />
                            </div>
                            <p className="font-bold text-gray-600 dark:text-gray-300">Nenhum usuário encontrado</p>
                            <p className="text-xs mt-1">Tente ajustar sua busca ou filtros.</p>
                        </div>
                    ) : (
                        filteredUsers.map((u) => {
                            const isDeleted = !!u.deletedAt;
                            const isPasswordVisible = visiblePasswordIds.includes(u.id);

                            return (
                                <div
                                    key={u.id}
                                    className={`mobile-card !p-4 flex flex-col gap-4 relative overflow-hidden transition-all ${isDeleted ? 'opacity-50 blur-[0.5px] grayscale' : ''}`}
                                >
                                    {/* User Info Row */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-700">
                                            {u.photo ? (
                                                <AppImage src={u.photo} alt={u.name || 'User'} className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon size={20} className="text-zinc-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase truncate">
                                                    {u.name}
                                                </h3>
                                                {u.role === 'MASTER' && (
                                                    <ShieldAlert size={14} className="text-orange-500 shrink-0" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase truncate">
                                                <Mail size={12} className="shrink-0" />
                                                {u.email}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider ${DIVISION_COLORS[u.division] || 'bg-zinc-100 text-zinc-400'}`}>
                                                {u.division || 'Geral'}
                                            </span>
                                            {isDeleted && (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-lg text-[8px] font-bold uppercase">Excluído</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Password Row (if master/admin potentially) */}
                                    {!isDeleted && (
                                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <Lock size={12} className="text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Senha:</span>
                                                <span className={`text-xs font-mono font-bold ${isPasswordVisible ? 'text-blue-600' : 'text-zinc-300'}`}>
                                                    {isPasswordVisible ? u.plainPassword : '••••••••'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => onTogglePassword(u.id)}
                                                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-white dark:bg-zinc-800 px-2 py-1 rounded-md shadow-sm active:scale-95 transition-all"
                                            >
                                                {isPasswordVisible ? 'Esconder' : 'Ver'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Actions Row */}
                                    <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                        <div className="flex gap-2">
                                            {!isDeleted ? (
                                                <>
                                                    <button
                                                        onClick={() => onEdit(u)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                                                    >
                                                        <Edit2 size={14} /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(u)}
                                                        className="flex items-center justify-center p-2 bg-red-50 text-red-500 rounded-xl active:scale-95 transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => onRestore(u)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all w-full justify-center"
                                                >
                                                    <RotateCcw size={14} /> Restaurar Conta
                                                </button>
                                            )}
                                        </div>

                                        <div className="text-[9px] font-bold text-zinc-400 uppercase">
                                            Role: <span className="text-zinc-600 dark:text-zinc-300">{u.role}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Security Message */}
                <div className="p-6 bg-zinc-900 dark:bg-zinc-100 rounded-[32px] text-white dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Shield size={16} />
                        </div>
                        <h4 className="text-xs font-bold uppercase tracking-widest">Controle de Acesso</h4>
                    </div>
                    <p className="text-[11px] opacity-70 leading-relaxed font-medium">
                        Como MASTER, você tem visibilidade total das senhas e permissões. Lembre-se que alterações de cargo ou divisão afetam imediatamente o que o usuário pode ver no sistema.
                    </p>
                </div>
            </div>
        </MobileShell>
    );
};
