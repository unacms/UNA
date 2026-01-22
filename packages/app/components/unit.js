import { getComponent } from 'app/components/registry';
import { memo } from 'react';

function Unit(props) {
    if (!props?.unit)
        return null;
    const Component = getComponent('unit', props.unit);

    return <Component {...props} />;
}

export default memo(Unit);