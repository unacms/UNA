import React from 'react';
import { View } from 'app/design/view';
import { Button } from 'app/design/controls';
import { useDensity } from 'app/context/density';
import { useTranslation } from 'react-i18next';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';

export default function DensitySwitcher({ className = '' }) {
    const { t } = useTranslation();
    const { density, setDensity } = useDensity();

    const densityOptions = [
        { key: 'compact', id: 'compact', name: 'compact', title: 'Compact' },
        { key: 'default', id: 'default', name: 'default', title: 'Default' },
        { key: 'relaxed', id: 'relaxed', name: 'relaxed', title: 'Relaxed' }
    ];

    const getDensityIcon = (currentDensity) => {
        switch (currentDensity) {
            case 'compact': return 'Minus';
            case 'relaxed': return 'Plus';
            default: return 'Circle';
        }
    };

    return (
        <View className={`mb-2 ${className}`}>
            <DropdownMenu 
                items={densityOptions}
                onSelect={(oItem) => { setDensity(oItem.id) }}
            >
                <Button
                    variant="secondary"
                    title={densityOptions.find(d => d.key === density)?.title || 'Default'}
                    startDecorator={getDensityIcon(density)}
                    fullWidth
                    size="sm"
                    align="left"
                />
            </DropdownMenu>
        </View>
    );
} 