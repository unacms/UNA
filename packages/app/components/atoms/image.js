import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'
import { Platform, PlatformIOSStatic } from 'react-native'

export const SolitoImageStyled = styled(SolitoImage)


export default function ElementImage(props) {
    
    let {width, height, ...rest} = props; // remove width & height

    if (rest.view == "cover"){
        rest.fill = 'fill'
    }
    else{   
        rest.height = props.pref_height ? props.pref_height : height;
        rest.width = props.pref_width ? props.pref_width : width;
        if (Platform.OS != 'web'){
            rest.height = 'auto';
        }
    }
    

    return (
        <SolitoImageStyled {...rest}>{props.children}</SolitoImageStyled>
    );
}
