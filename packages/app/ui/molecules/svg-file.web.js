import { appSetting } from 'app/lib/util';
import { useColorScheme } from 'react-native';

export default function ({src_web, src_dark, src_default, ...props}) {
    const scheme = useColorScheme();
    
    // Prioritize dark/light mode switching like native version
    // Fall back to src_web for backward compatibility
    let src;
    if (src_dark && src_default) {
        // Use dark/light mode switching (preferred approach)
        src = scheme === 'dark' ? src_dark : src_default;
    } else if (src_web) {
        // Backward compatibility fallback
        src = src_web;
    } else {
        // Final fallback - use whatever is available
        src = src_default || src_dark;
    }

    if (!src) {
        console.warn('SvgFile: No valid src provided');
        return null;
    }

    // For web, always use the current domain to support preview deployments
    const baseUrl = typeof window !== 'undefined' 
        ? `${window.location.protocol}//${window.location.host}`
        : appSetting('config', 'native_app_images_url');

    return (
        <img {...props} src={baseUrl + '/svg/' + src}/>
    );
} 
