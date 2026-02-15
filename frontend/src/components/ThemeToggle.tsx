import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
    variant?: 'default' | 'compact';
}

export default function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    if (variant === 'compact') {
        const nextTheme = theme === 'default-light' ? 'default-dark' : 'default-light';
        return (
            <button
                onClick={() => setTheme(nextTheme)}
                className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded-xl text-primary shadow-sm hover:scale-110 transition-all border border-border"
                title={theme === 'default-light' ? "Modo Escuro" : "Modo Claro"}
            >
                {theme === 'default-light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 p-1 bg-bg-secondary rounded-lg border border-border">
            <button
                onClick={() => setTheme('default-light')}
                className={`p-1.5 rounded-md transition-all ${theme === 'default-light' ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                title="Modo Claro"
            >
                <Sun size={16} />
            </button>
            <button
                onClick={() => setTheme('default-dark')}
                className={`p-1.5 rounded-md transition-all ${theme === 'default-dark' ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                title="Modo Escuro"
            >
                <Moon size={16} />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-all ${theme === 'system' ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
                title="Sistema"
            >
                <Monitor size={16} />
            </button>
        </div>
    );
}
