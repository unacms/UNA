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
        <Link className=' rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-primary dark:focus-visible:outline-primary-d duration-100' target={target} href={href} {...rest} prefetch={prefetch} onClick={(e) => handleLinkClick(e, href, target)} > 
            {props.children}
        </Link>
    );
}
