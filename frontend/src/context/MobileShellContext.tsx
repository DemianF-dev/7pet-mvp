import { createContext, useContext, ReactNode } from 'react';

/**
 * Context to communicate mobile shell state to child components.
 * When inMobileShell is true, components like StaffSidebar should hide.
 */
interface MobileShellContextValue {
    inMobileShell: boolean;
}

const MobileShellContext = createContext<MobileShellContextValue>({ inMobileShell: false });

export function MobileShellProvider({ children }: { children: ReactNode }) {
    return (
        <MobileShellContext.Provider value={{ inMobileShell: true }}>
            {children}
        </MobileShellContext.Provider>
    );
}

export function useInMobileShell(): boolean {
    const context = useContext(MobileShellContext);
    return context.inMobileShell;
}
