import { useState, useRef, useEffect } from 'react'
import { Platform } from 'react-native'
import { useDebouncer } from '@tanstack/react-pacer'
import { SEARCH_DEBOUNCE_MS } from 'app/lib/search-debounce'
import { appSetting, getHeaderToolbarNeoButtonDefaults } from 'app/lib/util'
import { fetcher } from 'app/lib/fetcher'
import { Text } from 'app/design/typography'
import { Pressable, View, Row, ScrollView } from 'app/design/view'
import {
    NeoButton,
    NeoButtonRef,
    NeoButtonLink,
    Input,
} from 'app/design/controls'
import Redirect from 'app/ui/atoms/redirect'
import { UnitSearchResultsSmall as SearchResults } from 'app/components/units/search-results'
import { useTranslation } from 'react-i18next'
import { useBottomSheetData } from 'app/context/bottomsheet'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { appStatic } from 'app/lib/app-static'
import { useOpenSearchWindow } from 'app/context/jotai/search-window'
import { searchQueryFromScope, searchResultsHref, normalizeSearchQuery } from 'app/lib/search-window'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { BottomSheetScrollView } from 'app/ui/atoms/bottomsheet-scroll-view'
import { useIsDesktop } from 'app/context/measure';
import { Block, BlockContent } from 'app/ui/molecules/page/page-block';

export default function ElementSearch(oProps) {
    const { t } = useTranslation()
    const isDesktop = useIsDesktop();
    const openSearchWindow = useOpenSearchWindow()
    const sType = oProps?.type ? oProps.type : 'default'
    const oParams = oProps?.params ? oProps.params : {}

    // The search window (UNA's one search, as on the site): global from the header, a module's or a context's
    // with the scope its button gives (`section`, `scope`). On phones the header's global Search is Explore's.
    const handleOpenPopupDefault = () => {
        if (oParams?.trigger?.onPress) {
            oParams.trigger.onPress()
        }
        openSearchWindow(searchQueryFromScope(oProps?.scope ?? (oProps?.section ? { section: oProps.section } : null)))
    }

    const toolbarNeoButtonDefaults = getHeaderToolbarNeoButtonDefaults(isDesktop);

    let sResult =
        sType == 'input' ? (
            <ElementSearchData
                {...oProps}
                resInPopup={true}
            />
        ) : (
            <NeoButtonRef
                key="ddp-trigger"
                // `labelled`: a pill reading "Search" (its place says where), as a section's Add beside it; the tooltip
                // and the accessible name keep the scope ("Search in Marcus Bell")
                label={oProps.labelled && oProps?.scope?.title ? t('Search') : undefined}
                title={oProps.title === undefined ? '' : oProps.title}
                image={
                    oParams?.trigger?.icon
                        ? oParams?.trigger.icon
                        : 'Search'
                }
                tooltip={
                    oProps.tooltip === undefined ? (oProps?.scope?.title || t('Search')) : oProps.tooltip
                }
                // An icon-only button: screen readers read this, not the icon's name ("search").
                accessibilityLabel={oProps?.scope?.title || t('Search')}
                aria-haspopup="dialog"
                aria-keyshortcuts={!oProps?.section && !oProps?.scope ? 'Control+K Meta+K' : undefined}
                {...toolbarNeoButtonDefaults}
                {...(oParams?.trigger &&
                    (({ onPress, ...rest }) => rest)(oParams.trigger))}
                borderShape={oProps.labelled && oProps?.scope?.title ? 'capsule' : 'circle'}
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

    return sResult
}

/**
 * The search page's field, in a block as UNA's search form is: the keyword and Search, which opens the results for it
 * in the section shown.
 */
export function SearchPanel(props) {
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState(props.value)
    // the page's other params stay (a date, list=1), so a new keyword searches where the page was
    const href = searchResultsHref({ ...normalizeSearchQuery(props.params ?? {}), ...normalizeSearchQuery({ keyword: inputValue, section: props.section }) })
        + (props.params?.list ? (inputValue || props.section ? '&' : '?') + 'list=1' : '')
    return (
        <View className={appSetting('layout', 'max_width_block') + ' mx-auto w-full px-3 sm:px-4 pb-3'}>
            <Block>
                <BlockContent>
                    <Row className="gap-x-2 items-center">
                        <Input
                            className="w-full flex-1 min-w-0"
                            name="search"
                            placeholder={t('Search') + '...'}
                            defaultValue={inputValue}
                            role="searchbox"
                            aria-label={t('Search')}
                            onChangeText={(value) => {
                                setInputValue(value)
                            }}
                        />
                        <NeoButtonLink
                            href={href}
                            style="borderedProminent"
                            image="Search"
                            label={t('Search')}
                        />
                    </Row>
                </BlockContent>
            </Block>
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

    // The field updates at once; the request waits until typing pauses, and
    // the previous results stay on screen until the next response replaces them.
    const handleSearch = (value) => {
        setInputValue(value)
        searchRequest.current?.abort()
        if (oProps.noPopup || value.length < 3) {
            searchDebouncer.cancel()
            setPopupContent(null)
            return
        }
        searchDebouncer.maybeExecute(value)
    }

    const closePopup = () => {
        searchDebouncer.cancel()
        searchRequest.current?.abort()
        setPopupContent(null)
    }

    const runSearch = async (value) => {
        // Aborting the previous request drops its stale response.
        searchRequest.current?.abort()
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

    const searchDebouncer = useDebouncer(runSearch, { wait: SEARCH_DEBOUNCE_MS })

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
                    onOpenChange={closePopup}
                    trigger={
                        <Input
                            className="w-full"
                            rounded="full"
                            name="search"
                            accessibilityLabel={t('Search')}
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
                        accessibilityLabel={t('Search')}
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
        // Full height on phones and tablets; on desktop a dialog of a fixed height, so it stays put
        // as results come (UNA's search popup has the same sizes). `web:lg:` outranks `web:`.
        <View className="web:h-screen web:lg:h-96 web:pb-20 web:lg:pb-0">
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
                    accessibilityLabel={t('Search')}
                    autoFocus={true}
                    placeholder={t('Start typing to search...')}
                    onKeyPress={(event) => handleKeyPress(event)}
                    value={inputValue}
                    ref={inputRef}
                    onChangeText={(value) => handleSearch(value)}
                />
            </View>
            {/* Web: the results take the rest of the fixed height and scroll there. */}
            <KbAvoidingView className="web:flex-1 web:min-h-0">
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
