import { View } from 'app/design/view';
import { Text } from 'app/design/typography'
import {appSetting, menuItemsByName} from 'app/lib/util'
import { Icon } from 'app/ui/atoms/icon';
import Image from 'app/ui/atoms/image';
import { Link } from 'app/ui/atoms/link';
import { Button } from 'app/design/controls';
import { useState, useRef } from 'react';
import { TopMenu, GroupsMenu, TalksList } from 'app/components/elements/messenger';
import { Dimensions } from 'react-native';

export default function PageLayout({ data }) {
    const { list, history } = data,
          { menu, nav_groups_menu } = data.menu;

    const oWindowRef = useRef();
    const sHeight = Dimensions.get('window').height - 8*16 + 'px';
    return (
        <View ref={oWindowRef} style={{ maxHeight: sHeight }} className="w-full h-full overflow-hidden">
            <View className="w-full h-full mx-auto divide-x divide-gray-200 dark:divide-gray-800 bg-gray-50 dark:bg-gray-900 grid grid-cols-10">
                <View className="h-full snap-y overflow-y-auto xl:block hidden xl:col-span-2">
                  <TopMenu items={menu}></TopMenu>
                  <GroupsMenu items={nav_groups_menu}></GroupsMenu>
                </View>
                <View className="h-full max-h-full overflow-hidden col-span-10 md:col-span-4 xl:col-span-3" id="bx-messenger-list-block">
                    <TalksList list={list} ></TalksList>
                </View>
                <View className="h-full max-h-full w-full md:col-span-6 md:flex xl:col-span-5 hidden flex flex-col text-xl justify-center items-center" id="bx-messenger-history-block">
                    History
                </View>
            </View>
        </View>
    )
}