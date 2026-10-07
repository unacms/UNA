import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { formatDate, useDateLocaleTag } from 'app/lib/util'
import { Platform } from 'react-native'

type TimeProps = {
    /** Unix timestamp, seconds. */
    ts: number
    format?: 'datetime' | string
    /** Replaces the default classes entirely. */
    stylesName?: string
    addClassName?: string
    title?: string
    accessibilityLabel?: string
    variant?: 'default' | 'link'
    [key: string]: unknown
}

export default function ElementTime(props: TimeProps) {
    const { t } = useTranslation();
    const localeTag = useDateLocaleTag();
    const [date, setDate] = useState(new Date());

    /*useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);*/

    const formattedTime = useMemo(() => {
        const d = new Date(props.ts * 1000);
        if (props.format === 'datetime')
            return formatDate(d, t, { showTime: true, locale: localeTag })

        return formatDate(d, t, { inPast: true, locale: localeTag })
       
    }, [props.ts, date, t, props.format, localeTag]);

    const { stylesName, addClassName, title, accessibilityLabel, variant = 'default', ...otherProps } = props;

    const mergedProps = {
        ...(Platform.OS === 'web' ? { title: title || '' } : {}),
        accessibilityLabel: accessibilityLabel || '',
    };

    const defaultClasses =
        variant === 'link'
            ? ' text-accent-foreground '
            : '  ';

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
