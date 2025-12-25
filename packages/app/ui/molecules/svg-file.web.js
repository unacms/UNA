import { appSetting, getBaseUrl } from 'app/lib/util';
import { ThemeName } from 'app/design/theme';

export default function ({src_web, src_dark, src_default, ...props}) {
    const theme = ThemeName();
    const src = theme === 'dark' && src_dark ? src_dark : src_default; 

    if (!src) {
        console.warn('SvgFile: No valid src provided');
        return null;
    }

    // For web, always use the current domain to support preview deployments
    const baseUrl = typeof window !== 'undefined' 
        ? getBaseUrl()
        : appSetting('config', 'native_app_images_url');

    return (
        <img {...props} src={baseUrl + '/svg/' + src}/>
    );
} 
