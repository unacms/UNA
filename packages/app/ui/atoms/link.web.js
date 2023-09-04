import { styled } from 'nativewind'
import { Link as SolitoLink} from 'solito/link'
//export const Link = styled(SolitoLink)
import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from  'next/navigation';
import { useCallback } from 'react';

export default function ElementLink(props) {  

    let { href, emulate,  ...rest } = props;
    const router = useRouter();

    const handlePress = (event, href) => {
        if (href){
            router.push(href); 
            event.preventDefault();
        }
    }

    const handleLinkClick = useCallback((event, href) => {
        if (href != window.location.pathname + window.location.search){
            var tag = document.createElement("div");
            tag.className = 'loader';
            document.body.appendChild(tag);
        }
    }, []);

    if (!href)
        href='non defined';
   
    if ((href == '/' || href == '')){
        href ='/home'
    }

    if (emulate === true)
        return (
            <Pressable {...rest} onPress={() => handlePress(event, href)} >
                {props.children}
            </Pressable>
        );

    return (
        <Link href={href} {...rest} onClick={(e) => handleLinkClick(e, href)} legacyBehavior={false}> 
            {props.children}
        </Link>
    );
}
