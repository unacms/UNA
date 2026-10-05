import { View } from 'app/design/view'
import { components } from 'app/components/registry';
import { useMemo } from "react";

export default function MenuItemElement(oProps) {
    const type = oProps?.data?.type;
    const bShowVertical = oProps?.params?.showVertical === true;
    const Element = useMemo(() => type ? components['molecule'][String(type)] : null, [type]);
    if (!type) return;
    if (!Element) return;

    oProps.data.params = {
        ...oProps.data.params,
        ...(oProps.params || {})
    };

    const sClassName = `menu-item ${(oProps?.params?.classNameItem || 'flex')} ${bShowVertical ? 'flex-col w-full' : 'flex-auto flex-row'}`;

    return <Element mode={oProps.mode} key={oProps.id || oProps.name} {...oProps.data} />

    return (
        <View className={sClassName}>
            <Element mode={oProps.mode} key={oProps.id || oProps.name} {...oProps.data} />
        </View>
    );
}
