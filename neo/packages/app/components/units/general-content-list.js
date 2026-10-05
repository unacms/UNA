import { components } from 'app/components/registry';
import { useMemo, memo } from 'react';

function Unit(props) {
    const data = props.data;
    const module = data?.module || props.module;
    const Component = useMemo(() => components['content-list'][module] || components['content-list']['default'], [module]);
    return <Component {...props} />
}

export default memo(Unit);