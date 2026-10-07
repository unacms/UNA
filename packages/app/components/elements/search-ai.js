import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import emitter, { EVENTS } from 'app/context/emitter'
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { InputWithIcons, NeoButton, NeoButtonLink } from 'app/design/controls'
import { BlockWrapper } from 'app/components/block-wrapper'
import { Icon } from 'app/ui/atoms/icon'
import Redirect from 'app/ui/atoms/redirect'
import BrowseSimple, { BrowseSimpleView } from 'app/components/elements/browse-simple'
import { UnitSearchResultsSmall } from 'app/components/units/search-results'
import {
    useSearchParse,
    SearchFilterChips,
    SearchExtChips,
    buildSearchUrl,
    fetchSearchResults,
    fetchExtResults,
} from 'app/ui/molecules/search-ai'

/**
 * Block `search_ai` (UNA: system/get_block_search_ai).
 *
 * One input; while typing, the query goes to `system/search_parse` (judge AI model) and
 * comes back as { section, keyword, date } shown as editable chips, then results are
 * fetched for that filter. When the server reports `available: false` (no judge model)
 * the block degrades to a plain keyword search.
 *
 * Two modes, chosen by the block param on the UNA side:
 *  - sections: { mode: 'sections', available, section (locked section or ''), sections [{name,title}], parse_url, search_url, results_url }
 *  - extended: { mode: 'extended', available, object (sys_objects_search_extended), fields [{name,caption,kind}],
 *               parse_url, use_page_results, results_url }
 *    the query is parsed into the object's search fields (Studio > Forms > Search fields).
 *    use_page_results: the parsed values are pushed into the page's own get_results block as
 *    `filters` — the same contract the search form uses, so that block renders the results.
 *    Otherwise the block fetches and renders them itself via search_ai_results.
 */
export default function ElementSearchAi({ blockWrapperProps, data }) {
    const block = data || {}
    if (block.mode === 'extended')
        return <SearchAiExtended blockWrapperProps={blockWrapperProps} block={block} />
    return <SearchAiSections blockWrapperProps={blockWrapperProps} block={block} />
}

const EXT_PER_PAGE = 12

