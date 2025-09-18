import { useState, useEffect, useMemo } from 'react';
import { formatDistance } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { formatDate } from 'app/lib/util'
import { Platform } from 'react-native'

export default function ElementTime(props) {
    const { t } = useTranslation();
    const [date, setDate] = useState(new Date());

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const formattedTime = useMemo(() => {
        let s = props.ts;
        
        if (!isNaN(props.ts)) {
            const d = new Date(props.ts * 1000);
            const now = new Date();
            const diffDays = Math.abs(now - d) / (1000 * 60 * 60 * 24);

            if (diffDays < 1) {
                s = formatDistance(d, date, { addSuffix: false })
                    .replace(/\s+/g, '')
                    .replace('about', '')
                    .replace('lessthanaminute', t('Now'))
                    .replace('hours', t('h'))
                    .replace('hour', t('h'))
                    .replace('minutes', t('m'))
                    .replace('minute', t('m'))
                    .trim();
            } else {
                s = formatDate(d, t).trim();
            }

            if (props.format === 'datetime') {
                s = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            }
        }
        return s;
    }, [props.ts, date, t, props.format]);

    const { stylesName, addClassName, title, accessibilityLabel, variant = 'default', ...otherProps } = props;

    const mergedProps = {
        ...(Platform.OS === 'web' ? { title: title || '' } : {}),
        accessibilityLabel: accessibilityLabel || '',
    };

    const defaultClasses =
        variant === 'link'
            ? ' font-medium text-xs leading-5 text-muted-foreground web:group-hover:text-accent '
            : ' font-medium text-xs leading-5 text-muted-foreground ';

    return (
        <Text
            className={stylesName || `${defaultClasses}${addClassName || ''}`}
            {...mergedProps}
            {...otherProps}
        >
            {formattedTime}
        </Text>
    );
}
