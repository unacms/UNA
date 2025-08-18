import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'app/design/typography';
import { formatDate } from 'app/lib/util'
import { Platform } from 'react-native'

// Shared minute ticker to avoid creating multiple intervals per Time instance
let tickerIntervalId = null;
let tickerSubscribers = new Set();
let tickerNow = Date.now();

function startMinuteTicker() {
    if (tickerIntervalId) return;
    tickerIntervalId = setInterval(() => {
        tickerNow = Date.now();
        tickerSubscribers.forEach((notify) => {
            try { notify(tickerNow); } catch (_) {}
        });
    }, 60000);
}

function subscribeToMinuteTicker(callback) {
    tickerSubscribers.add(callback);
    startMinuteTicker();
    return () => {
        tickerSubscribers.delete(callback);
        if (tickerSubscribers.size === 0 && tickerIntervalId) {
            clearInterval(tickerIntervalId);
            tickerIntervalId = null;
        }
    };
}

function normalizeToDate(timestamp) {
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === 'number') {
        const ms = timestamp > 1e12 ? timestamp : timestamp * 1000;
        return new Date(ms);
    }
    if (typeof timestamp === 'string') {
        const parsed = Date.parse(timestamp);
        if (!Number.isNaN(parsed)) return new Date(parsed);
    }
    return null;
}

function formatRelativeShort(dateObj, nowMs, t, absoluteFormatter, explicitFormat) {
    if (!dateObj) return '';
    if (explicitFormat === 'datetime') {
        return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    }

    const diffSeconds = Math.max(0, Math.floor((nowMs - dateObj.getTime()) / 1000));

    if (diffSeconds < 60) {
        return t('Now');
    }
    if (diffSeconds < 3600) {
        const mins = Math.floor(diffSeconds / 60);
        return `${mins}${t('m')}`;
    }
    if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours}${t('h')}`;
    }
    return absoluteFormatter(dateObj, t).trim();
}

export default function ElementTime(props) {
    const { t } = useTranslation();
    const [nowMs, setNowMs] = useState(tickerNow);

    useEffect(() => {
        return subscribeToMinuteTicker(setNowMs);
    }, []);

    const dateObj = useMemo(() => normalizeToDate(props.ts), [props.ts]);
    const fullDateTime = useMemo(() => (dateObj ? dateObj.toLocaleString() : ''), [dateObj]);

    const formattedTime = useMemo(() => {
        return formatRelativeShort(dateObj, nowMs, t, formatDate, props.format);
    }, [dateObj, nowMs, t, props.format]);

    const { stylesName, stylesNameAdd, title, accessibilityLabel, variant = 'default', ...otherProps } = props;

    const mergedProps = {
        ...(Platform.OS === 'web' ? { title: title || fullDateTime } : {}),
        accessibilityLabel: accessibilityLabel || fullDateTime,
    };

    const defaultClasses =
        variant === 'link'
            ? ' text-xs leading-5 font-semibold relative u-time-hitarea '
            : ' text-xs leading-5 font-semibold text-muted-foreground web:group-hover:text-accent-foreground ';

    return (
        <Text
            className={stylesName || `${defaultClasses}${stylesNameAdd || ''}`}
            {...mergedProps}
            {...otherProps}
        >
            {formattedTime}
        </Text>
    );
}
