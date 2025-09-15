import { DataByName } from 'app/components/block'
import { Conductor } from 'app/ui/molecules/conductor';
import { getBlocksFromData } from 'app/lib/util';
import { useMemo} from 'react';
import { useCurrentUser } from 'app/context/user'
import { processBlocks } from 'app/lib/conductor-helpers';
import { Platform } from 'react-native'
import { useLayoutSettings } from 'app/context/layout-settings';

function getMenu(props, layout) {
    let menu = Object.assign({}, props.data.menu);;
    let categories = DataByName(props.data, props.blocks?.categories);
    let menuItems = [];
    if (categories && layout == 'hor'){
        menuItems  = categories?.content[0]?.data
            .map((obj, index) => {
            const key = Object.keys(obj)[0];
            return {
                id: index + menu.items.length,
                name: obj.url,
                title: obj.name + ' (' + obj.num + ')',
                link: obj.url.replace('/',''),
                icon: obj.icon,
                ident: 1,
                hideInTop: false
            }
        }); 
        menu.items = [...menu.items, ...menuItems];
    }
    return menu;
}

export default function PageLayout(props) {

    const { layoutName: layout } = useLayoutSettings();
    const leftSideBar = layout != 'hor' ? false : true
    const menu = useMemo(() => getMenu(props, layout), [leftSideBar]);
    const isNamePresent = menu.items.some(item => item.name === props.uri);
    if (!isNamePresent){
        menu.items.push({id:-1, name: props.uri, title:'', link: props.data.url, hideInTop: true});
    }

    return (
        <Conductor 
            layoutName={props.layoutName}
            isHideDefaultHeader={false} 
            menu={menu} 
            data={props.data} 
            blocks={props.blocks}
            useSectionAsMenu={false}
        />
    )

}

