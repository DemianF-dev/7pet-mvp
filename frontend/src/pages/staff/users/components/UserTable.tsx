import { UserData } from '../types';
import ResponsiveTable, { Column } from '../../../../components/system/ResponsiveTable';
import { getDivisionBgClass, getDivisionTextClass, DIVISION_LABELS } from '../../../../constants/divisions';
import { Lock, Unlock, User, Trash2, RotateCcw } from 'lucide-react';

interface UserTableProps {
    users: UserData[];
    isLoading: boolean;
    isMaster: boolean;
    visiblePasswordIds: string[];
    onTogglePassword: (id: string) => void;
    onViewCustomer: (id: string) => void;
    onEdit: (user: UserData) => void;
    onDelete: (user: UserData) => void;
    onRestore: (user: UserData) => void;
    tab: 'active' | 'trash';
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
    onSelectAll: () => void;
}

export default function UserTable({
    users, isLoading, isMaster,
    visiblePasswordIds, onTogglePassword,
    onViewCustomer, onEdit, onDelete, onRestore,
    tab, selectedIds, onToggleSelect, onSelectAll
}: UserTableProps) {
    const isTrash = tab === 'trash';

    const columns: Column<UserData>[] = [
        {
            header: 'Colaborador',
            key: 'name',
            render: (u: UserData) => (
                <div className="flex items-center gap-4">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm ${getDivisionBgClass(u.division || u.role || 'CLIENTE')} ${getDivisionTextClass(u.division || u.role || 'CLIENTE')}`}
                        style={u.color ? { backgroundColor: u.color, color: 'white' } : undefined}
                    >
                        {(u.firstName?.[0] || u.name?.[0] || u.email[0]).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-secondary text-sm">
                                {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : u.name || u.email.split('@')[0]}
                            </span>
                            <span className="bg-indigo-50 text-indigo-500 text-[9px] font-bold px-1.5 py-0.5 rounded-lg uppercase tracking-widest border border-indigo-100">
                                {u.division === 'CLIENTE' ? 'CL' : 'OP'}-{String(u.staffId ?? u.seqId).padStart(4, '0')}
                            </span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-bold">{u.email}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-300'}`}></div>
                            <span className={`text-[10px] font-bold uppercase tracking-tight ${u.isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                                {u.isOnline ? 'Online agora' : (u.lastSeenAt ? `Último acesso em ${new Date(u.lastSeenAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : 'Offline')}
                            </span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'isEligible',
            className: 'text-center',
            render: (u: UserData) => (
                u.division !== 'CLIENTE' ? (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.isEligible !== false ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.isEligible !== false ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {u.isEligible !== false ? 'Disponível' : 'Bloqueado'}
                    </div>
                ) : <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">-</span>
            )
        },
        {
            header: 'Departamento',
            key: 'division',
            render: (u: UserData) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getDivisionBgClass(u.division || u.role || 'CLIENTE')}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full w-fit ${getDivisionBgClass(u.division || u.role || 'CLIENTE')} ${getDivisionTextClass(u.division || u.role || 'CLIENTE')}`}>
                            {DIVISION_LABELS[(u.division || u.role) as keyof typeof DIVISION_LABELS] || u.division || u.role || 'N/A'}
                        </span>
                    </div>
                    {u.role && u.division && <span className="text-[9px] font-bold text-gray-400 ml-1 uppercase tracking-tight">Cargo: {u.role}</span>}
                </div>
            )
        },
        ...(isMaster ? [{
            header: 'Senha',
            key: 'plainPassword',
            render: (u: UserData) => (
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onTogglePassword(u.id); }}
                        className={`p-1.5 rounded-lg transition-all ${visiblePasswordIds.includes(u.id) ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400 hover:text-secondary'}`}
                    >
                        {visiblePasswordIds.includes(u.id) ? <Unlock size={14} /> : <Lock size={14} />}
                    </button>
                    <span className={`text-[11px] font-bold tracking-tight select-all transition-all ${visiblePasswordIds.includes(u.id) ? 'text-secondary font-mono' : 'text-gray-300'}`}>
                        {visiblePasswordIds.includes(u.id) ? (u.plainPassword || 'SEM SENHA') : '•••••••'}
                    </span>
                </div>
            )
        }] : []),
        {
            header: 'Cadastro',
            key: 'createdAt',
            render: (u) => <span className="text-xs font-bold text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
        },
        {
            header: '',
            key: 'actions',
            className: 'text-right',
            render: (u) => (
                <div className="flex items-center justify-end gap-2">
                    {isTrash ? (
                        <button onClick={(e) => { e.stopPropagation(); onRestore(u); }} className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all">
                            <RotateCcw size={18} />
                        </button>
                    ) : (
                        u.customer?.id && (u.role === 'CLIENTE' || u.allowCustomerProfile === true) && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onViewCustomer(u.customer!.id); }}
                                className="p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-all"
                            >
                                <User size={18} />
                            </button>
                        )
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDelete(u); }} className="p-2.5 hover:bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <ResponsiveTable
                columns={columns as any}
                data={users}
                isLoading={isLoading}
                keyExtractor={(u: UserData) => u.id}
                onRowClick={isTrash ? undefined : onEdit}
                selectable
                selectedIds={selectedIds}
                onSelectRow={onToggleSelect}
                onSelectAll={onSelectAll}
                emptyMessage="Nenhum colaborador encontrado para estes filtros."
            />
        </div>
    );
}
