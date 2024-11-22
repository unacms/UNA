'use client'

import { useEffect, useState, memo, useMemo } from 'react';
import { storageGet, storageSet } from 'app/lib/util'
import SvgIcons from  'app/icons-svg';

export const Icon = memo(function Icon(props) {
    const { icon, className, width, height, size, ...rest } = props;

    // Мемоизируем ключ, чтобы он не пересчитывался при каждом рендере
    const key = useMemo(() => `${icon}-${width || ''}-${height || ''}-${size || ''}`, [icon, width, height, size]);

    // Инициализируем состояние с иконкой из локального хранилища
    const [currentIcon, setCurrentIcon] = useState(() => storageGet(`icon-${key}`, '', true));
    const InlineIcon = SvgIcons[icon];

    useEffect(() => {
        // Функция для получения иконки с сервера
        const fetchIcon = async () => {
            let url = `/api/icon?icon=${icon}`;
            if (width) url += `&width=${width}`;
            if (height) url += `&height=${height}`;
            if (size) url += `&size=${size}`;

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
       
        if (!InlineIcon){
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

        return null; // Возвращаем null, если иконка не загружена
        
    }

    return (
        <div className={className} {...rest} dangerouslySetInnerHTML={{ __html: currentIcon }} />
    );
});

