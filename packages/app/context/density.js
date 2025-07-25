import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageGet, storageSet } from 'app/lib/util';

const DensityContext = createContext();

export function DensityProvider({ children }) {
    const [density, setDensityState] = useState('default');

    // Load density from storage on mount
    useEffect(() => {
        const savedDensity = storageGet('ui:density', '', true);
        if (savedDensity && ['compact', 'default', 'relaxed'].includes(savedDensity)) {
            setDensityState(savedDensity);
        }
    }, []);

    // Function to update density and persist to storage
    const setDensity = (newDensity) => {
        if (['compact', 'default', 'relaxed'].includes(newDensity)) {
            setDensityState(newDensity);
            storageSet('ui:density', '', newDensity, true);
        }
    };

    return (
        <DensityContext.Provider value={{ density, setDensity }}>
            {children}
        </DensityContext.Provider>
    );
}

export function useDensity() {
    const context = useContext(DensityContext);
    if (!context) {
        throw new Error('useDensity must be used within a DensityProvider');
    }
    return context;
}

// Optional: Hook for components that want to provide a density prop or use global
export function useDensityOrDefault(densityProp) {
    const { density: globalDensity } = useDensity();
    return densityProp || globalDensity;
} 