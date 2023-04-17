import { View } from 'app/design/view'
import Likes from 'app/ui/molecules/likes';
import Reactions from 'app/ui/molecules/reactions';
import Scores from 'app/ui/molecules/scores';
import Connections from 'app/ui/molecules/connections';

const oComponentsMap = {
    likes: Likes,
    reactions: Reactions,
    scores: Scores,
    connections: Connections
};

export default function MenuItemElement(oProps) {
    if(!oProps.data || !oProps.data.type)
        return;

    const bShowVertical = oProps.params != undefined && oProps.params.showVertical != undefined && oProps.params.showVertical === true;

    const Element = oComponentsMap[oProps.data.type];
    if(!Element)
        return;

    if(oProps.data.params != undefined && oProps.params != undefined)
        oProps.data.params = {...oProps.data.params, ...oProps.params}

    const sClassName = 'menu-item ' + ((oProps?.params && oProps.params?.classNameItem) || 'flex' + (bShowVertical ? ' flex-col w-full ' : ' flex-auto flex-row'));
    return (
        <View className={sClassName}>
            <Element key={oProps.id ? oProps.id : oProps.name} {...oProps.data} />
        </View>
    );
}
