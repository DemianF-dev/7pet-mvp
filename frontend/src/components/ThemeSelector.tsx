import React from 'react';
import { Check, Monitor, Moon, Sun, Palette } from 'lucide-react';
import { useTheme, Theme } from '../context/ThemeContext';

interface ThemeOption {
    id: Theme;
    label: string;
    icon: React.ReactNode;
    colorPreview: string; // CSS color string for a dot preview
}

export default function ThemeSelector() {
    const { theme, setTheme, activeTheme } = useTheme();

    const themes: ThemeOption[] = [
        { id: 'system', label: 'Sistema', icon: <Monitor size={14} />, colorPreview: '#9CA3AF' },
        { id: 'default-light', label: 'Claro (Padrão)', icon: <Sun size={14} />, colorPreview: '#F3F4F6' },
        { id: 'default-dark', label: 'Escuro (Padrão)', icon: <Moon size={14} />, colorPreview: '#1F2937' },
        { id: 'ocean-calm', label: 'Oceano Calmo', icon: <Palette size={14} />, colorPreview: '#0ea5e9' },
        { id: 'forest-nature', label: 'Floresta', icon: <Palette size={14} />, colorPreview: '#436e4f' },
        { id: 'candy-pop', label: 'Candy Pop', icon: <Palette size={14} />, colorPreview: '#ff69b4' },
        { id: 'cyberpunk-neon', label: 'Cyberpunk', icon: <Palette size={14} />, colorPreview: '#00ff9d' },
    ];

    return (
        <div className="w-full">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 px-1">
                Aparência
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {themes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`
                            relative flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-all
                            ${theme === t.id
                                ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                : 'bg-bg-secondary border-transparent hover:bg-bg-surface hover:shadow-sm text-text-secondary'
                            }
                        `}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center border border-black/5 dark:border-white/10"
                            style={{ backgroundColor: t.id === 'system' ? 'transparent' : t.colorPreview }}
                        >
                            {/* Icon overlay for system or checkmark if active */}
                            {t.id === 'system' ? t.icon : null}
                        </div>

                        <div className="flex-1 text-left">
                            <span className="block truncate">{t.label}</span>
                        </div>

                        {theme === t.id && (
                            <Check size={16} className="text-primary" />
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-4 px-1">
                <p className="text-xs text-text-muted">
                    Tema ativo: <span className="font-mono">{activeTheme}</span>
                </p>
            </div>
        </div>
    );
}
