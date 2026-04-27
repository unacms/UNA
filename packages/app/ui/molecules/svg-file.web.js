import { appSetting } from 'app/lib/util';
import { useThemeName } from 'app/design/theme';
import { getBaseUrl } from 'app/config';

export default function ({src_web, src_dark, src_default, ...props}) {
    const theme = useThemeName();
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
        <img
            key={src}
            {...props}
            src={baseUrl + '/svg/' + src}
        />
    );
} 
