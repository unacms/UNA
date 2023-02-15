import { SolitoImage } from 'solito/image'
import { styled } from 'nativewind'

export const SolitoImage2 = styled(SolitoImage)


export default function ElementImage(props) {
    // if (props.scale && props.scale == 'width')
    //    props.height = 'auto';

    //let {width, height, ...rest} = props; // remove width & height
    
    return (
        <SolitoImage2 {...props}>{props.children}</SolitoImage2>
    );
}
