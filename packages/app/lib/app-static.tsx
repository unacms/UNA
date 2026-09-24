import { staticComponents } from 'app/customization/static';

export function appStatic(section: any, props: any) {
    const Component = (staticComponents as Record<string, any>)[section];
    if (Component && Component.$$typeof === Symbol.for('react.element'))
        return Component;
    if (Component)
        return <Component {...props}/>
}