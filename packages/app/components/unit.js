import { getComponent } from 'app/components/registry';
import { useMemo, memo } from 'react';

function Unit(props) {
    const Component = useMemo(() =>  getComponent('unit', props.unit) || getComponent('unit', 'default'), [props.unit]);
    return <Component {...props} />;
}

export default memo(Unit);