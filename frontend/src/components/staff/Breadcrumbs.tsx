import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const routeConfig: { [key: string]: string } = {
    'staff': 'Dashboard',
    'dashboard': 'Dashboard',
    'quotes': 'Orçamentos',
    'customers': 'Clientes',
    'services': 'Serviços',
    'products': 'Produtos',
    'billing': 'Faturamento',
    'management': 'Gestão',
    'reports': 'Relatórios',
    'users': 'Usuários',
    'notifications': 'Notificações',
    'profile': 'Perfil',
    'support': 'Suporte',
    'transport': 'Transporte',
    'transport-config': 'Configuração de Transporte',
    'kanban': 'Quadro de Serviços',
    'agenda-spa': 'Agenda SPA',
    'agenda-log': 'Agenda Logística',
    'marketing': 'Marketing Hub',
};

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex mb-3 overflow-x-auto pb-2 scrollbar-none">
            <ol className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest min-w-max">
                <li>
                    <Link
                        to="/staff/dashboard"
                        className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        <Home size={14} />
                        7Pet
                    </Link>
                </li>

                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const label = routeConfig[value] || value;

                    // Skip 'staff' if it's the first one and not last
                    if (value === 'staff' && !last) return null;

                    return (
                        <motion.li
                            key={to}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center space-x-2"
                        >
                            <ChevronRight size={14} className="text-gray-300" />
                            {last ? (
                                <span className="text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                                    {label}
                                </span>
                            ) : (
                                <Link
                                    to={to}
                                    className="text-gray-400 hover:text-secondary hover:bg-white px-3 py-1.5 rounded-lg transition-all"
                                >
                                    {label}
                                </Link>
                            )}
                        </motion.li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
