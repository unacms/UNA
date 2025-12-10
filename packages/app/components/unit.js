import { getComponent } from 'app/components/registry';
import { useMemo, memo } from 'react';
import { View } from 'app/design/view'

function Unit(props) {
    if (!props?.unit)
        return null;
   // return <View className="w-full h-12 bg-red-500"></View>
    const Component = getComponent('unit', props.unit);

    return <Component {...props} />;
}

export default memo(Unit);