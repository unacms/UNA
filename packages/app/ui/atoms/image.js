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
    let {width, height,  alt = "", src = '/spacer.png', style, source, nobg, ...rest} = props; // remove width & height

    if (null === src)
        src = '/spacer.png';

    const bg_image = appSetting('layout','background_cover');
    
    style = useMemo(() => {
        if (nobg) return {};

        if (Platform.OS !== 'web' || !bg_image) {
            return { ...style, backgroundColor: appSetting('layout', 'background_cover_color') };
        } else {
            return { ...style, backgroundImage: bg_image };
        }
    }, [nobg, style, bg_image]);
    
    src = useMemo(() => {
        let updatedSrc = src;

        if (src.includes('.svg') && Platform.OS !== 'web') {
            updatedSrc = updatedSrc.replace('.svg', '.png');
        }

        

        if (Platform.OS !== 'web') {
            const imageWidth = extractStyleWidth(style) || width;
        let w = normalizeWidth(imageWidth);
        if (w > 256)
            w = 640;

        updatedSrc = appSetting('config', 'native_app_images_url') +    "/_next/image?url=" + src + "&w=" + w + "&q=75"
        }

        return updatedSrc;
    }, [src, style, width]);

     
    rest = useMemo(() => {
        const updatedRest = { ...rest };

        if (rest.view === "cover") {
            updatedRest.fill = 'fill';
            if (Platform.OS !== 'web') {
                updatedRest.contentFit = "cover";
            }
        } else {
            updatedRest.height = rest.pref_height || height;
            updatedRest.width = rest.pref_width || width;
        }

        return updatedRest;
    }, [rest.view, height, width, rest.pref_height, rest.pref_width, rest]);


    return useMemo(() => (
        <SolitoImageStyled 
            {...rest} 
            src={src} 
            alt={alt} 
            style={style} 
        />
    ), [rest, src, alt, style]);
}
