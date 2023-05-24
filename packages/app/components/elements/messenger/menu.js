import { View } from 'app/design/view';
import { Text } from 'app/design/typography'
import {appSetting, menuItemsByName} from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useState, useRef } from 'react'

function GroupsMenuItem({ item }){
    const [visible, setVisibility] = useState(true),
        { title, submenu } = item || {};

    const handlerClick = () => setVisibility(!visible);

    return item && <View>
        <Button variant="text" endDecorator={ !visible ? 'CaretUp' : 'CaretDown' } onPress={handlerClick} fullWidth solid align='between' title={title}/>
        <View className={ `m-4 ${!visible ? 'hidden' : '' }  overflow-y-auto max-h-[15rem]` }>
            { submenu && Object.keys(submenu).map((iIndex) => <GroupsMenuSubItems key={iIndex} item={ submenu[iIndex] }></GroupsMenuSubItems>) }
        </View>
    </View>
}

function GroupsMenuSubItems({ item }){
    const { id, name, title, icon } = item;

    return item && <View className="flex justify-between">
        <Button variant="text" imageDecorator={icon} fullWidth solid align='between' title={title} />
    </View>
}

function TopMenu({ items }){
    const aIconsAliases = { 'inbox': 'home', 'comment': 'messages', 'reply': 'bell'},
        menu = items && Object.keys(items);

    return menu && <View className="flex-col gap-0.5 mb-2 mx-2" >
        {
            menu.map((iIndex) => {
                const { icon, id, name, title } = items[iIndex],
                    sIcon = icon && icon.split(' ')[0],
                    sAIcon = sIcon && ~Object.keys(aIconsAliases).indexOf(sIcon) ? aIconsAliases[sIcon]: sIcon;

                return <Button variant="text" startDecorator={ sAIcon } fullWidth solid align='start' title={title}/>
            })
        }
    </View>
}

function GroupsMenu({ items }){
    const menu = items && Object.keys(items);

    if (!menu.length)
        return '';

    return <View className="flex-col gap-0.5 px-2">
        { menu.map((iIndex) => <GroupsMenuItem key={iIndex} item={items[iIndex]}></GroupsMenuItem>) }
    </View>
}

export { TopMenu, GroupsMenu };