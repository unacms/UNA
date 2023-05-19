import { useState, useRef } from 'react';

import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Button, Input } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import SearchResults from 'app/components/units/search-results';

export default function ElementSearch(oProps) {
    const redirectdRef = useRef();

    const [popupOpen, setPopupOpen] = useState(false);
    const [popupContent, setPopupContent] = useState('');

    const getSkeleton = () => {
        return (
            <View className="w-full mt-1">
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
        if(!sValue || sValue.length < 3)
            return;

        setPopupContent(getSkeleton());

        /**
         * TODO: Move searchable sections (modules) in config or leave empty to search in all sections.
         */
        const aParams = {
            keyword: sValue,
            section: 'bx_posts',
            start: 0,
            per_page: 12,
        };

        const sResponse = await fetcher('/api.php?r=system/get_data_search/TemplServices&params=' + JSON.stringify(aParams));
        if(!sResponse?.data) {
            setPopupContent('');
            return;
        }

        const oBlock = sResponse.data.shift();
        if(oBlock.data?.unit != 'search-results' || !oBlock.data?.data) {
            setPopupContent('');
            return;
        }

        const sContent = (
            <View className="w-full mt-1">
                {oBlock.data.data.map((a, index) => <SearchResults key={index} data={a} onPress={() => handleClose()} />)}
            </View>
        );

        setPopupContent(sContent);            
    }

    const handleClick = (sUrl) => {
        handleClose();

        redirectdRef.current.redirect(sUrl);
    }

    const handleClose = () => {
        setPopupOpen(false);
        setPopupContent('');
    }

    const sTxtTitle = appSetting('lang_keys', 'search_popup_title');
    const sTxtViewExtended = appSetting('lang_keys', 'search_popup_view_extended');

    return (
        <DropdownPopup open={popupOpen} onOpenChange={(bOpen) => {!bOpen && setPopupContent(''); setPopupOpen(bOpen)}} title={sTxtTitle}>{[
            <Button key="ddp-trigger" variant="text" startDecorator="search" rounded />, 
            <View key="ddp-content" className="px-1.5 pb-1.5">
                <Redirect ref={redirectdRef} />
                <View className="flex-row items-center mb-1">
                    <Text className="text-gray-700 dark:text-gray-300 text-lg flex-auto font-bold ml-0.5">{sTxtTitle}</Text>
                    <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title={sTxtViewExtended} onPress={() => handleClick('/search')} />
                </View>
                <View className="flex-row">
                    <Input name="search" onChangeText={(value) => handleSearch(value)} defaultValue="" accessibilityLabel="Search" />
                </View>
                {!!popupContent && popupContent}
            </View>
        ]}
        </DropdownPopup>
    );
 }