function SearchAiExtended({ blockWrapperProps, block }) {
    const { t } = useTranslation()
    const aiAvailable = block.available !== false
    const fields = Array.isArray(block.fields) ? block.fields : []
    // the page's own get_results block shows the results; this block only produces filters
    const usePageResults = !!block.use_page_results

    const [query, setQuery] = useState('')
    const [searchParams, setSearchParams] = useState(null) // { field: { value } }
    const [keywordField, setKeywordField] = useState('')
    const [filters, setFilters] = useState(null)           // { input name: value } — search form shape
    const [chips, setChips] = useState(null)               // { field: { field, caption, label, value, filter_keys } }
    const [results, setResults] = useState(null)
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)
    const requestRef = useRef(null)
    const emittedRef = useRef(false)

    const { parsed, parsing } = useSearchParse(query, aiAvailable, block.parse_url, block.object)

    // parsed query -> editable field set
    useEffect(() => {
        if (query.trim().length < 3 || !parsed) {
            setSearchParams(null)
            setFilters(null)
            setChips(null)
            setResults(null)
            return
        }
        const params = {}
        Object.entries(parsed.search_params || {}).forEach(([name, p]) => { params[name] = { value: p.value } })
        setSearchParams(params)
        setFilters(parsed.filters || {})
        setChips(parsed.chips || {})
        setKeywordField(parsed.keyword_field || '')
    }, [query, parsed])

    const removeField = (name) => {
        const nextParams = { ...(searchParams || {}) }
        const nextChips = { ...(chips || {}) }
        const nextFilters = { ...(filters || {}) }
        // a field can occupy several form inputs (location: name + name_city, name_country…)
        const keys = nextChips[name]?.filter_keys || [name]
        keys.forEach((key) => {
            // keep the key, but empty: the results block must forget the previous value
            nextFilters[key] = Array.isArray(nextFilters[key]) ? [] : ''
        })
        delete nextParams[name]
        delete nextChips[name]
        setSearchParams(nextParams)
        setFilters(nextFilters)
        setChips(nextChips)
    }

    // The page's own results block shows the results. Without ranking the parsed values go to it as
    // `filters` (the search form's contract); with ranking the list source is swapped to this block's
    // own endpoint, because ranked results cannot be expressed as form values.
    useEffect(() => {
        if (!usePageResults) return

        const rerank = !!block.rerank
        const hasParams = !!searchParams && !!Object.keys(searchParams).length
        // with ranking the query alone is enough: the model judges the candidates by meaning,
        // so a query that matches no field ("реакт", "курс для новичков") still finds items
        const canSearch = hasParams || (rerank && query.trim().length >= 3 && !!parsed)

        if (!canSearch) {
            if (emittedRef.current) {
                // the page's own endpoint may still carry filters this block set earlier
                // (a session before ranking was turned on), so clear them as well
                emitter.emit(EVENTS.conductor, { action: 'filters', values: {} })
                if (rerank) emitter.emit(EVENTS.conductor, { action: 'endpoint', restore: true })
                emittedRef.current = false
            }
            return
        }

        if (rerank) {
            // the ranked list carries the filters already; leave none on the page's own endpoint
            emitter.emit(EVENTS.conductor, { action: 'filters', values: {} })
            emitter.emit(EVENTS.conductor, {
                action: 'endpoint',
                request_url: block.results_url,
                unit: 'general-content-list',
                module: block.object,
                params: {
                    object: block.object,
                    search_params: searchParams || {},
                    query,
                    rerank: 1,
                    keyword_field: keywordField,
                    start: 0,
                    per_page: EXT_PER_PAGE,
                },
            })
        }
        else
            emitter.emit(EVENTS.conductor, { action: 'filters', values: filters || {} })

        emittedRef.current = true
    }, [filters, searchParams, query, keywordField, usePageResults, block.rerank, block.results_url, block.object])

    const load = (start, append) => {
        requestRef.current?.abort()
        const controller = new AbortController()
        requestRef.current = controller
        setLoading(true)
        fetchExtResults({
            object: block.object,
            searchParams: searchParams || {},
            start,
            perPage: EXT_PER_PAGE,
            url: block.results_url,
            signal: controller.signal,
            rerank: !!block.rerank,
            query,
            keywordField,
        })
            .then(({ items, hasMore }) => {
                if (controller.signal.aborted) return
                setResults((prev) => (append && Array.isArray(prev) ? [...prev, ...items] : items))
                setHasMore(hasMore)
                setLoading(false)
            })
            .catch(() => {
                if (controller.signal.aborted) return
                if (!append) setResults([])
                setHasMore(false)
                setLoading(false)
            })
    }

    // field set -> results (standalone mode only)
    useEffect(() => {
        if (usePageResults) return
        const canSearch = (!!searchParams && !!Object.keys(searchParams).length)
            || (!!block.rerank && query.trim().length >= 3 && !!parsed)
        if (!canSearch) {
            requestRef.current?.abort()
            setResults(null)
            setLoading(false)
            return
        }
        load(0, false)
        return () => requestRef.current?.abort()
    }, [searchParams, usePageResults, block.rerank, query, parsed])

    // With ranking the keyword does not filter anything — the model judges the whole phrase, so the
    // keyword chip would claim a restriction that is not there; the phrase is shown instead.
    const semantic = !!block.rerank && !!query.trim()
    const visibleChips = semantic && chips && keywordField
        ? Object.fromEntries(Object.entries(chips).filter(([name]) => name !== keywordField))
        : chips

    const hint = fields.map((f) => f.caption).filter(Boolean).slice(0, 5).join(', ')
    const placeholder = hint ? t('Describe what you are looking for') + ' — ' + hint + '…' : t('Describe what you are looking for…')
    const noMatch = !block.rerank && !!parsed && parsed.available !== false && searchParams && !Object.keys(searchParams).length

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-y-2 p-1">
                <InputWithIcons
                    className="w-full"
                    rounded="full"
                    size="large"
                    name="search_ai"
                    placeholder={placeholder}
                    value={query}
                    onChangeText={setQuery}
                    startDecorator={aiAvailable ? 'Sparkles' : 'Search'}
                    role="searchbox"
                    aria-label={t('Search')}
                />

                {semantic && (
                    <Row className="flex-wrap gap-1 items-center">
                        <NeoButton
                            controlSize="mini"
                            borderShape="capsule"
                            image="Sparkles"
                            label={t('By meaning') + ': ' + query.trim()}
                        />
                    </Row>
                )}

                <SearchExtChips chips={visibleChips} parsing={parsing} onRemove={removeField} />

                {parsed && parsed.available === false && (
                    <Text className="text-xs text-muted-foreground px-1">{t('AI search is not available right now')}</Text>
                )}
                {noMatch && !parsing && (
                    <Text className="text-xs text-muted-foreground px-1">{t('Could not turn this into filters — try naming a category, price, place or date')}</Text>
                )}

                {!usePageResults && results !== null && (
                    <View className="w-full">
                        {loading && !results.length ? (
                            <Text className="text-sm text-muted-foreground px-1 py-2">{t('Searching…')}</Text>
                        ) : !results.length ? (
                            <View className="gap-y-1 items-center opacity-80 py-6 px-4 rounded-2xl bg-muted-foreground/10">
                                <View className="text-secondary-foreground">
                                    <Icon icon="Binoculars" width={28} height={28} />
                                </View>
                                <Text className="text-center text-base text-secondary-foreground font-semibold">{t('Nothing found')}</Text>
                            </View>
                        ) : (
                            <>
                                <BrowseSimple
                                    data={{ data: results, unit: 'general-content-list', module: block.object }}
                                    view={BrowseSimpleView.Row}
                                    unitMode="search"
                                />
                                {hasMore && (
                                    <Row className="justify-center mt-1">
                                        <NeoButton
                                            controlSize="small"
                                            label={t('Load more')}
                                            loading={loading}
                                            loadingLabel={t('Loading…')}
                                            disabled={loading}
                                            onPress={() => load(results.length, true)}
                                        />
                                    </Row>
                                )}
                            </>
                        )}
                    </View>
                )}
            </View>
        </BlockWrapper>
    )
}

