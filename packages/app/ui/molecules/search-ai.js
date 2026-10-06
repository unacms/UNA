import { useEffect, useRef, useState } from 'react'
import { fetcher } from 'app/lib/fetcher'
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'
import { useTranslation } from 'react-i18next'

/**
 * Natural-language search helpers for the `search_ai` block element:
 * `system/search_parse` turns a query like "events starting on 23/09" into
 * { section, keyword, date }, the chips let the user fix what the model got wrong,
 * and `get_data_search_api` is called with the resulting filter.
 */

const PARSE_DEBOUNCE_MS = 350
const PARSE_MIN_LENGTH = 3
const PARSE_URL = '/api.php?r=system/search_parse/TemplServicesSearch&params='
const SEARCH_URL = '/api.php?r=system/get_data_search_api/TemplServicesSearch&params='
const EXT_RESULTS_URL = '/api.php?r=system/search_ai_results/TemplServicesSearch&params='

export function getClientTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    } catch {
        return ''
    }
}

/** { keyword, section, date } -> search-keyword page URL */
export function buildSearchUrl(filter, base = '/search-keyword') {
    const params = []
    params.push('keyword=' + encodeURIComponent(filter?.keyword || ''))
    if (filter?.section) params.push('section=' + encodeURIComponent(filter.section))
    if (filter?.section && !filter?.keyword && !filter?.date?.from) params.push('list=1')
    if (filter?.date?.from) {
        params.push('date_field=' + encodeURIComponent(filter.date.field || 'created'))
        params.push('date_from=' + encodeURIComponent(filter.date.from))
        params.push('date_to=' + encodeURIComponent(filter.date.to || filter.date.from))
        const tz = getClientTimezone()
        if (tz) params.push('timezone=' + encodeURIComponent(tz))
    }
    return base + '?' + params.join('&')
}

/** { keyword, section, date } -> params for get_data_search_api */
export function buildSearchApiParams(filter, extra = {}) {
    const params = {
        keyword: filter?.keyword || '',
        section: filter?.section || '',
        live: true,
        ...extra,
    }
    // "all events": a section alone lists that section's latest items
    if (params.section && !params.keyword && !filter?.date?.from) params.list = true
    if (filter?.date?.from) {
        params.filter = {
            date_field: filter.date.field || 'created',
            date_from: filter.date.from,
            date_to: filter.date.to || filter.date.from,
            timezone: getClientTimezone(),
        }
    }
    return params
}

export function formatDateLabel(date, t) {
    if (!date?.from) return ''
    const fieldLabels = { starts: t('Starts'), ends: t('Ends'), created: t('Posted') }
    const format = (s) => {
        try {
            return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(s + 'T00:00:00'))
        } catch {
            return s
        }
    }
    const range = date.to && date.to !== date.from ? format(date.from) + ' – ' + format(date.to) : format(date.from)
    return (fieldLabels[date.field] || fieldLabels.created) + ' ' + range
}

/** Calls search_parse once (no debounce); resolves to the parsed block data or { available: false } */
export async function parseQuery(query, { url = PARSE_URL, signal, object = '' } = {}) {
    const params = { params: { query: query.trim(), timezone: getClientTimezone() } }
    if (object) params.params.object = object
    try {
        const response = await fetcher(url + encodeURIComponent(JSON.stringify(params)), false, { signal })
        const data = response?.data?.[0]?.data
        return data && typeof data === 'object' ? data : { available: false, keyword: query }
    } catch (e) {
        if (signal?.aborted) throw e
        return { available: false, keyword: query }
    }
}

/** Calls get_data_search_api for a filter; resolves to the results array */
export async function fetchSearchResults(filter, { url = SEARCH_URL, signal } = {}) {
    const params = { params: buildSearchApiParams(filter) }
    const response = await fetcher(url + encodeURIComponent(JSON.stringify(params)), false, { signal })
    const block = response?.data?.[0]?.data
    return block?.unit === 'search-results' && Array.isArray(block.data) ? block.data : []
}

/**
 * Debounced search_parse for a query.
 * Returns { parsed, parsing }; `parsed` is null until the first successful parse.
 * `parsed.available === false` means the server has no judge model: fall back to a plain keyword search.
 */
export function useSearchParse(query, enabled, url, object = '') {
    const [parsed, setParsed] = useState(null)
    const [parsing, setParsing] = useState(false)
    const requestRef = useRef(null)
    const timerRef = useRef(null)

    useEffect(() => {
        clearTimeout(timerRef.current)
        requestRef.current?.abort()

        if (!enabled || !query || query.trim().length < PARSE_MIN_LENGTH) {
            setParsed(null)
            setParsing(false)
            return
        }

        setParsing(true)
        timerRef.current = setTimeout(async () => {
            const controller = new AbortController()
            requestRef.current = controller
            try {
                const data = await parseQuery(query, { url, signal: controller.signal, object })
                if (controller.signal.aborted) return
                setParsed(data)
                setParsing(false)
            } catch {
                // aborted by a newer query
            }
        }, PARSE_DEBOUNCE_MS)

        return () => {
            clearTimeout(timerRef.current)
            requestRef.current?.abort()
        }
    }, [query, enabled, url, object])

    return { parsed, parsing }
}

/**
 * Extended mode (block locked to an extended search object): results for search_params.
 * Resolves to { items, hasMore }; the engine returns per_page + 1 items when there is a next page.
 */
