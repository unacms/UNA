import { useState, useRef, useEffect } from 'react'
import { Platform } from 'react-native'
import { appSetting, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { Text } from 'app/design/typography'
import { Pressable, View, Row, ScrollView } from 'app/design/view'
import {
    NeoButton,
    NeoButtonRef,
    NeoButtonLink,
    Input,
    Modal,
} from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { UnitSearchResultsSmall as SearchResults } from 'app/components/units/search-results'
import { useTranslation } from 'react-i18next'
import { useBottomSheetData } from 'app/context/bottomsheet'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { BottomSheetScrollView } from 'app/ui/atoms/bottomsheet-scroll-view'
import { useIsDesktop } from 'app/context/measure';

export default function ElementSearch(oProps) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop();
    const { setBottomSheetData } = useBottomSheetData()
    const sType = oProps?.type ? oProps.type : 'default'
    const oParams = oProps?.params ? oProps.params : {}
    const [showModal, setShowModal] = useState(false)

    const handleOpenPopupDefault = () => {
        if (oParams?.trigger?.onPress) {
            oParams.trigger.onPress()
        }
        setShowModal(true)
    }

    const toolbarNeoButtonDefaults = getHeaderToolbarNeoButtonDefaults(isDesktop);

    let sResult =
        sType == 'input' ? (
            <ElementSearchData
                {...oProps}
                resInPopup={true}
                setBottomSheetData={setBottomSheetData}
            />
        ) : (
            <NeoButtonRef
                key="ddp-trigger"
                title={oProps.title === undefined ? '' : oProps.title}
                image={
                    oParams?.trigger?.icon
                        ? oParams?.trigger.icon
                        : 'Search'
                }
                tooltip={
                    oProps.tooltip === undefined ? 'Search' : oProps.tooltip
                }
                {...toolbarNeoButtonDefaults}
                {...(oParams?.trigger &&
                    (({ onPress, ...rest }) => rest)(oParams.trigger))}
                borderShape="circle"
                onPress={handleOpenPopupDefault}
            />
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
                        className="w-full flex-1 min-w-0"
                        name="search"
                        placeholder={t('Search') + '...'}
                        defaultValue={inputValue}
                        role="textbox"
                        aria-label={t('Search')}
                        onChangeText={(value) => {
                            setInputValue(value)
                        }}
                    />
                    <NeoButtonLink
                        href={
                            '/search-keyword?keyword=' +
                            inputValue +
                            '&section=' +
                            props.section
                        }
                        controlSize="small"
                        image="Search"
                        accessibilityLabel={t('Search')}
                        classNames={{ root: 'self-center' }}
                    />
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
    const [popupContent, setPopupContent] = useState('')
    const { t } = useTranslation()
    const sTxtViewExtended = t('See all results')

    const inputRef = useRef()

    const searchRequest = useRef(null)

    useEffect(() => {
        if (!oProps.resInPopup) inputRef.current?.focus()
        return () => searchRequest.current?.abort()
    }, [oProps.resInPopup])

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

    const handleSearch = async (value) => {
        setInputValue(value)
        searchRequest.current?.abort()
        setPopupContent(null)
        if (oProps.noPopup || value.length < 3) return

        const controller = new AbortController()
        searchRequest.current = controller
        const params = {
            params: { keyword: value, section: sSection.trim(), live: true },
        }

        try {
            const response = await fetcher(
                '/api.php?r=system/get_data_search_api/TemplServicesSearch&params=' + JSON.stringify(params),
                false,
                { signal: controller.signal },
            )
            if (controller.signal.aborted) return

            const block = response?.data?.[0]?.data
            const results = block?.unit === 'search-results' && Array.isArray(block.data)
                ? block.data
                : []
            setPopupContent(results.length ? (
                <View className="w-full mt-1">
                    {results.map((item, index) => (
                        <SearchResults key={index} data={item} onPress={handleClose} />
                    ))}
                </View>
            ) : appStatic('components_content_empty'))
            inputRef.current?.focus()
        } catch {
            if (!controller.signal.aborted) {
                setPopupContent(
                    <Text className="text-destructive p-2">
                        {t('Something didn’t go as planned. Please try again or reload the page.')}
                    </Text>,
                )
            }
        }
    }

    const cnt = !!popupContent && popupContent

    const cnt2 = (
        <NeoButton
            style="borderless"
            controlSize="small"
            width="fill"
            image="ChevronsRight"
            imagePlacement="trailing"
            label={sTxtViewExtended}
            classNames={{ root: 'self-stretch' }}
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
                    onOpenChange={() => {
                        searchRequest.current?.abort()
                        setPopupContent(null)
                    }}
                    trigger={
                        <Input
                            className="w-full"
                            rounded="full"
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
                    <View key="search-data" className="web:px-1.5 web:pt-1.5">
                        {cnt2}
                        <View className="max-h-96">
                            <ScrollView>{cnt}</ScrollView>
                        </View>
                    </View>
                </DropdownPopup>
            </Row>
        )
    }

    if (Platform.OS !== 'web' && oProps.isBottomSheet && !isDesktop) {
        return (
            <>
                <View className="w-full mb-2">
                    <Input
                        className="w-full"
                        name="search"
                        autoFocus={true}
                        placeholder={t('Start typing to search...')}
                        onKeyPress={(event) => handleKeyPress(event)}
                        value={inputValue}
                        ref={inputRef}
                        onChangeText={(value) => handleSearch(value)}
                    />
                </View>
                <BottomSheetScrollView
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                >
                    {cnt}

                    <Redirect ref={redirectdRef} />
                    {!!inputValue &&
                        appSetting('layout', 'extended_search') && (
                            <View className="hidden flex-row items-center mb-2 justify-end">
                                <NeoButton
                                    style="borderless"
                                    controlSize="small"
                                    borderShape="capsule"
                                    image="ChevronsRight"
                                    imagePlacement="trailing"
                                    label={sTxtViewExtended}
                                    onPress={() => handleRedirect()}
                                />
                            </View>
                        )}
                </BottomSheetScrollView>
            </>
        )
    }

    return (
        <View className="web:h-screen lg:h-96 web:pb-20 web:lg:pb-0">
            <Redirect ref={redirectdRef} />
            {!!inputValue && appSetting('layout', 'extended_search') && (
                <View className="hidden flex-row items-center m-2 justify-end">
                    <NeoButton
                        style="borderless"
                        controlSize="small"
                        borderShape="capsule"
                        image="ChevronsRight"
                        imagePlacement="trailing"
                        label={sTxtViewExtended}
                        onPress={() => handleRedirect()}
                    />
                </View>
            )}
            <View className="w-full p-1 mb-2">
                <Input
                    className="w-full"
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
                    {cnt && <View className="items-end web:px-1.5 web:pt-1.5">{cnt2}</View>}
                    <View>{cnt}</View>
                </ScrollView>
            </KbAvoidingView>
        </View>
    )
}