function SearchAiSections({ blockWrapperProps, block }) {
    const { t } = useTranslation()
    const lockedSection = block.section || ''
    const sections = Array.isArray(block.sections) ? block.sections : []
    const aiAvailable = block.available !== false

    const [query, setQuery] = useState('')
    const [filter, setFilter] = useState(null)
    const [results, setResults] = useState(null) // null = nothing searched yet
    const [loading, setLoading] = useState(false)
    const requestRef = useRef(null)
    const redirectRef = useRef()

    const { parsed, parsing } = useSearchParse(query, aiAvailable, block.parse_url)
    const aiActive = aiAvailable && !!parsed && parsed.available !== false

    // typed query -> filter: parsed by the model, or the raw keyword when AI is unavailable
    useEffect(() => {
        if (query.trim().length < 3) {
            setFilter(null)
            setResults(null)
            return
        }
        if (aiAvailable) {
            if (!parsed) return
            if (parsed.available === false) {
                setFilter({ keyword: query.trim(), section: lockedSection, date: null })
                return
            }
            setFilter({
                keyword: parsed.keyword || '',
                section: lockedSection || parsed.section || '',
                date: parsed.date || null,
            })
        } else {
            setFilter({ keyword: query.trim(), section: lockedSection, date: null })
        }
    }, [query, parsed, aiAvailable, lockedSection])

    // filter (parsed or edited via chips) -> results
    useEffect(() => {
        requestRef.current?.abort()
        if (!filter || (!filter.keyword && !filter.date && !filter.section)) {
            setResults(null)
            setLoading(false)
            return
        }
        const controller = new AbortController()
        requestRef.current = controller
        setLoading(true)
        fetchSearchResults(filter, { url: block.search_url, signal: controller.signal })
            .then((items) => {
                if (controller.signal.aborted) return
                setResults(items)
                setLoading(false)
            })
            .catch(() => {
                if (controller.signal.aborted) return
                setResults([])
                setLoading(false)
            })
        return () => controller.abort()
    }, [filter, block.search_url])

    const allResultsUrl = filter ? buildSearchUrl(filter, block.results_url || '/search-keyword') : ''

    const handleSubmit = () => {
        if (!allResultsUrl) return
        redirectRef.current?.redirect(allResultsUrl)
    }

    const placeholder = lockedSection
        ? t('Describe what you are looking for…')
        : t('Try: events this weekend, posts about design…')

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-y-2 p-1">
                <Redirect ref={redirectRef} />
                <InputWithIcons
                    className="w-full"
                    rounded="full"
                    size="large"
                    name="search_ai"
                    placeholder={placeholder}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSubmit}
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                    startDecorator={aiAvailable ? 'Sparkles' : 'Search'}
                    role="searchbox"
                    aria-label={t('Search')}
                />

                {aiActive && filter && (
                    <SearchFilterChips
                        filter={filter}
                        sections={lockedSection ? [] : sections}
                        parsing={parsing}
                        onChange={setFilter}
                    />
                )}
                {!aiActive && parsing && (
                    <Text className="text-xs text-muted-foreground px-1">{t('Understanding your query…')}</Text>
                )}

                {results !== null && (
                    <SearchAiResults
                        results={results}
                        loading={loading}
                        section={filter?.section || ''}
                        allResultsUrl={allResultsUrl}
                        onPress={(url) => redirectRef.current?.redirect(url)}
                    />
                )}
            </View>
        </BlockWrapper>
    )
}

function SearchAiResults({ results, loading, section, allResultsUrl, onPress }) {
    const { t } = useTranslation()

    if (loading && !results?.length) {
        return <Text className="text-sm text-muted-foreground px-1 py-2">{t('Searching…')}</Text>
    }

    if (!results?.length) {
        return (
            <View className="gap-y-1 items-center opacity-80 py-6 px-4 rounded-2xl bg-muted-foreground/10">
                <View className="text-secondary-foreground">
                    <Icon icon="Binoculars" width={28} height={28} />
                </View>
                <Text className="text-center text-base text-secondary-foreground font-semibold">{t('Nothing found')}</Text>
            </View>
        )
    }

    return (
        <View className="w-full">
            {section ? (
                <BrowseSimple
                    data={{
                        data: results,
                        unit: section === 'bx_timeline' ? 'feed' : (section.includes('_cmts') ? 'comments' : 'general-content-list'),
                        module: section,
                    }}
                    view={BrowseSimpleView.Row}
                    unitMode="search"
                />
            ) : (
                <View className="w-full">
                    {results.map((item, index) => (
                        <UnitSearchResultsSmall key={index} data={item} onPress={onPress} />
                    ))}
                </View>
            )}
            {!!allResultsUrl && (
                <Row className="justify-end mt-1">
                    <NeoButtonLink
                        href={allResultsUrl}
                        style="borderless"
                        controlSize="small"
                        image="ChevronsRight"
                        imagePlacement="trailing"
                        label={t('See all results')}
                    />
                </Row>
            )}
        </View>
    )
}
