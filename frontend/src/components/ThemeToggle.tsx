import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

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
