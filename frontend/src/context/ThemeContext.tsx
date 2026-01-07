import React, { createContext, useContext, useEffect, useState } from 'react';

// Define the available themes as a union type
export type Theme =
    | 'default-light'
    | 'default-dark'
    | 'cyberpunk-neon'
    | 'ocean-calm'
    | 'forest-nature'
    | 'candy-pop'
    | 'system';

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

interface ThemeProviderState {
    theme: Theme;
    activeTheme: string; // The resolved theme (e.g., 'default-dark' when system is dark)
    setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
    theme: 'system',
    activeTheme: 'default-light',
    setTheme: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = '7pet-theme',
    ...props
}: ThemeProviderProps) {
    // 1. Initialize state from localStorage or default
    const [theme, setThemeState] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    const [activeTheme, setActiveTheme] = useState<string>('default-light');

    useEffect(() => {
        const root = window.document.documentElement;
        // Clean up legacy classes if strictly needed, though dataset overrides mostly
        root.classList.remove('light', 'dark');

        let resolvedTheme = theme;

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            const resolveSystemTheme = () => {
                const newTheme = mediaQuery.matches ? 'default-dark' : 'default-light';
                root.setAttribute('data-theme', newTheme);
                // Also toggle .dark class for any legacy Tailwind 'dark:' utilities
                if (newTheme === 'default-dark') {
                    root.classList.add('dark');
                    root.classList.remove('light');
                } else {
                    root.classList.remove('dark');
                    root.classList.add('light');
                }
                setActiveTheme(newTheme);
            };

            resolveSystemTheme();

            const listener = () => resolveSystemTheme();

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', listener);
                return () => mediaQuery.removeEventListener('change', listener);
            } else if (mediaQuery.addListener) {
                // @ts-ignore
                mediaQuery.addListener(listener);
                // @ts-ignore
                return () => mediaQuery.removeListener(listener);
            }
        } else {
            // Manual theme selection
            root.setAttribute('data-theme', theme);

            // Set legacy classes for 'dark:' utility support
            // We assume 'default-dark' and 'cyberpunk-neon' are "dark" themes
            const isDarkTheme = theme === 'default-dark' || theme === 'cyberpunk-neon';

            if (isDarkTheme) {
                root.classList.add('dark');
                root.classList.remove('light');
            } else {
                root.classList.remove('dark');
                root.classList.add('light');
            }
            setActiveTheme(theme);
        }
    }, [theme]);

    const value = {
        theme,
        activeTheme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme);
            setThemeState(newTheme);
        },
    };

    return (
        <ThemeContext.Provider {...props} value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);

    if (context === undefined)
        throw new Error('useTheme must be used within a ThemeProvider');

    return context;
};
