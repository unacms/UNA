import { SvgXml } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util';
import { ThemeName } from 'app/design/theme';

export default function ({ src_dark, src_default, width, height }) {
    const [xml, setXml] = useState(null);
    const [error, setError] = useState(null);
    const theme = ThemeName();
    const src = theme === 'dark' && src_dark ? src_dark : src_default;

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
                console.log('SvgFile: Response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.text();
            })
            .then(xmlText => {
                if (ignoreResponse) return;
                console.log('SvgFile: Successfully loaded SVG, length:', xmlText.length);
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
        return <Text className="text-red-500 text-xs">SVG Error: {error}</Text>;
    }

    return xml ? <SvgXml key={src} xml={xml} width={width} height={height} /> : <Text className="text-gray-500 text-xs">Loading SVG...</Text>;
};