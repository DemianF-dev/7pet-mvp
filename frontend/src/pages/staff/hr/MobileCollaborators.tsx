import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Plus, Filter,
    ChevronRight, Mail, Phone,
    Scissors, Truck, HeadphonesIcon, Settings2,
    CheckCircle2, AlertTriangle, MoreHorizontal
} from 'lucide-react';
import { MobileShell } from '../../../layouts/MobileShell';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

const DEPARTMENTS = [
    { value: 'spa', label: 'SPA', icon: Scissors, color: 'text-pink-500', bgColor: 'bg-pink-50' },
    { value: 'transport', label: 'Transporte', icon: Truck, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { value: 'atendimento', label: 'Atendimento', icon: HeadphonesIcon, color: 'text-green-500', bgColor: 'bg-green-50' },
    { value: 'gestao', label: 'Gestão', icon: Settings2, color: 'text-purple-500', bgColor: 'bg-purple-50' }
];

export const MobileCollaborators = () => {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState<string | null>(null);

    const fetchProfiles = async () => {
        try {
            setIsLoading(true);
            const res = await api.get('/hr/staff-profiles');
            setProfiles(res.data);
        } catch (error) {
            console.error('Erro ao carregar colaboradores:', error);
            toast.error('Erro ao sincronizar dados');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);

    const filteredProfiles = useMemo(() => {
        return profiles.filter(p => {
            const matchesSearch = p.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.user.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = !filterDept || p.department === filterDept;
            return matchesSearch && matchesDept;
        }).sort((a, b) => a.user.name.localeCompare(b.user.name));
    }, [profiles, searchTerm, filterDept]);

    const getDeptInfo = (deptValue: string) => {
        return DEPARTMENTS.find(d => d.value === deptValue) || DEPARTMENTS[0];
    };

    return (
        <MobileShell
            title="Colaboradores"
            rightAction={
                <button
                    onClick={() => toast('Use a versão desktop para cadastrar novos colaboradores', { icon: '💻' })}
                    className="p-2 text-blue-600 active:scale-90 transition-transform"
                >
                    <Plus size={24} />
                </button>
            }
        >
            <div className="space-y-6 pb-24">
                {/* Search & Stats Summary */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="search"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-medium shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        <button
                            onClick={() => setFilterDept(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${!filterDept
                                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-gray-900 shadow-md'
                                : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                }`}
                        >
                            TODOS ({profiles.length})
                        </button>
                        {DEPARTMENTS.map(dept => {
                            const count = profiles.filter(p => p.department === dept.value).length;
                            return (
                                <button
                                    key={dept.value}
                                    onClick={() => setFilterDept(dept.value)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${filterDept === dept.value
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                                        }`}
                                >
                                    <dept.icon size={14} />
                                    {dept.label.toUpperCase()} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Collaborators List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando RH...</p>
                        </div>
                    ) : filteredProfiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center px-10">
                            <Users size={48} className="mb-4 opacity-10" />
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Nenhum colaborador encontrado</p>
                            <p className="text-xs mt-1">Tente ajustar sua busca ou filtro de departamento.</p>
                        </div>
                    ) : (
                        filteredProfiles.map((profile) => {
                            const dept = getDeptInfo(profile.department);
                            return (
                                <div
                                    key={profile.id}
                                    onClick={() => navigate(`/staff/hr/collaborators/${profile.id}`)}
                                    className={`mobile-card !p-4 flex items-start gap-4 active:scale-[0.98] transition-all relative overflow-hidden ${!profile.isActive ? 'opacity-60 grayscale' : ''}`}
                                >
                                    {/* Left: Avatar/Icon */}
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100 dark:border-zinc-800 shadow-sm ${dept.bgColor}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/50 backdrop-blur-sm ${dept.color}`}>
                                            <dept.icon size={22} />
                                        </div>
                                    </div>

                                    {/* Center: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">
                                                {profile.user.name}
                                            </h3>
                                            {!profile.isActive && (
                                                <span className="text-[8px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded-md font-bold uppercase">Inativo</span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase truncate">
                                                <Mail size={12} className="shrink-0" />
                                                {profile.user.email}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mt-1">
                                                <span className={`px-2 py-0.5 rounded-lg ${dept.bgColor} ${dept.color}`}>
                                                    {dept.label}
                                                </span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-gray-500">
                                                    {profile.payModel === 'daily' ? 'Diária' : profile.payModel === 'per_leg' ? 'Pernada' : 'Fixo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Action/Arrow */}
                                    <div className="flex flex-col items-end justify-between h-full py-1">
                                        <ChevronRight size={18} className="text-gray-300" />
                                    </div>

                                    {/* Subtle Status Indicator */}
                                    <div className={`absolute top-0 right-0 w-1 h-full ${profile.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[32px] border border-blue-100/50 dark:border-blue-800/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <AlertTriangle size={16} />
                        </div>
                        <h4 className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-widest">Informação RH</h4>
                    </div>
                    <p className="text-[11px] text-blue-800/70 dark:text-blue-200/50 leading-relaxed font-medium">
                        Esta visualização mobile é focada em consulta e acompanhamento. Para ajustes de taxas, comissões, modelos de pagamento ou histórico financeiro detalhado, utilize a versão desktop do 7Pet.
                    </p>
                </div>
            </div>
        </MobileShell>
    );
};
