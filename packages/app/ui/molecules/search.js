import { useState, useRef, useEffect, useContext } from 'react';
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { Pressable, View, Row, ScrollView } from 'app/design/view'
import { Button, ButtonRef, InputRef, InputRounded, InputRoundedRef, Modal } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import { UnitSearchResultsSmall as SearchResults } from 'app/components/units/search-results';
import Link from 'app/ui/atoms/link';
import { useTranslation } from 'react-i18next';
import { useBottomSheetData } from 'app/context/bottomsheet';
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { appStatic } from 'app/lib/app-static'

export default function ElementSearch(oProps) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const { t } = useTranslation();
    const sType = oProps?.type ? oProps.type : 'default';
    const oParams = oProps?.params ? oProps.params : {};
    const [inputValue, setInputValue] = useState('');

    const handleOpenPopupDefault = () => {
        /*if (!bottomSheetData){
            setBottomSheetData({ title: 'Search', content: <ElementSearchData {...oProps} />,showClose: true, snapPoints: ['75%', '100%'] });
        }else{
            setBottomSheetData(false);
        }*/
        setBottomSheetData({ title: 'Search', content: <ElementSearchData {...oProps} />,showClose: true, snapPoints: ['75%', '90%'] });
    }

    let sResult = sType == 'input' ? (
        <ElementSearchData {...oProps} resInPopup={true} setBottomSheetData={setBottomSheetData} />
    ) : (
        <Row>
            <View key="ddp-trigger" className="flex-row">
                <ButtonRef title={oProps.title === undefined ? "" : oProps.title} variant="secondary"  startDecorator={oParams?.trigger?.icon ? oParams?.trigger.icon : "Search"} rounded tooltip={oProps.tooltip === undefined ? "Search" : oProps.tooltip} onPress={() => handleOpenPopupDefault()} {...oParams?.trigger} />
            </View>
        </Row>
    );

    if (oProps.children) {
        return <Pressable onPress={() => handleOpenPopupDefault()}>{oProps.children}</Pressable>;
    }

    return sResult;
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
                    <Link href={'/search-keyword?keyword=' + inputValue + '&section=' + props.section}><Button variant="outline" size="base" endDecorator="Search" /></Link>
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

    const [inputValue, setInputValue] = useState('');
    const [popupOpenHandle, setPopupOpenHandle] = useState(true);
    const [popupContent, setPopupContent] = useState('');
    const { t } = useTranslation();
    const sTxtTitle = t("Search");
    const sTxtViewExtended = t("Extended");
    const sType = oProps?.type ? oProps.type : 'default';

    const inputRef = useRef();

    const getSkeleton = () => {
        return (
            <View className="w-full mt-1">
                {[...Array(1, 2, 3)].map(i =>
                    <View key={i} className="flex-col my-2 p-2 bg-neutral-500/5 sm:rounded-lg">
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

    const handleClose = () => {
        setBottomSheetData(false);
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
                {oBlock.data.data.map((a, index) => <SearchResults key={index} data={a} onPress={() => handleClose()} />)}
            </View>
        );
        if (oBlock.data.data.length == 0){
            handleSetPopupContent(appStatic('components_content_empty'))
            return 
        }

        handleSetPopupContent(sContent);
        inputRef.current && inputRef.current.focus();

    }

    const cnt = (
        <ScrollView className="max-h-96">
            {!!popupContent && popupContent}
        </ScrollView>
    )

    const cnt2 = (
            <View className=" flex-row items-center justify-end">
                <Button variant="text" size="sm" rounded endDecorator="ChevronsRight" title={sTxtViewExtended} onPress={() => handleRedirect()} />
            </View>
    );

    


    if (oProps.resInPopup) {
        const dd = <DropdownPopup
            open={!!popupContent}
            onOpenChange={async (bOpen) => {
                setPopupContent(false);
            }}
        >
            {[
                <View key="search-dbg"></View>,
                <View key="search-data">
                    {cnt2}
                    {cnt}
                </View>
            ]}
        </DropdownPopup>
        return (

            <Row className='w-full'>
                <Redirect ref={redirectdRef} />
                {oProps.icon}
                {!!popupContent && dd}
                <InputRoundedRef name="search" placeholder={t("Search") + '...'} onKeyPress={(event) => handleKeyPress(event)} value={inputValue} ref={inputRef} onChangeText={(value) => handleSearch(value)} />
                <View className="absolute h-[40px] w-[20px] items-center justify-center ml-2 text-neutral-500  "><Icon icon="Search" size={20} /></View>
            </Row>
        )
    }

    return (
        <View className='lg:h-96'>
            <Redirect ref={redirectdRef} />
            {
                (!!inputValue && appSetting('layout', 'extended_search')) && (
                    <View className="hidden flex-row items-center mb-2 justify-end">
                        <Button variant="text" size="sm" rounded endDecorator="ChevronsRight" title={sTxtViewExtended} onPress={() => handleRedirect()} />
                    </View>
                )
            }
        <View className="flex-row p-1 mb-2">
                <InputRef name="search" autoFocus={true} placeholder='Start typing to search...' onKeyPress={(event) => handleKeyPress(event)} value={inputValue} ref={inputRef} onChangeText={(value) => handleSearch(value)} />
            </View>
            {cnt}
        </View>
    );
}
