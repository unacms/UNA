import { styled } from 'nativewind'
import { Link as SolitoLink, TextLink as TextSolitoLink } from 'solito/link'

export const Link = styled(SolitoLink)

export default function ElementLink(props) {     
    return (
        <Link href={props.href} {...props}>
            {props.children}
        </Link>
    );
}
