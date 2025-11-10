import Link from 'next/link'
import { Pressable } from 'app/design/view'
import { useRouter } from 'app/lib/hooks/router'
import { useCallback } from 'react';
import { appSetting, cd } from 'app/lib/util'

export default function ElementLink(props) {  

    let { href, emulate, target, variant, size, className = '', hitarea = true, noprefetch, onClick, ...rest } = props;
    const router = useRouter();

    const handlePress = (event, href) => {
        if (href){
            router.push(href); 
            event.preventDefault();
        }
    }

    const handleLinkClick = useCallback((event, href, target) => {
        if (onClick)
            onClick();
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
    }, [onClick]);

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
            case 'plain': return 'plain';
            case 'plainghost': return 'plainghost';
            case 'accent': return 'accent';
            case 'accentghost': return 'accentghost';
            case 'ghost': return 'ghost';
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
        const hitareaClass = hitarea === false ? '' : (ThemeLinkSizes[size]?.hitarea_class || '');
        const textSizeClass = ThemeLinkSizes[size]?.text || '';
        const roundedClass = ThemeLinkSizes[size]?.rounded || '';
        const focusClass = ThemeLinkSizes[size]?.focus || '';
        // For ghost and plainghost variants: use pseudo padding instead of DOM padding
        if (selectedVariant === 'ghost' || selectedVariant === 'plainghost' || selectedVariant === 'accentghost') {
            const padSize = ['xs','sm','md','lg'].includes(size) ? size : 'md';
            const pseudoPadClass = `u-link-ghost-pad-${padSize}`;
            return [pseudoPadClass, hitareaClass, textSizeClass, roundedClass, focusClass].filter(Boolean).join(' ');
        }
        const token = ThemeLinkSizes[size]?.padding;
        return [token || '', hitareaClass, textSizeClass, roundedClass, focusClass].filter(Boolean).join(' ');
    })();

    const composedClassName = [variantClass, sizeClass, className].filter(Boolean).join(' ').trim();

    if (emulate === true)
        return (
            <Pressable {...rest} className={composedClassName} onPress={() => handlePress(event, href)} >
                {props.children}
            </Pressable>
        );

    const isPrefetch = noprefetch || href == '/logout' || href == 'logout' ? false : true;

    return (
        <Link 
            
            target={target} 
            href={href} 
            {...rest} 
            className={composedClassName}
            prefetch={isPrefetch} 
            onClick={(e) => handleLinkClick(e, href, target)}
        > 
            {props.children}
        </Link>
    );
}
