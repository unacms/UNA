import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Platform, PlatformIOSStatic } from 'react-native'

export const SolitoImage2 = styled(SolitoImage)


export default function ElementImage(props) {
    
    let {width, height, ...rest} = props; // remove width & height

    rest.height = props.pref_height ? props.pref_height : height;
    rest.width = props.pref_width ? props.pref_width : width;
    
    if (Platform.OS != 'web'){
        rest.height = 'auto';
    }

    return (
        <SolitoImage2 {...rest}>{props.children}</SolitoImage2>
    );
}
