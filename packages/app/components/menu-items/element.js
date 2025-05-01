import { View } from 'app/design/view'
import { componentsMap } from 'app/ui/molecules/_map';
import { useMemo } from "react";

export default function MenuItemElement(oProps) {
    if (!oProps?.data?.type) return;

    const bShowVertical = oProps?.params?.showVertical === true;
    const Element = useMemo(() => componentsMap[oProps.data.type], [oProps.data.type]);
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
