import { SvgXml } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util';
import { useColorScheme, Platform } from 'react-native'

export default function ({ src_dark, src_default, width, height }) {
    const [xml, setXml] = useState(null);
    const [error, setError] = useState(null);

    const scheme = useColorScheme();
    const src = scheme === 'dark' ? src_dark : src_default;

    useEffect(() => {
        // For web, always use the current browser location to ensure correct domain
        let baseUrl;
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
            // Always use current domain for web deployments (development, preview, and production)
            baseUrl = `${window.location.protocol}//${window.location.host}`;
        } else {
            // Fallback to app settings for native
            baseUrl = appSetting('config', 'native_app_images_url');
        }
        
        const url = baseUrl + '/svg/' + src;
        
        console.log('SvgFile Debug Info:');
        console.log('- Platform:', Platform.OS);
        console.log('- Base URL (dynamic):', baseUrl);
        console.log('- Base URL (from settings):', appSetting('config', 'native_app_images_url'));
        console.log('- Selected src:', src);
        console.log('- Full URL:', url);
        console.log('- Color scheme:', scheme);
        if (typeof window !== 'undefined' && window.location) {
            console.log('- window.location.host:', window.location.host);
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