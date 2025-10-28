import { DataByName } from 'app/components/block'
import { Conductor } from 'app/ui/molecules/conductor';
import { useMemo} from 'react';
import { useLayoutSettings } from 'app/context/layout-settings';
import { useEffect } from 'react';
import { appSetting, clearNotif } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user'

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
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { layoutName: layout } = useLayoutSettings();
    const leftSideBar = layout != 'hor' ? false : true
    const menu = useMemo(() => getMenu(props, layout), [leftSideBar]);
    const isNamePresent = menu.items.some(item => item.name === props.uri);
    if (!isNamePresent){
        menu.items.push({id:-1, name: props.uri, title:'', link: props.data.url, hideInTop: true});
    }

    useEffect(() => {
        if (appSetting('notifications', 'url') === '/' + props.uri){
            console.log(55)
            clearNotif();
            setCurrentUser({
                notifications: 0,
                notificationsTs:Date.now()
            });
        }

    }, [])

    return (
        <Conductor 
            layoutName={props.layoutName}
            isHideDefaultHeader={false} 
            menu={menu} 
            ts={props.data.ts}
            data={props.data} 
            blocks={props.blocks}
            useSectionAsMenu={false}
        />
    )

}

