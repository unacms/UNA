import { useLayoutSettings } from 'app/context/layout-settings';
import { appSetting } from 'app/lib/util'

export const useDensitySwitcher = () => {

    const densityOptions = appSetting('layout', 'avaliable_density');

    const { layoutSettings } = useLayoutSettings();
    const currentDensity = densityOptions.find(d => d.id === layoutSettings?.density);

    return {
        currentDensity,
        densityOptions,
    };
}; 