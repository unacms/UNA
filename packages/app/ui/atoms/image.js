import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Platform } from 'react-native'
import { StyleSheet, PixelRatio } from 'react-native';
import { env } from 'app/lib/env'

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

    style={
        backgroundImage: `
        linear-gradient(
            0deg,
            rgba(118, 142, 255, 0.8) 0%,
            rgba(185, 111, 255, 0.8) 17%,
            rgba(232, 98, 255, 0.8) 33%,
            rgba(255, 90, 193, 0.8) 50%,
            rgba(255, 73, 160, 0.8) 67%,
            rgba(255, 56, 141, 0.8) 83%,
            rgba(255, 41, 128, 0.8) 100%
          )
    ` }

    if (!src)
        src = '/spacer.png'

    if (src.includes('.svg') && Platform.OS != 'web')
        src = src.replace('.svg', '.png')

    if (!alt)
        alt = "";        

    if (rest.view == "cover"){
        rest.fill = 'fill'
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

        src = env('API_PROXY_URL').replace('/api', '/') +    "_next/image?url=" + src + "&w=" + w + "&q=75"

        srcImIn = src;
    }
    
    //const [srcIm, setSrcIm] = useState(srcImIn);
    //const [srcOr, setSrcOr] = useState(src);
   /* const handleImageLoad = (e) => {
        if (srcIm != srcOr){
            setSrcIm(srcOr)
        }
    };

    const keyStr =  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

    const triplet = (e1, e2, e3) =>
  keyStr.charAt(e1 >> 2) +
  keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
  keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
  keyStr.charAt(e3 & 63)

    const rgbDataURL = (r, g, b) =>  `data:image/gif;base64,R0lGODlhAQABAPAA${triplet(0, r, g) + triplet(b, 255, 255)}/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`
*/
    
    
    if (nobg == true){
        style={}
    }

    return (
        <SolitoImageStyled 
            priority
            {...rest} 
            src={src} 
            alt={alt} 
            style={style} 
          //  placeholder="blur"
           // blurDataURL={rgbDataURL(125, 125, 125)}
            //"data:image/png;base64,/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII="
           /* onLoadingComplete={(e) => {
                handleImageLoad(e);
            }}*/
        />
    );
}
