'use client'

import { useEffect, useState, memo, useMemo } from 'react';
import { storageGet, storageSet, findIconFromRemote, appSetting } from 'app/lib/util'
import SvgIcons from  'app/icons-svg';
import { IconSet } from 'app/icons';

export const Icon = memo(function Icon(props) {
    const { icon: origIcon, className, width, height, color, size, strokeWidth, ...rest } = props;
    const isXmlSvg = origIcon?.startsWith('<svg');
    const icon = findIconFromRemote(origIcon);
    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
//return <>{origIcon}</>
    
    // Мемоизируем ключ, чтобы он не пересчитывался при каждом рендере
    const key = useMemo(() => `${icon}-${width || ''}-${height || ''}-${size || ''}`, [icon, width, height, size, strokeWidth]);

    // Инициализируем состояние с иконкой из локального хранилища
    const [currentIcon, setCurrentIcon] = useState(() => storageGet(`icon-${key}`, '', true));
    const InlineIcon = SvgIcons[icon];
    const LucideIcon = IconSet[icon];



    useEffect(() => {
        // Функция для получения иконки с сервера
        const fetchIcon = async () => {
            let url = `/api/api.icon?icon=${icon}`;
            if (width) url += `&width=${width}`;
            if (height) url += `&height=${height}`;
            if (size) url += `&size=${size}`;
            if (_strokeWidth) url += `&strokeWidth=${_strokeWidth}`;
            try {
                const response = await fetch(url);
                const data = await response.json();

                // Обновляем состояние иконки и сохраняем в локальное хранилище
                setCurrentIcon(data.icon);
                storageSet(`icon-${key}`, '', data.icon, true);
            } catch (error) {
                console.error('Ошибка загрузки иконки:', error);
            }
        };

        // Проверяем, есть ли иконка в локальном хранилище, и вызываем `fetchIcon`, если её нет
        // Skip fetching if it's a Lucide icon or custom SVG icon
        if (!InlineIcon && !LucideIcon && !isXmlSvg){
            const cachedIcon = storageGet(`icon-${key}`, '', true);
            if (icon && !cachedIcon) {
                fetchIcon();
            } else if (cachedIcon) {
                setCurrentIcon(cachedIcon);
            }
        }

    }, [icon, key]); // Зависим только от иконки и ключа

    if (!currentIcon) {
        if (InlineIcon){
            return <InlineIcon width={width || size} height={height || size} />;
        }
        if (LucideIcon){
            return <LucideIcon size={size} color={color} className={className} {...rest} />;
        }
        if (isXmlSvg){
            const result = origIcon
                .replace(/\swidth="[^"]*"/i, '')
                .replace(/\sheight="[^"]*"/i, '')
                .replace(
                /<svg(\s[^>]*)?>/i,
                `<svg$1 width="${width || size}" height="${height || size}">`
            );
            return <div style={{color:color}} className={className} {...rest} dangerouslySetInnerHTML={{ __html: result }} />;
        }
        return null; // Возвращаем null, если иконка не загружена

    }

    return (
        <div style={{color:color}}  className={className} {...rest} dangerouslySetInnerHTML={{ __html: currentIcon }} />
    );
});

