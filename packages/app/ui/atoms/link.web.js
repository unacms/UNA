import { styled } from 'nativewind'
import { Link as SolitoLink, TextLink as TextSolitoLink } from 'solito/link'
import { Text } from 'app/design/typography'
export const Link = styled(SolitoLink)

export default function ElementLink(props) {  
    //if (props.href.includes('://') || props.href.includes('javascript:'))
    //    return <Text>{props.children}</Text>    
    
    return (
        <Link href={props.href} {...props}>
            {props.children}
        </Link>
    );
}
