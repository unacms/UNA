import { staticComponents } from 'app/static';

export function appStatic(section, props) {
    const Component = staticComponents[section];
    if (Component && Component.$$typeof === Symbol.for('react.element'))
        return Component;
    if (Component)
        return <Component {...props}/>
}