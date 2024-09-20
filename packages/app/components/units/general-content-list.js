
import { componentsMap } from "app/components/units/content-list/_map";
import { useMemo, memo } from 'react';

function Unit(props) {

    const data = props.data;
    const module = data?.module || props.module;
    const Component = useMemo(() => componentsMap[module] || componentsMap.default, [module]);

    return <Component {...props} />
    
    
    
    /*const Result = <Component {...restProps} />;
        const Component = componentsMap[module];
        const DefaultComponent = componentsMap["default"];
    
        const Result = Component ? (
            <Component {...props} />
        ) : (
            <DefaultComponent {...props} />
        );
    
        return module != 'bx_persons' && module != 'bx_organizations' ? Result : (
            <CardDataContext>{Result}</CardDataContext>
        );*/
}

export default memo(Unit);