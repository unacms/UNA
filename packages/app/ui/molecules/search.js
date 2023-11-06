import { useState, useRef, useEffect } from 'react';

import { appSetting } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { Text } from 'app/design/typography'
import { Pressable, View, Row, ScrollView } from 'app/design/view'
import { Button, Input, InputRounded, Modal } from 'app/design/controls';
import Redirect from 'app/ui/atoms/redirect';
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
import {UnitSearchResultsSmall as SearchResults} from 'app/components/units/search-results';
import Link from '../../ui/atoms/link';
import { useTranslation } from 'react-i18next';

export default function ElementSearch(oProps) {
    const { t } = useTranslation();
    const redirectdRef = useRef();

    const sType = oProps?.type ? oProps.type : 'default';

    const [popupOpen, setPopupOpen] = useState(false);
    const [popupOpenHandle, setPopupOpenHandle] = useState(true);
    const [popupContent, setPopupContent] = useState('');
    const [inputValue, setInputValue] = useState('');
    

    const getSkeleton = () => {
        return (
            <View className="w-full mt-1">
            {[...Array(1, 2, 3)].map( i => 
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

    const handleSearch = async (sValue) => {
        setInputValue(sValue);

        if(!sValue || sValue.length < 3)
            return;

        handleSetPopupContent(getSkeleton());

        const aParams = {params: {
                keyword: sValue,
            }
        };

        const sResponse = await fetcher('/api.php?r=system/get_data_search_api/TemplServices&params=' + JSON.stringify(aParams));
        if(!sResponse?.data) {
            handleSetPopupContent('');
        }

        const oBlock = sResponse.data.shift();
        if(oBlock.data?.unit != 'search-results' || !oBlock.data?.data || !oBlock.data.data.length) {
            handleSetPopupContent('');
        }

        const sContent = (
            <View className="w-full mt-1">
                {oBlock.data.data.map((a, index) => <SearchResults key={index} data={a} onPress={() => handleClose()} />)}
            </View>
        );

        handleSetPopupContent(sContent);
    }

    const handleClose = () => {
        setPopupOpen(false);
        setPopupContent('');
    }

    const handleClick = (sUrl) => {
        handleClose();
    }

    const handleSetPopupContent = (sContent) => {
        setPopupContent(sContent);
        if(sType == 'default') {
            setPopupOpen(!!sContent);

            if(!!sContent) {
                setPopupOpenHandle(false);

                inputRef.current && inputRef.current.focus();
            }
        }
    }

    const sTxtTitle = t("Search");
    const sTxtViewExtended = t("Extended");

    const inputRef = useRef();

    let sResult = undefined;
    switch(sType) {
        /*case 'rdx_button':
            const handleOpenPopupRdxButton = (bOpen) => {
                if(bOpen)
                    setTimeout(() => {inputRef.current && inputRef.current.focus()}, 100);
                else
                    setPopupContent(''); 

                setPopupOpen(bOpen); 
            }

            sResult = (
                <DropdownPopup open={popupOpen} onOpenChange={(bOpen) => {handleOpenPopupRdxButton(bOpen)}} title={sTxtTitle}>{[
                    <Button key="ddp-trigger" variant="outline" fullWidth startDecorator="search" rounded />, 
                    <View key="ddp-content" className="px-1.5 pb-1.5">
                        <Redirect ref={redirectdRef} />
                        <View className="flex-row items-center mb-1">
                            <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">{sTxtTitle}</Text>
                            {
                                inputValue != '' && <Link href={'/search-keyword?keyword=' + inputValue}>
                                    <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title={sTxtViewExtended} onPress={() => handleClick()} />
                                </Link>
                            }
                        </View>
                        <View className="flex-row">
                            <Input name="search" ref={inputRef} onChangeText={(value) => handleSearch(value)}  role="textbox" aria-label="Search" />
                        </View>
                        {!!popupContent && popupContent}
                    </View>
                ]}
                </DropdownPopup>
            );
            break;
        */
        /*case 'rdx_input':
            const handleOpenPopupRdxInput = (bOpen) => {
                if(bOpen)
                    inputRef.current && inputRef.current.focus();
                else {
                    if(popupOpenHandle) {
                        setPopupContent('');
                        setPopupOpen(bOpen);
                    }

                    setPopupOpenHandle(true);
                }
            };

            sResult = (
                <Row className=''>
                    <DropdownPopup open={popupOpen} onOpenChange={(bOpen) => handleOpenPopupRdxInput(bOpen)} title={sTxtTitle} asChildTrigger>{[
                        <View key="ddp-trigger" className="flex-row">
                            <InputRounded name="search" ref={inputRef} onChangeText={(value) => handleSearch(value)} value={inputValue} placeholder="Search..." role="textbox" aria-label="Search" />
                        </View>,
                        <View key="ddp-content" className="px-1.5 pb-1.5">
                            <Redirect ref={redirectdRef} />
                            <View className="flex-row items-center">
                                <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">{sTxtTitle}</Text>
                                {
                                    inputValue != '' &&  <Link href={'/search-keyword?keyword=' + inputValue}>
                                        <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title={sTxtViewExtended} onPress={() => handleClick()} />
                                    </Link>
                                }
                            </View>
                            {!!popupContent && popupContent}
                        </View>
                    ]}
                    </DropdownPopup>
                </Row>
            );
            break;
        */
        case 'input':
        case 'button':
        case 'default':
        default:
            const handleOpenPopupDefault = () => {
                setTimeout(() => {
                    inputRef.current && inputRef.current.focus()
                }, 100);

                setPopupOpen(true); 
            }

            const handleClosePopupDefault = () => {
                setPopupContent(''); 

                setPopupOpen(false); 
            }

            const sTrigger = sType == 'input' ? (
                <Pressable onPress={() => handleOpenPopupDefault()}>
                    <InputRounded name="search" value={inputValue}  onChangeText={(value) => {handleSearch(value);handleOpenPopupDefault()}} placeholder={t("Search")+'...'} role="textbox" aria-label="Search" />
                </Pressable>
            ) : (
                <Button variant="outline" fullWidth startDecorator="MagnifyingGlass" rounded onPress={() => handleOpenPopupDefault()} />
            );

            sResult = (
                <Row>
                    <View key="ddp-trigger" className="flex-row">{sTrigger}</View>
                    <Modal key="ddp-content" onVisible={popupOpen} onClose={() => handleClosePopupDefault()} position="top">
                        <View className="px-1.5 pb-1.5">
                            <Redirect ref={redirectdRef} />
                            <View className="flex-row items-center mb-2">
                                <Text className="text-neutral-700 dark:text-neutral-300 text-lg flex-auto font-bold ml-0.5">{sTxtTitle}</Text>
                                {
                                    !!inputValue && <Link href={'/search-keyword?keyword=' + inputValue}>
                                        <Button variant="text" size="sm" rounded endDecorator="CaretDoubleRight" title={sTxtViewExtended} onPress={() => handleClick()} />
                                    </Link>
                                }
                            </View>
                            <View className="flex-row">
                                <Input name="search" value={inputValue} ref={inputRef} onChangeText={(value) => handleSearch(value)} role="textbox" aria-label="Search" />
                            </View>
                            <ScrollView className="max-h-72">
                                {!!popupContent && popupContent}
                            </ScrollView>
                        </View>
                    </Modal>
                </Row>
            );
            break;
    }

    return sResult;
 }

 export function  SearchPanel(props) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(props.value);    return (
        <View className=' backdrop-blur  bg-bgrnavbar dark:bg-bgrnavbar-d ' >
            <View className={appSetting('layout', 'max_width') + '  mx-auto w-full px-4 py-2'}>
                <Row className='gap-x-2 justify-center items-center'>
                    <Input name="search" placeholder={t("Search")+'...'} defaultValue={inputValue} role="textbox" aria-label="Search" 
                        onChangeText={(value) => {
                            setInputValue(value)
                           // props.onChangeKey(value)
                           // window.history.pushState({ }, '', '/search-keyword?keyword='+value+"&section="+props.section );
                        }}
                     />
                    <Link href={'/search-keyword?keyword=' + inputValue + '&section='+ props.section}><Button variant="outline" size="base"  endDecorator="MagnifyingGlass"  /></Link>
                </Row>
            </View>
        </View>
    );
}
