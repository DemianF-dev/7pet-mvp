import React, { createContext, useContext, useMemo } from 'react';
import { Services, createServices } from '../services';

const ServicesContext = createContext<Services | null>(null);

export const useServices = () => {
    const context = useContext(ServicesContext);
    if (!context) {
        throw new Error('useServices must be used within a ServicesProvider');
    }
    return context;
};

export const ServicesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const services = useMemo(() => createServices(), []);

    return (
        <ServicesContext.Provider value={services}>
            {children}
        </ServicesContext.Provider>
    );
};
