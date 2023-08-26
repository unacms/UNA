import {TouchableOpacity, View} from 'app/design/view';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useState, useContext, memo, useCallback } from 'react'
import {MenuData, PageData} from "./context/messenger-сontext";
import { MotiView } from "moti";

function GroupsMenuItem({ item }){
    const [visible, setVisibility] = useState(true),
        { title, submenu } = item || {};

    const handlerClick = () => setVisibility(!visible);
    return item && <View>
                         <Button variant="text" endDecorator={ !visible ? 'CaretUp' : 'CaretDown' } onPress={handlerClick} fullWidth solid align='between' title={title}/>
                         <View className={ `m-4 ${!visible ? 'hidden' : '' }  overflow-y-auto max-h-[15rem]` }>
                            { submenu && Object.keys(submenu).map((iIndex) => <GroupsMenuSubItems key={iIndex} item={ submenu[iIndex] } />) }
                         </View>
                    </View>
}

function GroupsMenuSubItems({ item }){
    const { title, icon } = item;
    const { handlerSelectMenu } = useContext(PageData);

    return item && <View className="flex justify-between">
                        <Button variant="text" imageDecorator={icon} fullWidth solid align='between' title={title} onPress={handlerSelectMenu} />
                   </View>
}

const TopMenu = memo(({ items, onSelect }) => {
    const aIconsAliases = { 'inbox': 'home', 'comment': 'messages', 'reply': 'bell', 'bookmark':'files' },
          aAllowedList = ['inbox', 'direct', 'saved'];

    return <View className="flex-col gap-0.5 mb-2 mx-2">
           {
                items && Object.keys(items).map((iIndex) => {
                const { icon, id, name, title } = items[iIndex],
                    sIcon = icon && icon.split(' ')[0],
                    sAIcon = sIcon && ~Object.keys(aIconsAliases).indexOf(sIcon) ? aIconsAliases[sIcon]: sIcon;

                return ~aAllowedList.indexOf(name) ?
                    <Button key={id} variant="text" startDecorator={ sAIcon } fullWidth solid align='start' title={title}
                            onPress={ () => onSelect(name) } /> : ''
                })
           }
           </View>
});

const GroupsMenu = memo(({ items }) => {
    return <View className="flex-col gap-0.5 px-2">
                { items && Object.keys(items).map((iIndex) => <GroupsMenuItem key={iIndex} item={items[iIndex]} ></GroupsMenuItem>) }
           </View>
});

function MenuColumn() {
    const { menuView, setMenuView, menuItem, setMenuItem, menuItems } = useContext(MenuData);

    const handlerSelectMenu = useCallback((menuItem) => {
        setMenuItem(menuItem);
        if (menuView)
            setMenuView(false);

    }, []);

    return menuItems && <View className="h-full snap-y overflow-y-auto mt-2 w-full">
             <TopMenu items={ menuItems } onSelect={ handlerSelectMenu } />
           </View>;
};

const WrappedTopMenu = () => {
    return <View className="absolute h-full xl:hidden bg-white/80 dark:bg-black/80 w-full absolute top-0 h-screen z-50">
        <MotiView style={{width: 480}} from={{opacity: 1}} animate={{opacity: 1}} exit={{opacity: 0}} transition={{duration: 0}}/>
        <MotiView style={{width: 288, height: '100%'}} from={{translateX: -300, overshootClamping: false}} animate={{translateX: 0, overshootClamping: false}} exit={{height: 0, translateX: -300, overshootClamping: false}} transition={{overshootClamping: true}}>
            <View className="backdrop-blur h-full xl:flex shadow-xl p-4
                                                 2xl:bg-transparent 2xl:dark:bg-transparent bg-navbar/80
                                                 dark:bg-navbar-dark/50 border-r 2xl:border-none border-neoborder
                                                 dark:border-neoborder-dark flex-col gap-y-2">
                <MenuColumn test={"popup"} />
            </View>
        </MotiView>
    </View>
};

export { TopMenu, GroupsMenu, MenuColumn, WrappedTopMenu };