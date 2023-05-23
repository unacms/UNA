import { View } from 'app/design/view'
import {componentsMap} from  'app/ui/molecules/_map';

export default function MenuItemElement(oProps) {
    if(!oProps.data || !oProps.data.type)
        return;

    const bShowVertical = oProps.params != undefined && oProps.params.showVertical != undefined && oProps.params.showVertical === true;

    const Element = componentsMap[oProps.data.type];
    if(!Element)
        return;

    if(!oProps.data?.params)
        oProps.data.params = {};
    if(oProps?.params != undefined)
        oProps.data.params = {...oProps.data.params, ...oProps.params}

    const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem) || 'flex' + (bShowVertical ? ' flex-col w-full ' : ' flex-auto flex-row'));
    return (
        <View className={sClassName}>
            <Element key={oProps.id ? oProps.id : oProps.name} {...oProps.data} />
        </View>
    );
}
