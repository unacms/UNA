import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { formatDate } from 'app/lib/util'
import { Platform } from 'react-native'
import { View } from 'app/design/view';
export default function ElementTime(props) {
    const { t } = useTranslation();
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
            return formatDate(d, t, {showTime: true})

        return formatDate(d, t, {inPast: true})
       
    }, [props.ts, date, t, props.format]);

    const { stylesName, addClassName, title, accessibilityLabel, variant = 'default', ...otherProps } = props;

    const mergedProps = {
        ...(Platform.OS === 'web' ? { title: title || '' } : {}),
        accessibilityLabel: accessibilityLabel || '',
    };

    const defaultClasses =
        variant === 'link'
            ? '  text-accent-foreground '
            : '  text-muted-foreground ';

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
