import { useState, useRef, useEffect, useContext } from 'react';
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { Pressable, View, Row, ViewRef, ScrollView } from 'app/design/view'
import { Button, ButtonRef, InputRef, InputRounded, InputRoundedRef, Modal } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import { UnitSearchResultsSmall as SearchResults } from 'app/components/units/search-results';
import Link from 'app/ui/atoms/link';
import { useTranslation } from 'react-i18next';
import { useBottomSheetData } from 'app/context/bottomsheet';
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useWindowDimensions } from 'react-native'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'


export default function ElementSearch(oProps) {
    const { setBottomSheetData } = useBottomSheetData();
    const sType = oProps?.type ? oProps.type : 'default';
    const oParams = oProps?.params ? oProps.params : {};
    const [showModal, setShowModal] = useState(false);

    const handleOpenPopupDefault = () => {
        setShowModal(true);
        //setBottomSheetData({ title: 'Search', content:<ElementSearchData {...oProps} isBottomSheet={true} />, showClose: true, isListView: true, snapPoints: ['75%', '90%'] });
    }

    let sResult = sType == 'input' ? (
        <ElementSearchData {...oProps} resInPopup={true} setBottomSheetData={setBottomSheetData} />
    ) : (
        <Row>
            <View key="ddp-trigger" className="flex-row">
                <ButtonRef title={oProps.title === undefined ? "" : oProps.title} variant="secondary" startDecorator={oParams?.trigger?.icon ? oParams?.trigger.icon : "Search"} rounded size="sm" ring="p-1" tooltip={oProps.tooltip === undefined ? "Search" : oProps.tooltip} onPress={() => handleOpenPopupDefault()} {...oParams?.trigger} />
            </View>
        </Row>
    );

    if (oProps.children) {
        sResult = <Pressable onPress={() => handleOpenPopupDefault()}>{oProps.children}</Pressable>;
    }

    return <>{sResult}
        <Modal title="Search" outerClickClose={false} onVisible={!!showModal} onClose={() => { setShowModal(false) }} transparent={false}>
            <ElementSearchData onClose={() => { setShowModal(false) }} {...oProps} />
        </Modal>

    </>;
}

export function SearchPanel(props) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(props.value); return (
        <View className=' backdrop-blur bg-bgrnavbar dark:bg-bgrnavbar-d ' >
            <View className={appSetting('layout', 'max_width') + '  mx-auto w-full px-3 sm:px-4 pb-3 pt-1'}>
                <Row className='gap-x-2 justify-center items-center'>
                    <Input name="search" placeholder={t("Search") + '...'} defaultValue={inputValue} role="textbox" aria-label="Search"
                        onChangeText={(value) => {
                            setInputValue(value)
                        }}
                    />
                    <Link href={'/search-keyword?keyword=' + inputValue + '&section=' + props.section}><Button variant="outline" ring="p-1" size="sm" endDecorator="Search" /></Link>
                </Row>
            </View>
        </View>
    );
}

