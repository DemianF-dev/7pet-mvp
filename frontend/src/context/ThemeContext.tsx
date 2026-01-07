import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

interface ThemeProviderState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const initialState: ThemeProviderState = {
    theme: 'system',
    setTheme: () => null,
};

const ThemeContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = '7pet-theme',
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    );

    useEffect(() => {
        const root = window.document.documentElement;

        // Clean up previous classes strictly
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Unified handler that works with both Event and QueryList objects
            // They both have a 'matches' property
            const applySystemTheme = (e: { matches: boolean }) => {
                root.classList.remove('light', 'dark');
                if (e.matches) {
                    root.classList.add('dark');
                } else {
                    root.classList.add('light');
                }
            };

            // Apply initially based on current state
            applySystemTheme(mediaQuery);

            // Listener wrapper to ensure correct `this` context/argument type if needed
            const listener = (e: MediaQueryListEvent) => applySystemTheme(e);

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', listener);
                return () => mediaQuery.removeEventListener('change', listener);
            }
            // Legacy fallback (Safari < 14, etc.)
            else if (mediaQuery.addListener) {
                // @ts-ignore - Deprecated method support but necessary for older devices
                mediaQuery.addListener(listener);
                // @ts-ignore
                return () => mediaQuery.removeListener(listener);
            }
        } else {
            // Manual theme (light or dark)
            root.classList.add(theme);
        }
    }, [theme]);

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme);
            setTheme(theme);
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
