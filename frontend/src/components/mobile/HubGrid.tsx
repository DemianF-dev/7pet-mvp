import { useNavigate } from 'react-router-dom';
import {
    Truck, DollarSign, Users,
    Briefcase, FileText, Heart,
    BarChart3, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const HubGrid = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    const sections = [
        {
            title: 'Operacional',
            items: [
                { label: 'Kanban', icon: Briefcase, path: '/staff/kanban', color: 'bg-orange-100 text-orange-600' },
                { label: 'Transporte', icon: Truck, path: '/staff/transport', color: 'bg-blue-100 text-blue-600' },
            ]
        },
        {
            title: 'Financeiro',
            items: [
                { label: 'PDV', icon: DollarSign, path: '/staff/pos', color: 'bg-green-100 text-green-600' },
                { label: 'Faturas', icon: FileText, path: '/staff/invoices', color: 'bg-emerald-100 text-emerald-600' },
                { label: 'Planos', icon: Heart, path: '/staff/recurrence', color: 'bg-pink-100 text-pink-600' },
            ]
        },
        {
            title: 'Gestão',
            items: [
                { label: 'Relatórios', icon: BarChart3, path: '/staff/reports', color: 'bg-purple-100 text-purple-600' },
                { label: 'Usuários', icon: Users, path: '/staff/users', color: 'bg-indigo-100 text-indigo-600' },
                { label: 'Auditoria', icon: ShieldCheck, path: '/staff/audit', color: 'bg-gray-100 text-gray-600' },
            ]
        }
    ];

    return (
        <div className="p-4 pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {sections.map((section) => (
                <section key={section.title}>
                    <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider ml-1">
                        {section.title}
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                        {section.items.map((item) => (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={`p-4 rounded-2xl ${item.color} shadow-sm group-active:scale-95 transition-transform`}>
                                    <item.icon size={24} />
                                </div>
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            ))}

            <section className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 p-4 text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl font-medium active:scale-95 transition-transform"
                >
                    <LogOut size={20} />
                    Sair do Sistema
                </button>
            </section>
        </div>
    );
};
