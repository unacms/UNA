import { styled } from 'nativewind'
import { Link as SolitoLink} from 'solito/link'
export const Link = styled(SolitoLink)
import { View, Pressable } from 'app/design/view'
import { useRouter } from 'next/router';

export default function ElementLink(props) {  
    //if (props.href.includes('://') || props.href.includes('javascript:'))
    //    return <Text>{props.children}</Text> 
    let { href,  ...rest } = props;
    const router = useRouter();

    const handlePress = (event, href) => {
        if (href){
            router.push(href); 
            event.preventDefault();
        }
    }

    if (props.emulate == true)
        return (
            <Pressable {...rest} onPress={() => handlePress(event, href)} >
                {props.children}
            </Pressable>
        );

    return (
        <Link href={href} {...props}   > 
            {props.children}
        </Link>
    );
}
