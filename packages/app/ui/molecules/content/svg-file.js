import { SvgXml } from 'react-native-svg';
import { useEffect, useMemo, useState } from 'react';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util';
import { useTheme, useThemeValue } from 'app/design/theme';
import { useResolveClassNames } from 'uniwind';
import { useTranslation } from 'react-i18next';

export default function ({ src_dark, src_default, width, height, colorize = false, className = '', color, alt = '', accessibilityLabel, style, ...props }) {
    const [xml, setXml] = useState(null);
    const [error, setError] = useState(null);
    const { t } = useTranslation();
    const { colors } = useTheme();
    const resolvedClassStyle = useResolveClassNames(className || '');
    const resolvedColor = color || resolvedClassStyle?.color || colors.default;
    const src = useThemeValue(src_default, src_dark || src_default);
    const renderedXml = useMemo(() => {
        if (!xml) return null;
        if (!colorize || !resolvedColor) return xml;
        return xml.replace(/currentColor/g, resolvedColor);
    }, [colorize, resolvedColor, xml]);

    useEffect(() => {
        if (!src) {
            setXml(null);
            setError('No valid src provided');
            return;
        }

        const controller = new AbortController();
        let ignoreResponse = false;
        let url = src;
        if (!src.startsWith('http') && !src.startsWith('https')) {
            const baseUrl = appSetting('config', 'native_app_images_url');
            url = baseUrl + '/svg/' + src;
        }

        setXml(null);
        setError(null);

        fetch(url, { signal: controller.signal })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.text();
            })
            .then(xmlText => {
                if (ignoreResponse) return;
                setXml(xmlText);
                setError(null);
            })
            .catch(err => {
                if (ignoreResponse || err?.name === 'AbortError') return;
                console.error('SvgFile: Error loading SVG:', err);
                console.error('SvgFile: Error details:', err.message);
                setError(`${err.message} (${url})`);
            });

        return () => {
            ignoreResponse = true;
            controller.abort();
        };
    }, [src]);

    if (error) {
        return <Text className="text-red-500 text-xs">{t('SVG Error:')} {error}</Text>;
    }

    return renderedXml ? (
        <SvgXml
            key={`${src}-${resolvedColor || ''}`}
            xml={renderedXml}
            width={width}
            height={height}
            color={resolvedColor}
            accessibilityLabel={accessibilityLabel || alt || undefined}
            accessibilityRole={(alt || accessibilityLabel) ? 'image' : undefined}
            style={style}
            {...props}
        />
    ) : (
        <Text className="text-gray-500 text-xs">{t('Loading SVG...')}</Text>
    );
};