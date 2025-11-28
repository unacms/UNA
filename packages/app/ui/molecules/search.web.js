/**
 * Search Component - Web Implementation
 * 
 * Uses regular ScrollView instead of BottomSheetScrollView.
 * This avoids the @gorhom/bottom-sheet dependency on web.
 */

import { useState, useRef, useEffect } from 'react'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { Text } from 'app/design/typography'
import { Pressable, View, Row, ScrollView } from 'app/design/view'
import {
    Button,
    ButtonRef,
    InputRef,
    InputRoundedRef,
    Modal,
} from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { UnitSearchResultsSmall as SearchResults } from 'app/components/units/search-results'
import Link from 'app/ui/atoms/link'
import { useTranslation } from 'react-i18next'
import { useBottomSheetData } from 'app/context/bottomsheet'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { useIsDesktop } from 'app/context/measure';

export default function ElementSearch(oProps) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop();
    const { setBottomSheetData } = useBottomSheetData()
    const sType = oProps?.type ? oProps.type : 'default'
    const oParams = oProps?.params ? oProps.params : {}
    const [showModal, setShowModal] = useState(false)

    const buttonVariant = isDesktop ? 'secondary' : 'text'
    const buttonSize = isDesktop ? 'base' : 'base'

    const handleOpenPopupDefault = () => {
        if (oParams?.trigger?.onPress) {
            oParams.trigger.onPress()
        }
        setShowModal(true)
    }

    let sResult =
        sType == 'input' ? (
            <ElementSearchData
                {...oProps}
                resInPopup={true}
                setBottomSheetData={setBottomSheetData}
            />
        ) : (
            <Pressable key="ddp-trigger" onPress={handleOpenPopupDefault}>
                <ButtonRef
                    title={oProps.title === undefined ? '' : oProps.title}
                    startDecorator={
                        oParams?.trigger?.icon
                            ? oParams?.trigger.icon
                            : 'Search'
                    }
                    rounded
                    tooltip={
                        oProps.tooltip === undefined ? 'Search' : oProps.tooltip
                    }
                    {...(oParams?.trigger &&
                        (({ onPress, ...rest }) => rest)(oParams.trigger))}
                    variant={buttonVariant}
                    size={buttonSize}
                />
            </Pressable>
        )

    if (oProps.children) {
        sResult = (
            <Pressable onPress={() => handleOpenPopupDefault()}>
                {oProps.children}
            </Pressable>
        )
    }

    return (
        <>
            {sResult}
            <Modal
                title={t('Search')}
                onVisible={!!showModal}
                onClose={() => {
                    setShowModal(false)
                }}
                transparent={false}
            >
                <ElementSearchData
                    onClose={() => {
                        setShowModal(false)
                    }}
                    {...oProps}
                />
            </Modal>
        </>
    )
}

export function SearchPanel(props) {
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState(props.value)
    return (
        <View className=" backdrop-blur bg-card ">
            <View
                className={
                    appSetting('layout', 'max_width') +
                    '  mx-auto w-full px-3 sm:px-4 pb-3 pt-1'
                }
            >
                <Row className="gap-x-2 justify-center items-center">
                    <Input
                        name="search"
                        placeholder={t('Search') + '...'}
                        defaultValue={inputValue}
                        role="textbox"
                        aria-label="Search"
                        onChangeText={(value) => {
                            setInputValue(value)
                        }}
                    />
                    <Link
                        href={
                            '/search-keyword?keyword=' +
                            inputValue +
                            '&section=' +
                            props.section
                        }
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            endDecorator="Search"
                        />
                    </Link>
                </Row>
            </View>
        </View>
    )
}

