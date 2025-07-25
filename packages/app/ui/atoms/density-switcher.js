import { useDensity } from 'app/context/density';

// Density configuration
export const densityOptions = [
    { key: 'compact', id: 'compact', name: 'compact', title: 'Compact' },
    { key: 'default', id: 'default', name: 'default', title: 'Default' },
    { key: 'relaxed', id: 'relaxed', name: 'relaxed', title: 'Relaxed' }
];

// Get icon for density mode
export const getDensityIcon = (currentDensity) => {
    switch (currentDensity) {
        case 'compact': return 'Minus';
        case 'relaxed': return 'Plus';
        default: return 'Circle';
    }
};

// Custom hook for density switching logic
export const useDensitySwitcher = () => {
    const { density, setDensity } = useDensity();
    
    const currentOption = densityOptions.find(d => d.key === density) || densityOptions[1];
    const icon = getDensityIcon(density);
    
    const handleDensityChange = (option) => {
        setDensity(option.id);
    };
    
    return {
        density,
        currentOption,
        icon,
        densityOptions,
        handleDensityChange
    };
}; 