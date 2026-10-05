import { components } from 'app/components/registry';
import { useDateLocaleTag } from 'app/lib/util';
import { memo } from 'react';

function Unit(props) {
    useDateLocaleTag();
    if (!props?.unit)
        return null;
    const Component = components['unit'][props.unit];

    return <Component {...props} />;
}

export default memo(Unit);