export async function fetchExtResults({ object, searchParams, start = 0, perPage = 12, url = EXT_RESULTS_URL, signal, query = '', keywordField = '', rerank = false }) {
    const params = { params: { object, search_params: searchParams, start, per_page: perPage } }
    // semantic ordering: the server ranks the candidates by meaning of the original query
    if (rerank && query) {
        params.params.query = query
        params.params.rerank = 1
        if (keywordField) params.params.keyword_field = keywordField
    }
    const response = await fetcher(url + encodeURIComponent(JSON.stringify(params)), false, { signal })
    const block = response?.data?.[0]
    const items = block?.type === 'browse' && Array.isArray(block.data?.data) ? block.data.data : []
    return { items: items.slice(0, perPage), hasMore: items.length > perPage, unit: block?.data?.unit || 'general-content-list' }
}

/**
 * Chips for the extended mode: one per parsed field ("Price: ≤ 50 ✕"); tapping removes the field.
 * `chips` is the map returned by search_parse: { field: { field, caption, label, value } }
 */
export function SearchExtChips({ chips, onRemove, parsing = false }) {
    const { t } = useTranslation()
    const list = chips ? Object.values(chips) : []
    if (!list.length && !parsing) return null

    return (
        <Row className="flex-wrap gap-2 items-center">
            {list.map((chip) => (
                <NeoButton
                    key={chip.field}
                    controlSize="mini"
                    borderShape="capsule"
                    expoUI={false}
                    classNames={{ root: 'self-center' }}
                    accessibilityLabel={t('Remove') + ': ' + chip.caption + ': ' + chip.label}
                    onPress={() => onRemove(chip.field)}
                >
                    <Row className="flex-row items-center gap-x-1 min-w-0">
                        <Text numberOfLines={1} className="text-xs font-medium tracking-tight text-button-foreground min-w-0 shrink whitespace-nowrap text-ellipsis overflow-hidden">{chip.caption + ': ' + chip.label}</Text>
                        <Icon icon="X" size={16} className="text-button-foreground shrink-0 pointer-events-none" />
                    </Row>
                </NeoButton>
            ))}
            {parsing && (
                <Text className="text-xs text-muted-foreground px-1">{t('Understanding your query…')}</Text>
            )}
        </Row>
    )
}

/**
 * Editable chips for the parsed filter: one chip per available section
 * (tap to select / unselect), a date chip and a keyword chip (tap ✕ to drop).
 * `sections` empty (block locked to one section) hides the section row.
 */
export function SearchFilterChips({ filter, sections = [], onChange, parsing = false }) {
    const { t } = useTranslation()
    if (!filter) return null

    const hasDate = !!filter.date?.from
    const hasKeyword = !!filter.keyword

    return (
        <View className="w-full gap-y-2">
            {sections.length > 0 && (
                <Row className="flex-wrap gap-2 items-center">
                    <NeoButton
                        style={!filter.section ? 'borderedProminent' : undefined}
                        controlSize="mini"
                        borderShape="capsule"
                        selected={!filter.section}
                        selectedState="default"
                        label={t('Everywhere')}
                        onPress={() => onChange({ ...filter, section: '' })}
                    />
                    {sections.map((s) => (
                        <NeoButton
                            key={s.name}
                            style={filter.section === s.name ? 'borderedProminent' : undefined}
                            controlSize="mini"
                            borderShape="capsule"
                            selected={filter.section === s.name}
                            selectedState="default"
                            label={s.title}
                            onPress={() => onChange({ ...filter, section: filter.section === s.name ? '' : s.name })}
                        />
                    ))}
                </Row>
            )}
            {(hasDate || hasKeyword || parsing) && (
                <Row className="flex-wrap gap-2 items-center">
                    {hasDate && (
                        <NeoButton
                            controlSize="mini"
                            borderShape="capsule"
                            expoUI={false}
                            classNames={{ root: 'self-center' }}
                            accessibilityLabel={t('Remove') + ': ' + formatDateLabel(filter.date, t)}
                            onPress={() => onChange({ ...filter, date: null })}
                        >
                            <Row className="flex-row items-center gap-x-1 min-w-0">
                                <Icon icon="Calendar" size={16} className="text-button-foreground shrink-0 pointer-events-none" />
                                <Text numberOfLines={1} className="text-xs font-medium tracking-tight text-button-foreground min-w-0 shrink whitespace-nowrap text-ellipsis overflow-hidden">{formatDateLabel(filter.date, t)}</Text>
                                <Icon icon="X" size={16} className="text-button-foreground shrink-0 pointer-events-none" />
                            </Row>
                        </NeoButton>
                    )}
                    {hasKeyword && (
                        <NeoButton
                            controlSize="mini"
                            borderShape="capsule"
                            expoUI={false}
                            classNames={{ root: 'self-center' }}
                            accessibilityLabel={t('Remove') + ': ' + filter.keyword}
                            onPress={() => onChange({ ...filter, keyword: '' })}
                        >
                            <Row className="flex-row items-center gap-x-1 min-w-0">
                                <Icon icon="Search" size={16} className="text-button-foreground shrink-0 pointer-events-none" />
                                <Text numberOfLines={1} className="text-xs font-medium tracking-tight text-button-foreground min-w-0 shrink whitespace-nowrap text-ellipsis overflow-hidden">{filter.keyword}</Text>
                                <Icon icon="X" size={16} className="text-button-foreground shrink-0 pointer-events-none" />
                            </Row>
                        </NeoButton>
                    )}
                    {parsing && (
                        <Text className="text-xs text-muted-foreground px-1">{t('Understanding your query…')}</Text>
                    )}
                </Row>
            )}
        </View>
    )
}
