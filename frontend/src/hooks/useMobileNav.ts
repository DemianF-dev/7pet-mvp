import { useState, useEffect } from 'react';
import {
    Home,
    Calendar,
    Users,
    MessageSquare,
    Gamepad2,
    Layout,
    FileText,
    Truck,
    Menu,
    LucideIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface NavTabConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    path: string;
}

export const ALL_MOBILE_TABS: NavTabConfig[] = [
    { id: 'home', label: 'Home', icon: Home, path: '/staff/dashboard' },
    { id: 'agenda-spa', label: 'Agenda SPA', icon: Calendar, path: '/staff/agenda-spa' },
    { id: 'agenda-log', label: 'Agenda LOG', icon: Truck, path: '/staff/agenda-log' },
    { id: 'clientes', label: 'Clientes', icon: Users, path: '/staff/customers' },
    { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/staff/chat' },
    { id: 'pausa', label: 'Pausa', icon: Gamepad2, path: '/pausa' },
    { id: 'quotes', label: 'Orçamentos', icon: FileText, path: '/staff/quotes' },
];

const STORAGE_KEY = '7pet-mobile-pinned-tabs';
const DEFAULT_PINNED = ['home', 'agenda-spa', 'clientes', 'chat'];

export function useMobileNav() {
    const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_PINNED;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pinnedIds));
    }, [pinnedIds]);

    const togglePin = (id: string) => {
        setPinnedIds(prev => {
            if (prev.includes(id)) {
                // Don't allow less than 2 tabs
                if (prev.length <= 2) {
                    toast.error('Mínimo de 2 abas necessárias');
                    return prev;
                }
                return prev.filter(i => i !== id);
            } else {
                // Don't allow more than 6 tabs
                if (prev.length >= 6) {
                    toast.error('Máximo de 6 abas atingido');
                    return prev;
                }
                return [...prev, id];
            }
        });
    };

    const pinnedTabs = ALL_MOBILE_TABS.filter(t => pinnedIds.includes(t.id));

    // Mandatory Menu tab
    const finalTabs = [
        ...pinnedTabs,
        { id: 'menu', label: 'Menu', icon: Menu, path: '/staff/menu' }
    ];

    return {
        pinnedIds,
        togglePin,
        navTabs: finalTabs,
        availableTabs: ALL_MOBILE_TABS
    };
}
