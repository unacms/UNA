import { SolitoImage } from 'solito/image'

export default function ElementImage(props) {
    if (props.scale && props.scale == 'width')
        props.height = 'auto';
    return (
        <SolitoImage {...props}>{props.children}</SolitoImage>
    );
}
