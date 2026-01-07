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

            // Function to apply the theme based on the query result
            const applySystemTheme = () => {
                const systemTheme = mediaQuery.matches ? 'dark' : 'light';

                // Ensure we remove both before adding correct one
                root.classList.remove('light', 'dark');
                root.classList.add(systemTheme);
            };

            // Apply initially
            applySystemTheme();

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', applySystemTheme);
                return () => mediaQuery.removeEventListener('change', applySystemTheme);
            }
            // Legacy fallback (Safari < 14, etc.)
            else if (mediaQuery.addListener) {
                // @ts-ignore - Deprecated method support
                mediaQuery.addListener(applySystemTheme);
                // @ts-ignore - Deprecated method support
                return () => mediaQuery.removeListener(applySystemTheme);
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
