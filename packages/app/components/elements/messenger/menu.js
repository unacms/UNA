import { View } from 'app/design/view';
import { Text } from 'app/design/typography'
import {appSetting, menuItemsByName} from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useState, useContext, memo } from 'react'
import MessengerContext from "./messenger-сontext";

function GroupsMenuItem({ item, onSelect }){
    const [visible, setVisibility] = useState(true),
        { title, submenu } = item || {};

    const handlerClick = () => setVisibility(!visible);

    return item && <View>
                         <Button variant="text" endDecorator={ !visible ? 'CaretUp' : 'CaretDown' } onPress={handlerClick} fullWidth solid align='between' title={title}/>
                         <View className={ `m-4 ${!visible ? 'hidden' : '' }  overflow-y-auto max-h-[15rem]` }>
                            { submenu && Object.keys(submenu).map((iIndex) => <GroupsMenuSubItems key={iIndex} item={ submenu[iIndex] } onSelect={onSelect}></GroupsMenuSubItems>) }
                         </View>
                    </View>
}

function GroupsMenuSubItems({ item,  onSelect}){
    const { title, icon } = item;

    return item && <View className="flex justify-between">
                        <Button variant="text" imageDecorator={icon} fullWidth solid align='between' title={title} onPress={onSelect} />
                   </View>
}

const TopMenu = memo(({ items, onSelect }) => {
    const aIconsAliases = { 'inbox': 'home', 'comment': 'messages', 'reply': 'bell', 'bookmark':'files' },
        menu = items && Object.keys(items);

    const [ item, setItem ] = useState('index');

    //console.log('--- log generate top menu  ---', item);

    return menu && <View className="flex-col gap-0.5 mb-2 mx-2" >
                   {
                       menu.map((iIndex) => {
                           const { icon, id, name, title } = items[iIndex],
                               sIcon = icon && icon.split(' ')[0],
                               sAIcon = sIcon && ~Object.keys(aIconsAliases).indexOf(sIcon) ? aIconsAliases[sIcon]: sIcon;

                           return <Button key={iIndex} variant="text" startDecorator={ sAIcon } fullWidth solid align='start' title={title} onPress={() => {
                               setItem(name);
                               if (typeof onSelect === 'function')
                                   onSelect(name);
                           }} />
                       })
                   }
                   </View>
});

const GroupsMenu = memo(({ items, onSelect }) => {
    const menu = (items && Object.keys(items)) || [];

    if (!menu.length)
        return '';

    const [ name, setItem ] = useState('index');

    //console.log('--- log generate groups menu  ---');

    return <View className="flex-col gap-0.5 px-2">
                { menu.map((iIndex) => <GroupsMenuItem key={iIndex} item={items[iIndex]} onSelect={() => {
                    setItem(name);
                    if (typeof onSelect === 'function')
                        onSelect(name);
                }} ></GroupsMenuItem>) }
           </View>
});

const MenuColumn = memo( ({ nav_groups_menu, menu, colWidth }) => {
    const { device, handlerSelectMenu } = useContext(MessengerContext);

    console.log('--- log render menu ----', device, menu, nav_groups_menu);

    return <View className={ "h-full snap-y overflow-y-auto mt-2 " + ( colWidth || 'w-full') }>
        <TopMenu items={ menu } onSelect={ handlerSelectMenu }></TopMenu>
        <GroupsMenu items={ nav_groups_menu } onSelect={ handlerSelectMenu } ></GroupsMenu>
    </View>
});

export { TopMenu, GroupsMenu, MenuColumn };