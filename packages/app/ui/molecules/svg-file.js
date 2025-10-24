import { SvgXml } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util';
import { ThemeName } from 'app/design/theme';

export default function ({ src_dark, src_default, width, height }) {
    const [xml, setXml] = useState(null);
    const [error, setError] = useState(null);
    const theme = ThemeName();
    const src = theme === 'dark' ? src_dark : src_default;

    useEffect(() => {
        let url = src;
        if (!src.startsWith('http') && !src.startsWith('https')) {
            const baseUrl = appSetting('config', 'native_app_images_url');
            url = baseUrl + '/svg/' + src;
        }       
        
        fetch(url)
            .then(res => {
                console.log('SvgFile: Response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.text();
            })
            .then(xmlText => {
                console.log('SvgFile: Successfully loaded SVG, length:', xmlText.length);
                setXml(xmlText);
                setError(null);
            })
            .catch(err => {
                console.error('SvgFile: Error loading SVG:', err);
                console.error('SvgFile: Error details:', err.message);
                setError(`${err.message} (${url})`);
            });
    }, [src]);

    if (error) {
        return <Text className="text-red-500 text-xs">SVG Error: {error}</Text>;
    }

    return xml ? <SvgXml xml={xml} width={width} height={height} /> : <Text className="text-gray-500 text-xs">Loading SVG...</Text>;
};