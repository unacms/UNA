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

    return (
        <img {...props} src={appSetting('config', 'native_app_images_url') + '/svg/' + src}/>
    );
} 
