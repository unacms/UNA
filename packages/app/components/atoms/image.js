import { SolitoImage } from 'solito/image'

export default function ElementImage(props) {
    // if (props.scale && props.scale == 'width')
    //    props.height = 'auto';
    let {width, height, ...rest} = props;
    
    return (
        <SolitoImage {...rest}>{props.children}</SolitoImage>
    );
}
