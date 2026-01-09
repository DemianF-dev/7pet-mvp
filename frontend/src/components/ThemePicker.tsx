import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Check, Sun, Moon, Zap, Waves, TreePine, Candy, Monitor, Apple } from 'lucide-react';

interface ThemeOption {
    id: string;
    label: string;
    icon: React.ReactNode;
    previewColors: {
        bg: string;
        accent: string;
        text: string;
    };
}

const themes: ThemeOption[] = [
    {
        id: 'system',
        label: 'Sistema',
        icon: <Monitor size={18} />,
        previewColors: { bg: '#f3f4f6', accent: '#3b82f6', text: '#1f2937' },
    },
    {
        id: 'apple-light',
        label: 'Apple Light',
        icon: <Apple size={18} />,
        previewColors: { bg: '#FFFFFF', accent: '#007AFF', text: '#000000' },
    },
    {
        id: 'apple-dark',
        label: 'Apple Dark',
        icon: <Apple size={18} />,
        previewColors: { bg: '#000000', accent: '#0A84FF', text: '#FFFFFF' },
    },
    {
        id: 'default-light',
        label: 'Minimal Light',
        icon: <Sun size={18} />,
        previewColors: { bg: '#ffffff', accent: '#00A852', text: '#1a202c' },
    },
    {
        id: 'default-dark',
        label: 'Minimal Dark',
        icon: <Moon size={18} />,
        previewColors: { bg: '#111827', accent: '#34d399', text: '#f9fafb' },
    },
    {
        id: 'cyberpunk-neon',
        label: 'Cyberpunk',
        icon: <Zap size={18} />,
        previewColors: { bg: '#050508', accent: '#00ffea', text: '#e0e0ff' },
    },
    {
        id: 'ocean-calm',
        label: 'Ocean Calm',
        icon: <Waves size={18} />,
        previewColors: { bg: '#f0f9ff', accent: '#0ea5e9', text: '#0c4a6e' },
    },
    {
        id: 'forest-nature',
        label: 'Forest',
        icon: <TreePine size={18} />,
        previewColors: { bg: '#fcfbf7', accent: '#4a7c59', text: '#2c3e2e' },
    },
    {
        id: 'candy-pop',
        label: 'Candy Pop',
        icon: <Candy size={18} />,
        previewColors: { bg: '#fff5f7', accent: '#ec4899', text: '#831843' },
    },
];

import { useHaptic } from '../hooks/useHaptic';

export function ThemePicker() {
    const { theme, setTheme } = useTheme();
    const { trigger } = useHaptic();

    return (
        <div className="space-y-3">
            <h3
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
            >
                Escolha o Tema
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {themes.map((t) => {
                    const isActive = theme === t.id;
                    return (
                        <button
                            key={t.id}
                            onClick={() => {
                                setTheme(t.id as any);
                                trigger('light');
                            }}
                            className="relative p-3 rounded-lg border transition-all duration-200 text-left active:scale-95"
                            style={{
                                backgroundColor: isActive ? 'var(--color-accent-primary)' : 'var(--color-bg-surface)',
                                borderColor: isActive ? 'var(--color-accent-primary)' : 'var(--color-border)',
                                color: isActive ? '#ffffff' : 'var(--color-text-primary)',
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {t.icon}
                                <span className="text-sm font-medium truncate">{t.label}</span>
                                {isActive && (
                                    <Check size={14} className="ml-auto" />
                                )}
                            </div>
                            {/* Color Preview */}
                            <div className="flex gap-1">
                                <span
                                    className="w-4 h-4 rounded-full border"
                                    style={{
                                        backgroundColor: t.previewColors.bg,
                                        borderColor: 'rgba(0,0,0,0.1)'
                                    }}
                                    title="Background"
                                />
                                <span
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: t.previewColors.accent }}
                                    title="Accent"
                                />
                                <span
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: t.previewColors.text }}
                                    title="Text"
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ThemePicker;
