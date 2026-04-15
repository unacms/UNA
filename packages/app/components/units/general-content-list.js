import { getComponent } from 'app/components/registry';
import { useMemo, memo } from 'react';

function Unit(props) {
    const data = props.data;
    const module = data?.module || props.module;
    const Component = useMemo(() => getComponent('content-list',module) || getComponent('content-list', 'bx_persons'), [module]);
    return <Component {...props} />
}

export default memo(Unit);