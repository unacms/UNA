import { staticComponents } from 'app/customization/static';

export function appStatic(section, props) {
    const Component = staticComponents[section];
    if (Component && Component.$$typeof === Symbol.for('react.element'))
        return Component;
    if (Component)
        return <Component {...props}/>
}