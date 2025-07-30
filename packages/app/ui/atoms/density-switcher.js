import { useLayoutSettings } from 'app/context/layout-settings';
// Custom hook for density switching logic
export const useDensitySwitcher = () => {

    const densityOptions = [
        { id: 'compact', title: 'Compact', icon: 'Minus' },
        { id: 'default', title: 'Default', icon: 'Circle' },
        { id: 'relaxed', title: 'Relaxed', icon: 'Plus' }
    ];

    const { layoutSettings } = useLayoutSettings();
    const currentDensity = densityOptions.find(d => d.id === layoutSettings?.density);


    return {
        currentDensity,
        densityOptions,
    };
}; 