import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Platform } from 'react-native'
import { StyleSheet, PixelRatio } from 'react-native';
import { appSetting } from 'app/lib/util';
import { useMemo } from 'react';

export const SolitoImageStyled = styled(SolitoImage)

function extractStyleWidth(style) {
    if (style) {
        const { width } = StyleSheet.flatten(style);

        if (typeof width === 'number') {
            return width;
        }
    }
}

const config = {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
};
    
const SIZES = [...config.imageSizes, ...config.deviceSizes];
    
function normalizeWidth(width) {
    const calculatedSize = PixelRatio.getPixelSizeForLayoutSize(width);
    const matchingIndex = SIZES.findIndex((size) => size >= calculatedSize);
    
    if (matchingIndex === -1) {
        return SIZES[SIZES.length - 1];
    } else if (matchingIndex === 0) {
        return SIZES[0];
    } else {
        const left = SIZES[matchingIndex - 1];
        const right = SIZES[matchingIndex];

        if ((left + right) / 2 > width) {
            return left;
        }

        return right;
    }
}

export default function ElementImage(props) {
    let {width, height, alt, src, style, source, nobg, ...rest} = props; // remove width & height

    const bg_image = appSetting('layout','background_cover');
    
    if (Platform.OS != 'web' || !bg_image)
        style={ backgroundColor: appSetting('layout','background_cover_color')}
    else
        style={ backgroundImage: bg_image}
    
    if (!src)
        src = '/spacer.png'

    if (src.includes('.svg') && Platform.OS != 'web')
        src = src.replace('.svg', '.png')

    if (!alt)
        alt = "";        

    if (rest.view == "cover"){
        rest.fill = 'fill'
        if (Platform.OS != 'web')
            rest.contentFit="cover" 
    }
    else{     
        rest.height = props.pref_height ? props.pref_height : height;
        rest.width = props.pref_width ? props.pref_width : width;
       /* if (Platform.OS != 'web'){
                rest.height = 'auto';
        }*/
    }
    
    let srcImIn = src.includes('/_next/image?url=') || src.includes('data:') ? src : '/_next/image?url=' + src + "&w=" + 32 + "&q=75"
    if (Platform.OS != 'web'){
        const imageWidth = extractStyleWidth(style) || width;
        let w = normalizeWidth(imageWidth);
        if (w > 256)
            w = 640;

        src = appSetting('config', 'native_app_images_url') +    "/_next/image?url=" + src + "&w=" + w + "&q=75"
        srcImIn = src;
    }
    
    
    
    if (nobg == true){
        style={}
    }

    return useMemo(() => (
        <SolitoImageStyled 
            {...rest} 
            src={src} 
            alt={alt} 
            style={style} 
        />
    ), [rest, src, alt, style]);
}
