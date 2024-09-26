'use client'

import { IconSet } from 'app/icons';
import { appSetting } from 'app/lib/util'
import { Theme } from 'app/design/theme';
import { useMemo } from 'react';

export function Icon(props) {
    const { colors } = Theme();

    let { icon, className, color, size, ...rest } = props
    icon = icon.replace('far ', '').replace('fa-','').replace('fa ', '')
    let a = icon.split(' ')[0];
    let  ic = a;

    const processedIcon = useMemo(() => {
        return icon.replace('far ', '').replace('fa-', '').replace('fa ', '').split(' ')[0];
    }, [icon]);


    const IconComponent = useMemo(() => IconSet[processedIcon], [processedIcon]);

    if (!IconComponent) {
        console.log('Icon not found:', processedIcon);
        return null; // Возвращаем null, а не пустой элемент
    }

    return (
        <IconComponent 
            color={color || colors.default} 
            size={size} 
            className={className} 
            {...rest} 
        />
    );
}

