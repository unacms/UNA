import { useState, useRef } from 'react';
import { useController } from 'react-hook-form';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button, Input } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';

export default function ElementSearch(oProps) {
    const redirectdRef = useRef();

    const [popupOpen, setPopupOpen] = useState(false);
    const [popupContent, setPopupContent] = useState('');

    const getSkeleton = () => {
        return (
            <View className="w-full">
            {[...Array(1, 2, 3)].map( i => 
                <View key={i} className="flex-col my-2 p-2 bg-gray-500/5 sm:rounded-lg">
                    <View className="animate-pulse flex-row items-center gap-3">
                        <View className="rounded-full bg-gray-600/20 h-10 w-10"></View>
                        <View className="flex-1 space-y-1">
                            <View className="h-4 w-1/2 bg-gray-600/20 rounded-full"></View>    
                            <View className="h-3 w-1/3 bg-gray-600/20 rounded-full"></View>
                        </View>
                    </View>
                </View>
            )}
            </View>
        );
    };

    const handleSearch = async (sValue) => {
        if(!sValue)
            return;

        setPopupContent(getSkeleton());

        return true;

        const aParams = {
            params: {
                type: 'obj_own_and_con',
                start: 0,
                per_page: 12,
                modules: ''
            }
        };

        const sResponse = await fetcher('/api.php?r=bx_notifications/get_data/Module&params=' + JSON.stringify(aParams));
        if(!sResponse?.data) 
            return;

        const oBlock = sResponse.data.shift();
        if(oBlock.data?.unit != 'notifications' || !oBlock.data?.data) 
            return;

        const sContent = (
            <Text>Search results!</Text>
        );

        setPopupContent(sContent);            
    }

    const handleClick = (sUrl) => {
        redirectdRef.current.redirect(sUrl);
    }

    const sTxtTitle = appSetting('lang_keys', 'search_popup_title');
    const sTxtViewExtended = appSetting('lang_keys', 'search_popup_view_extended');

    return (
        <DropdownMenu.Root open={popupOpen} onOpenChange={(bOpen) => {!bOpen && setPopupContent(''); setPopupOpen(bOpen)}}>
            <DropdownMenu.Trigger className="rounded-full" aria-label={sTxtTitle}>
                <Button variant="text" startDecorator="search" rounded />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content className="DropdownMenuContent border border-bordercolormodal dark:border-bordercolormodal-dark backdrop-blur m-1 bg-backgroundmodal dark:bg-backgroundmodal-dark shadow-xl ">
                    <Redirect ref={redirectdRef} />
                    <View className="px-1.5 pb-1.5">
                        <View className="flex-row items-center mb-1">
                            <Text className="text-gray-700 dark:text-gray-300 text-lg flex-auto font-bold ml-0.5">{sTxtTitle}</Text>
                            <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title={sTxtViewExtended} onPress={() => {setPopupOpen(false); handleClick('/search');}} />
                        </View>
                        <View className="flex-row mb-1">
                            <Input name="search" onChangeText={(value) => handleSearch(value)} onBlur={(value) => handleSearch(value)} defaultValue="" accessibilityLabel="Search" />
                        </View>
                        {!!popupContent && popupContent}
                    </View>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
 }
