import { staticComponents } from 'app/static';

export function appStatic(section, props) {
    let Component = staticComponents[section];
    //if (Component && Component.$$typeof === Symbol.for('react.transitional.element')) 
    if (Component && Component.$$typeof === Symbol.for('react.element'))
        return Component;

    return <Component {...props}/>
}