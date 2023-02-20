import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Platform, PlatformIOSStatic } from 'react-native'

export const SolitoImage2 = styled(SolitoImage)


export default function ElementImage(props) {
    // if (props.scale && props.scale == 'width')
    //    props.height = 'auto';

    let {width, height, ...rest} = props; // remove width & height

    rest.height = props.prefHeight ? props.prefheight : height;
    rest.width = props.prefWidth ? props.prefwidth : width;
    
    if (Platform.OS != 'web'){
        rest.height = 'auto';
    }
    
    return (
        <SolitoImage2 {...rest}>{props.children}</SolitoImage2>
    );
}
