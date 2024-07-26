import { Button } from 'app/design/controls';
import Link from 'app/ui/atoms/link'
import { View, Row } from 'app/design/view'; 
import Search from 'app/ui/molecules/search';
import { menuItemsFilter } from 'app/lib/util';
import Header from 'app/components/nav/header';
import MenuAdd from 'app/components/nav/menu-add'
import { menuItemsByName, appSetting } from 'app/lib/util'

export function getRightHeader(items, currentUser, pagePath) {
    items = menuItemsFilter(items, currentUser);
    let addMenu = null;
    if (pagePath == '/home' && currentUser){
        const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);
        if (menu_add_items.length){
            addMenu = <MenuAdd key='menu-add' buttonProps={{ variant: "secondary", rounded: 'rounded', startDecorator: "Plus", id: "m3" }} />;
        }
    }
    if (items?.length == 0 && !addMenu)
        return null;

    return <Row className='gap-x-2'>{
        items?.map((button) => {
            let btn = undefined;
            if(button.section || button.link == 'search')
                btn = <Search section={button.section} params={{trigger: {size: 'base', variant: 'secondary' }}} />
            else {
                btn = <Button rounded title={button.title} variant='secondary' startDecorator={button.icon} size="base" />;
                btn = button.link ? <Link href={button.link } >{btn}</Link> : btn
            }
    
            return (
                <View className="w-10" key={`add-${button.icon}`} >{btn}</View>
            )
        })
       
    }
    {!!addMenu && <View>{addMenu}</View>}
    </Row>;
};

export function updateCenterHeader(_path, header, backButtonPresented, navigation, rightComponents, headerSettings) {
    if (headerSettings?.header === false){
        navigation.setOptions({ headerShown: false });
    }
    else{
        if (backButtonPresented === null)
        {
            if (headerSettings?.backButton !== false){
                backButtonPresented = true;
            }
        }
        navigation.setOptions({ 
            headerBackVisible: false, 
            header:(props) => <Header backButtonPresented={backButtonPresented} header={header} pagePath={_path} rightComponents={rightComponents}/>,
            headerShown: true
        });
    }
}