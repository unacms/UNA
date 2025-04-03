import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from  'next/navigation';
import { useCallback } from 'react';

export default function ElementLink(props) {  

    let { href, emulate, target,  ...rest } = props;
    const router = useRouter();

    const handlePress = (event, href) => {
        if (href){
            router.push(href); 
            event.preventDefault();
        }
    }

    const handleLinkClick = useCallback((event, href, target) => {
        if (!target){
            if (href != window.location.pathname + window.location.search){
            //  var tag = document.createElement("div");
                //tag.className = 'loader';
                //document.body.appendChild(tag);
                let element = document.querySelector('.animated-view');
                if (element){
                    element.classList.remove('page-fade-in');
                    element.classList.add('page-fade-out');
                }
            }
        }
    }, []);

    if (href == 'javascript:' || href === undefined || href == '/javascript:')
        href='';

    if (href == ''){
        return props.children
    }
   
    if ((href == '/home' || href == '')){
        href ='/'
    }

    if (emulate === true)
        return (
            <Pressable {...rest} onPress={() => handlePress(event, href)} >
                {props.children}
            </Pressable>
        );

    const prefetch = rest?.noprefetch || href == '/logout' || href == 'logout' ? false : true;

    return (
        <Link className=' focus-visible:outline outline-2 outline-offset-1 rounded-[12px] leading-none focus:outline-primary/50 dark:focus:outline-primary-d/50 group ' target={target} href={href} {...rest} prefetch={prefetch} onClick={(e) => handleLinkClick(e, href, target)} > 
            {props.children}
        </Link>
    );
}
