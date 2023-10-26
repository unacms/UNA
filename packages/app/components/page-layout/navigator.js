import { DataByName } from 'app/components/block'
import { Conductor } from 'app/ui/molecules/conductor';
import { appSetting } from 'app/lib/util';
import { useEffect, useMemo} from 'react';

function getMenu(props) {
    //console.log(1);
    let menu = Object.assign({}, props.data.menu);;
    let categories = DataByName(props.data, props.blocks.categories);
    let menuItems = [];
    if (categories){
       // console.log('categories?.content[0]?.data', categories?.content[0]?.data, menu.items);
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
                hideInTop: true
            }
        }); 
        menu.items = [...menu.items, ...menuItems];
    }
    return menu;
}

export default function PageLayout(props) {
    const leftSideBar = appSetting('layout', 'format') == 'ver' ? false : true
    const menu = useMemo(() => getMenu(props), [leftSideBar]);
    
    return (<Conductor 
        minHeaderHeight={0} 
        isHideDefaultHeader={false} 
        menu={menu} 
        data={props.data} 
        blocks={props.blocks}
        useSectionAsMenu={false}
        leftSideBar={leftSideBar}
    />)
}
