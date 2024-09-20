import {componentsMap} from './units/_map';
import { useMemo, memo } from 'react';

function Unit(props) {
    const Component = useMemo(() => componentsMap[props.unit] || componentsMap.default, [props.unit]);
    return <Component {...props} />;
}

export default memo(Unit);