export function ElementSearchData(oProps) {
    const { setBottomSheetData } = useBottomSheetData();
    const redirectdRef = useRef();
    const sSection = oProps?.section ? oProps.section : '';
    const sUrlRedirect = '/search-keyword?keyword={keyword}' + (!!sSection ? '&section=' + sSection : '');
    const windowDimensions = useWindowDimensions();
    const [inputValue, setInputValue] = useState('');
    const [popupOpenHandle, setPopupOpenHandle] = useState(true);
    const [popupContent, setPopupContent] = useState('');
    const { t } = useTranslation();
    const sTxtTitle = t("Search");
    const sTxtViewExtended = t("See all results");
    const sType = oProps?.type ? oProps.type : 'default';

    const inputRef = useRef();

    const getSkeleton = () => {
        return (
            <View className="w-full px-2">
                {[...Array(1, 2, 3)].map(i =>
                    <View key={i} className="flex-col mb-2 p-2 bg-neutral-500/5 rounded-xl">
                        <View className="animate-pulse flex-row items-center gap-y-1">
                            <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
                            <View className="flex-1 gap-y-1">
                                <View className="h-4 w-1/2 bg-neutral-600/20 rounded-full"></View>
                                <View className="h-3 w-1/3 bg-neutral-600/20 rounded-full"></View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    useEffect(() => {
        if (!oProps.resInPopup)
            inputRef.current && inputRef.current.focus()
    }, []);

    const handleKeyPress = (event) => {
        if (event.key !== "Enter")
            return;

        if (!appSetting('layout', 'extended_search'))
            setBottomSheetData(false)
        else
            handleRedirect();
    };

    const handleRedirect = () => {
        setBottomSheetData(false);
        redirectdRef.current.redirect(sUrlRedirect.replace('{keyword}', inputValue));
    };

    const handleClose = (url) => {
        console.log("urlurlurl", url)
        oProps.onClose && oProps.onClose();
        redirectdRef.current.redirect(url);
        // setBottomSheetData(false);
        // 
    }



    const handleSetPopupContent = (sContent) => {
        setPopupContent(sContent);
        if (sType == 'default') {
            //  setPopupOpen(!!sContent);

            if (!!sContent) {
                setPopupOpenHandle(false);

                inputRef.current && inputRef.current.focus();
            }
        }
    }

    const handleSearch = async (sValue) => {
        setInputValue(sValue);

        if (!sValue || sValue.length < 3)
            return;

        // if (sValue.length == 3)
        //    handleSetPopupContent(getSkeleton());

        const aParams = {
            params: {
                keyword: sValue,
                section: sSection.trim(),
            }
        };

        const sResponse = await fetcher('/api.php?r=system/get_data_search_api/TemplServices&params=' + JSON.stringify(aParams));
        if (!sResponse?.data) {
            handleSetPopupContent('aa');
        }

        const oBlock = sResponse.data.shift();
        if (oBlock.data?.unit != 'search-results' || !oBlock.data?.data || !oBlock.data.data.length) {
            handleSetPopupContent(appStatic('components_content_empty'));
        }

        const sContent = (
            <View className="w-full mt-1">
                {oBlock.data.data.map((a, index) => <SearchResults key={index} data={a} onPress={(url) => handleClose(url)} />)}
            </View>
        );
        if (oBlock.data.data.length == 0) {
            handleSetPopupContent(appStatic('components_content_empty'))
            return
        }

        handleSetPopupContent(sContent);
        inputRef.current && inputRef.current.focus();

    }

    const cnt = !!popupContent && popupContent

    const cnt2 = (
        
            <Button variant="link" size="sm" fullWidth endDecorator="ChevronsRight" title={sTxtViewExtended} onPress={() => handleRedirect()} />
        
    );

    if (oProps.resInPopup) {

        return (

            <Row className='w-full'>
                <Redirect ref={redirectdRef} />
                {oProps.icon}
                <DropdownPopup
                    open={!!popupContent}
                    onOpenChange={async (bOpen) => {
                        setPopupContent(false);
                    }}
                    trigger={<InputRoundedRef
                        name="search"
                        placeholder={t("Search") + '...'}
                        onKeyPress={(event) => handleKeyPress(event)}
                        value={inputValue}
                        ref={inputRef}
                        onChangeText={(value) => handleSearch(value)}
                        startDecorator="Search"
                    />}
                >
                    <View key="search-data">
                        {cnt2}
                        <View className="max-h-96">
                            <ScrollView>
                                {cnt}
                            </ScrollView>
                        </View>
                    </View>
                </DropdownPopup>
            </Row>
        )
    }

    if (oProps.isBottomSheet && windowDimensions.width < LAYOUT_BREAKPOINTS.lg) {
        return (
            <><View className="flex-row mb-2">
                <InputRef name="search" autoFocus={true} placeholder='Start typing to search...' onKeyPress={(event) => handleKeyPress(event)} value={inputValue} ref={inputRef} onChangeText={(value) => handleSearch(value)} />
            </View>
                <BottomSheetScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none">
                    {cnt}
                    <View className="h-20 w-full bg-red-500"></View>
                    <Redirect ref={redirectdRef} />
                    {
                        (!!inputValue && appSetting('layout', 'extended_search')) && (
                            <View className="hidden flex-row items-center mb-2 justify-end">
                                <Button variant="text" size="sm" rounded endDecorator="ChevronsRight" title={sTxtViewExtended} onPress={() => handleRedirect()} />
                            </View>
                        )
                    }
                </BottomSheetScrollView></>
        )
    }

    return (
        <View className='web:h-screen lg:h-96 web:pb-20 web:lg:pb-0'>
            <Redirect ref={redirectdRef} />
            {
                (!!inputValue && appSetting('layout', 'extended_search')) && (
                    <View className="hidden flex-row items-center m-2 justify-end">
                        <Button variant="text" size="sm" rounded endDecorator="ChevronsRight" title={sTxtViewExtended} onPress={() => handleRedirect()} />
                    </View>
                )
            }
            <View className="flex-row p-1 mb-2">
                <InputRef name="search" autoFocus={true} placeholder='Start typing to search...' onKeyPress={(event) => handleKeyPress(event)} value={inputValue} ref={inputRef} onChangeText={(value) => handleSearch(value)} />
            </View>
            <KbAvoidingView className="web:flex-1" offset={80}>
                <ScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none" >
                    <View >
                        {cnt}
                    </View>
                </ScrollView>
            </KbAvoidingView>
        </View>
    );
}
