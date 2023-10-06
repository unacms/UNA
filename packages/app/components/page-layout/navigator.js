import { DataByName } from 'app/components/block'
import { Conductor } from 'app/ui/molecules/conductor';
import { appSetting } from 'app/lib/util'

export default function PageLayout(props) {
    const leftSideBar = appSetting('layout', 'format') == 'ver' ? false : true
    
    let menu = props.data.menu;
    let categories = DataByName(props.data, props.blocks.categories);
    let menuItems = [];
    if (categories){
        menuItems  = categories?.content[0]?.data
            .map((obj, index) => {
            const key = Object.keys(obj)[0];
            return {
                id: index + menu.items.length,
                name: obj.url,
                title: obj.name + ' (' + obj.num + ')',
                link: obj.url.replace('/',''),
                icon: '',
                ident: 1,
                hideInTop: true
            }
        }); 
    } 
    menu.items = [...menu.items, ...menuItems];
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
