import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from 'app/lib/hooks/router'
import { useCallback } from 'react';
import { appSetting, cd } from 'app/lib/util'

export default function ElementLink(props) {  

    let { href, emulate, target, variant, size, className = '',  ...rest } = props;
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

    // Variants and sizes from theme
    const ThemeLinkSizes = appSetting('theme', 'link_sizes');
    const ThemeLinkStyles = appSetting('theme', 'link_styles');

    const mapVariantToTheme = (v) => {
        switch (v) {
            case 'ghost': return 'ghost';
            case 'secondary': return 'secondary';
            case 'accent': return 'accent';
            case 'primary': return 'primary';
            default: return 'default';
        }
    };

    const selectedVariant = mapVariantToTheme(variant);
    const variantClass = [
        ThemeLinkStyles[`u-link-${selectedVariant}-cnt`] || '',
        ThemeLinkStyles[`u-link-${selectedVariant}-text`] || '',
        ThemeLinkStyles[`u-link-${selectedVariant}-trans`] || ''
    ].join(' ').trim();

    const sizeClass = (() => {
        if (!size) return '';
        const token = ThemeLinkSizes[size]?.padding;
        if (!token) return '';
        return token;
    })();

    const composedClassName = [variantClass, sizeClass, className].filter(Boolean).join(' ').trim();

    if (emulate === true)
        return (
            <Pressable {...rest} className={composedClassName} onPress={() => handlePress(event, href)} >
                {props.children}
            </Pressable>
        );

    const prefetch = rest?.noprefetch || href == '/logout' || href == 'logout' ? false : true;

    return (
        <Link 
            
            target={target} 
            href={href} 
            {...rest} 
            className={composedClassName}
            prefetch={prefetch} 
            onClick={(e) => handleLinkClick(e, href, target)}
        > 
            {props.children}
        </Link>
    );
}
