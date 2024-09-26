'use client'

import { useEffect, useState, memo, useMemo } from 'react';
import { storageGet, storageSet } from 'app/lib/util'

export const Icon = memo(function Icon(props) {
    let { icon, className, width, height, size, ...rest } = props;

    // Мемоизируем ключ, чтобы он не пересчитывался при каждом рендере
    const key = useMemo(() => `${icon}-${width || ''}-${height || ''}-${size || ''}`, [icon, width, height, size]);

    // Инициализируем состояние с иконкой из локального хранилища
    const [currentIcon, setCurrentIcon] = useState(() => storageGet(`icon-${key}`, '', true));

    useEffect(() => {
        // Функция для получения иконки с сервера
        const fetchIcon = async () => {
            let url = `/api/api.icon?icon=${icon}`;
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
        const cachedIcon = storageGet(`icon-${key}`, '', true);
        if (icon && !cachedIcon) {
            fetchIcon();
        } else if (cachedIcon) {
            setCurrentIcon(cachedIcon);
        }
    }, [icon, key]); // Зависим только от иконки и ключа

    if (!currentIcon) return null; // Возвращаем null, если иконка не загружена

    // Отображаем иконку
    return (
        <div className={className} {...rest} dangerouslySetInnerHTML={{ __html: currentIcon }} />
    );
});

