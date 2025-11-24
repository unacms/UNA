'use client'

import { useEffect, useState, memo, useMemo } from 'react';
import { storageGet, storageSet, findIconFromRemote, appSetting } from 'app/lib/util'
import SvgIcons from  'app/icons-svg';

export const Icon = memo(function Icon(props) {
    const { icon: origIcon, className, width, height, color, size, strokeWidth, fill, ...rest } = props;
    const isXmlSvg = origIcon?.startsWith('<svg');
    const icon = findIconFromRemote(origIcon);
    const _strokeWidth = strokeWidth || appSetting('layout', 'default_icon_stroke_width');
//return <>{origIcon}</>
    
    // Мемоизируем ключ, чтобы он не пересчитывался при каждом рендере
    const key = useMemo(() => `${icon}-${width || ''}-${height || ''}-${size || ''}-${fill || ''}`, [icon, width, height, size, strokeWidth, fill]);

    // Инициализируем состояние с иконкой из локального хранилища, чтобы избежать первого пустого рендера
    const [currentIcon, setCurrentIcon] = useState(() => storageGet(`icon-${key}`, '', true));
    const InlineIcon = SvgIcons[icon];



    useEffect(() => {
        // Функция для получения иконки с сервера
        const fetchIcon = async () => {
            let url = `/api/api.icon?icon=${icon}`;
            if (width) url += `&width=${width}`;
            if (height) url += `&height=${height}`;
            if (size) url += `&size=${size}`;
            if (fill) url += `&fill=${fill}`;
            
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
       
        if (!InlineIcon && !isXmlSvg){
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
        if (isXmlSvg){
            const result = origIcon
                .replace(/\swidth="[^"]*"/i, '')
                .replace(/\sheight="[^"]*"/i, '')
                .replace(
                /<svg(\s[^>]*)?>/i,
                `<svg$1 width="${width || size}" height="${height || size}">`
            );
            return <span style={{color:color, display: 'flex'}} className={className} {...rest} dangerouslySetInnerHTML={{ __html: result }} />;
        }
        return null; // Возвращаем null, если иконка не загружена
        
    }

    return (
        <span style={{color:color, display: 'flex'}}  className={className} {...rest} dangerouslySetInnerHTML={{ __html: currentIcon }} />
    );
});