export function ElementSearchData(oProps) {
    const { setBottomSheetData } = useBottomSheetData()
    const isDesktop = useIsDesktop();
    const redirectdRef = useRef()
    const sSection = oProps?.section ? oProps.section : ''
    const sUrlRedirect =
        '/search-keyword?keyword={keyword}' +
        (!!sSection ? '&section=' + sSection : '')
    const [inputValue, setInputValue] = useState('')
    const [popupOpenHandle, setPopupOpenHandle] = useState(true)
    const [popupContent, setPopupContent] = useState('')
    const { t } = useTranslation()
    const sTxtTitle = t('Search')
    const sTxtViewExtended = t('See all results')
    const sType = oProps?.type ? oProps.type : 'default'

    const inputRef = useRef()

    const getSkeleton = () => {
        return (
            <View className="w-full px-2">
                {[...Array(1, 2, 3)].map((i) => (
                    <View
                        key={i}
                        className="flex-col mb-2 p-2 bg-bgritem dark:bg-bgritem-d rounded-xl"
                    >
                        <View className="animate-pulse flex-row items-center gap-y-1">
                            <View className="rounded-full bg-neutral-600/20 h-10 w-10"></View>
                            <View className="flex-1 gap-y-1">
                                <View className="h-4 w-1/2 bg-neutral-600/20 rounded-full"></View>
                                <View className="h-3 w-1/3 bg-neutral-600/20 rounded-full"></View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        )
    }

    useEffect(() => {
        if (!oProps.resInPopup) inputRef.current && inputRef.current.focus()
    }, [])

    const handleKeyPress = (event) => {
        if (event.key !== 'Enter') return

        if (!appSetting('layout', 'extended_search')) setBottomSheetData(false)
        else handleRedirect()
    }

    const handleRedirect = () => {
        setBottomSheetData(false)
        redirectdRef.current.redirect(
            sUrlRedirect.replace('{keyword}', inputValue)
        )
    }

    const handleClose = (url) => {
        oProps.onClose && oProps.onClose()
        redirectdRef.current.redirect(url)
    }

    const handleSetPopupContent = (sContent) => {
        setPopupContent(sContent)
        if (sType == 'default') {
            if (!!sContent) {
                setPopupOpenHandle(false)

                inputRef.current && inputRef.current.focus()
            }
        }
    }

    const handleSearch = async (sValue) => {
        setInputValue(sValue)

        if (oProps.noPopup || !sValue || sValue.length < 3) return

        const aParams = {
            params: {
                keyword: sValue,
                section: sSection.trim(),
                live: true,
            },
        }

        const sResponse = await fetcher(
            '/api.php?r=system/get_data_search_api/TemplServices&params=' +
                JSON.stringify(aParams)
        )
        if (!sResponse?.data) {
            handleSetPopupContent('aa')
        }

        const oBlock = sResponse.data.shift()
        if (
            oBlock.data?.unit != 'search-results' ||
            !oBlock.data?.data ||
            !oBlock.data.data.length
        ) {
            handleSetPopupContent(appStatic('components_content_empty'))
        }

        const sContent = (
            <View className="w-full mt-1">
                {oBlock.data.data.map((a, index) => (
                    <SearchResults
                        key={index}
                        data={a}
                        onPress={(url) => handleClose(url)}
                    />
                ))}
            </View>
        )
        if (oBlock.data.data.length == 0) {
            handleSetPopupContent(appStatic('components_content_empty'))
            return
        }

        handleSetPopupContent(sContent)
        inputRef.current && inputRef.current.focus()
    }

    const cnt = !!popupContent && popupContent

    const cnt2 = (
        <Button
            variant="link"
            size="sm"
            fullWidth
            endDecorator="ChevronsRight"
            title={sTxtViewExtended}
            onPress={() => handleRedirect()}
        />
    )

    if (oProps.resInPopup) {
        return (
            <Row className="w-full">
                <Redirect ref={redirectdRef} />
                {oProps.icon}
                <DropdownPopup
                    open={!!popupContent}
                    onOpenChange={async (bOpen) => {
                        setPopupContent(false)
                    }}
                    trigger={
                        <InputRoundedRef
                            name="search"
                            placeholder={t('Search') + '...'}
                            onKeyPress={(event) => handleKeyPress(event)}
                            value={inputValue}
                            ref={inputRef}
                            onChangeText={(value) => handleSearch(value)}
                            startDecorator={
                                oProps.triggerIcon
                                    ? oProps.triggerIcon
                                    : 'Search'
                            }
                        />
                    }
                >
                    <View key="search-data">
                        {cnt2}
                        <View className="max-h-96">
                            <ScrollView>{cnt}</ScrollView>
                        </View>
                    </View>
                </DropdownPopup>
            </Row>
        )
    }

    // On web, we don't have BottomSheet, so use regular ScrollView
    // The isBottomSheet case on native uses BottomSheetScrollView
    return (
        <View className="h-screen lg:h-96 pb-20 lg:pb-0">
            <Redirect ref={redirectdRef} />
            {!!inputValue && appSetting('layout', 'extended_search') && (
                <View className="hidden flex-row items-center m-2 justify-end">
                    <Button
                        variant="text"
                        size="sm"
                        rounded
                        endDecorator="ChevronsRight"
                        title={sTxtViewExtended}
                        onPress={() => handleRedirect()}
                    />
                </View>
            )}
            <View className="flex-row p-1 mb-2">
                <InputRef
                    name="search"
                    autoFocus={true}
                    placeholder={t('Start typing to search...')}
                    onKeyPress={(event) => handleKeyPress(event)}
                    value={inputValue}
                    ref={inputRef}
                    onChangeText={(value) => handleSearch(value)}
                />
            </View>
            <KbAvoidingView>
                <ScrollView
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                >
                    {cnt && <View className="items-end">{cnt2}</View>}
                    <View>{cnt}</View>
                </ScrollView>
            </KbAvoidingView>
        </View>
    )
}

