'use client'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Platform, InteractionManager } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { fetcher } from 'app/lib/fetcher'
import { appSetting } from 'app/lib/util'

// Debounce window for mention lookups. Collapses fast keystrokes into a single
// request and prevents the bare "@" (empty term) query from racing with the
// filtered ones that follow it.
const DEBOUNCE_MS = 150
const MAX_SUGGESTIONS = 6
// Mentionable types, grouped (and ordered) in the dropdown. UNA exposes the type
// via the module or the profile url pattern (view-persons-profile / view-organization-profile).
const TYPE_ORDER = { bx_persons: 0, bx_organizations: 1 }

function deriveType(url = '', thumb = '') {
    const hay = `${url || ''} ${thumb || ''}`
    if (/organization/i.test(hay)) return 'bx_organizations'
    if (/person/i.test(hay)) return 'bx_persons'
    return 'other'
}
// Typeahead should fail fast and never retry — stale retries only pile up and
// spam the console when the backend mention search is slow.
const MENTION_TIMEOUT_MS = 5000
const MENTION_FETCH_OPTIONS = {
    maxAttempts: 1,
    timeoutMs: MENTION_TIMEOUT_MS,
    silent: true,
}
// How many recent mentions to persist per indicator. We keep more than we show
// so the list stays useful as older entries age out.
const MAX_RECENTS_STORED = 20

const RECENTS_KEY = (userId) => `mention:recents:${userId || 'guest'}`
const CONNECTIONS_KEY = (userId) => `mention:connections:${userId || 'guest'}`
// Connections rarely change within a session; refresh at most this often.
const CONNECTIONS_TTL_MS = 10 * 60 * 1000
const CONNECTIONS_FETCH_COUNT = 12
const CONNECTIONS_CACHE_MAX = 12

// Built-in default seed sources, merged in order (actual friends first — the
// strongest "likely to mention" signal — then friend recommendations to fill
// out the list). `{user_id}` is replaced with the logged-in profile id. These
// are used when settings don't provide `editor.mention.connections_url`, so the
// feature works even if the settings module hasn't reloaded.
const DEFAULT_CONNECTIONS_SOURCES = [
    '/api.php?r=system/browse_friends/TemplServiceProfiles&params[]={user_id}&params[]=',
    '/api.php?r=system/browse_recommendations_friends/TemplServiceProfiles&params[]={user_id}&params[]=',
]

// Shared across editor instances so opening the composer twice (or having more
// than one editor on screen) does not refetch or duplicate work.
const connectionsMem = new Map() // userId -> { ts, list }
const connectionsInflight = new Map() // userId -> Promise<list>

// ---------------------------------------------------------------------------
// Storage helpers (cross-platform via AsyncStorage; best-effort, never throws)
// ---------------------------------------------------------------------------
async function readJson(key) {
    try {
        const raw = await AsyncStorage.getItem(key)
        if (!raw) return null
        return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
        return null
    }
}

async function writeJson(key, value) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch {
        // Storage unavailable (private mode / quota): treat as best-effort.
    }
}

// ---------------------------------------------------------------------------
// Recent mentions — the strongest "most likely to mention" signal, owned by us
// ---------------------------------------------------------------------------
async function readRecents(userId) {
    const parsed = await readJson(RECENTS_KEY(userId))
    return parsed && typeof parsed === 'object' ? parsed : {}
}

// Keep only the fields the dropdown and insert paths consume, so a stored item
// can be rendered and inserted exactly like a freshly fetched one.
function toMentionItem(user) {
    if (!user || user.value == null) return null
    return {
        label: user.label,
        value: user.value,
        url: user.url,
        url_avatar: user.url_avatar ?? user.thumb ?? null,
        type: user.type || deriveType(user.url, user.thumb),
        badges: user.badges ?? null,
        classname: user.classname || '',
    }
}

// ---------------------------------------------------------------------------
// Connections — background-prefetched cold-start seed (UNA browse response)
// ---------------------------------------------------------------------------
// UNA browse responses are shaped: res.data[0].data.data = [ ...units ].
// Person units expose: title (name), url, author_data.id (profile id).
function mapUnitToMention(unit) {
    if (!unit) return null
    const value = unit.author_data?.id ?? unit.profile_id ?? unit.id
    const label = unit.title ?? unit.display_name ?? unit.fullname
    const url = unit.url
    if (value == null || !label || !url) return null
    const moduleName = unit.module ?? unit.author_data?.module
    const type =
        moduleName === 'bx_organizations' || moduleName === 'bx_persons'
            ? moduleName
            : deriveType(url)
    const url_avatar = unit.author_data?.url_avatar ?? unit.image?.src ?? null
    const badges = unit.badges ?? unit.author_badges ?? null
    return { label, value, url, url_avatar, type, badges, classname: '' }
}

function connectionsAreFresh(userId) {
    const entry = connectionsMem.get(userId)
    return !!entry && Date.now() - entry.ts < CONNECTIONS_TTL_MS
}

// Fetch one UNA browse source and map its units to mention items.
// Browse responses are shaped: res.data[0].data.data = [ ...units ].
async function fetchConnectionSource(userId, url) {
    try {
        const reqUrl =
            url.replace('{user_id}', encodeURIComponent(userId)) +
            JSON.stringify({ params: { start: 0, per_page: CONNECTIONS_FETCH_COUNT } })
        const res = await fetcher(reqUrl)
        const units = res?.data?.[0]?.data?.data
        return (Array.isArray(units) ? units : []).map(mapUnitToMention).filter(Boolean)
    } catch {
        return []
    }
}

async function fetchConnections(userId, sources) {
    if (connectionsInflight.has(userId)) return connectionsInflight.get(userId)

    const promise = (async () => {
        try {
            const lists = await Promise.all(
                sources.map((src) => fetchConnectionSource(userId, src))
            )
            // Merge in source order, de-duplicating by profile id and url.
            const seen = new Set()
            const merged = []
            for (const list of lists) {
                for (const item of list) {
                    const idKey = String(item.value)
                    if (seen.has(idKey) || (item.url && seen.has(item.url))) continue
                    seen.add(idKey)
                    if (item.url) seen.add(item.url)
                    merged.push(item)
                    if (merged.length >= CONNECTIONS_CACHE_MAX) break
                }
                if (merged.length >= CONNECTIONS_CACHE_MAX) break
            }
            const entry = { ts: Date.now(), list: merged }
            connectionsMem.set(userId, entry)
            writeJson(CONNECTIONS_KEY(userId), entry)
            return merged
        } catch {
            return []
        } finally {
            connectionsInflight.delete(userId)
        }
    })()

    connectionsInflight.set(userId, promise)
    return promise
}

// Run a non-critical task off the critical path so it never delays the form
// opening or first paint: idle time on web, after interactions on native.
function runWhenIdle(task) {
    if (Platform.OS === 'web') {
        if (typeof requestIdleCallback === 'function') {
            const id = requestIdleCallback(task, { timeout: 2000 })
            return () => { try { cancelIdleCallback?.(id) } catch {} }
        }
        const id = setTimeout(task, 1)
        return () => clearTimeout(id)
    }
    const handle = InteractionManager.runAfterInteractions(task)
    return () => { try { handle?.cancel?.() } catch {} }
}

// Last path segment of the profile url, used as the secondary handle/slug.
function deriveSlug(url = '') {
    return (url || '').split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop() || ''
}

// Ensure every item carries an avatar (`url_avatar`), a `type`, a `slug`, and any
// `badges`, regardless of the source (get_mention search vs browse vs recents).
function decorate(item) {
    return {
        ...item,
        url_avatar: item.url_avatar ?? item.thumb ?? null,
        type: item.type || deriveType(item.url, item.thumb),
        slug: item.slug || deriveSlug(item.url),
        badges: item.badges ?? item.author_badges ?? null,
    }
}

function normalize(list) {
    const decorated = (Array.isArray(list) ? list : []).map(decorate)
    // Stable sort by type so groups render contiguously (keyboard nav follows the
    // same flat order the user sees).
    const sorted = decorated
        .map((item, i) => [item, i])
        .sort((a, b) => {
            const pa = TYPE_ORDER[a[0].type] ?? 99
            const pb = TYPE_ORDER[b[0].type] ?? 99
            return pa - pb || a[1] - b[1]
        })
        .map(([item]) => item)
    return sorted
        .slice(0, MAX_SUGGESTIONS)
        .map((item, index) => ({ ...item, index, selected: index === 0 }))
}

// Merge recents + connections (same rules as the bare-trigger path), then filter
// locally by label when the network lookup fails or is superseded.
function localMentionCandidates(term, indicator, recents, connections) {
    const recent = recents[indicator] || []
    let merged = recent
    if (indicator === '@' && connections.length) {
        const seen = new Set()
        recent.forEach((u) => { seen.add(String(u.value)); if (u.url) seen.add(u.url) })
        merged = [
            ...recent,
            ...connections.filter((u) => !seen.has(String(u.value)) && !seen.has(u.url)),
        ]
    }
    const needle = term.trim().toLowerCase()
    if (!needle) return merged
    return merged.filter((u) => u.label?.toLowerCase().includes(needle))
}

/**
 * Robust mention-suggestion fetching shared by the tentap and enriched editors.
 *
 * Three problems are solved here:
 *
 *  1. Race / ordering. The naive "fetch on every keystroke" approach had no
 *     ordering guarantees, so a slow/earlier request (notably the empty-term
 *     query produced when "@" is first typed, which the retrying GET fetcher
 *     can delay further) could resolve last and overwrite the correctly
 *     filtered list. A monotonic request id + query tag + debounce make the
 *     latest request authoritative.
 *
 *  2. Useless empty-term list. With no term, UNA's search returns an arbitrary
 *     default (often a single unrelated profile). Instead we show the user's
 *     recently mentioned profiles, then their connections, as the "most likely
 *     to mention" list.
 *
 *  3. Cold start without blocking. The connections seed is prefetched in the
 *     background after the form opens (idle time / after interactions) and
 *     cached, so it is ready by the time "@" is typed and never delays render.
 *
 * @param {object}  params
 * @param {string}  params.url        Base mention endpoint (already carries m/cid/etc).
 * @param {string}  params.term       Text typed after the indicator.
 * @param {string}  params.indicator  Trigger char ('@' or '#'); falsy when inactive.
 * @param {string|number} [params.userId] Logged-in profile id, used to scope recents/connections.
 * @returns {{ suggestions: any[], setSuggestions: Function, reset: Function, recordMention: Function }}
 */
export function useMentionSuggestions({ url, term, indicator, userId }) {
    const [suggestions, setSuggestions] = useState([])
    // Recently mentioned items keyed by indicator, e.g. { '@': [...], '#': [...] }.
    const [recents, setRecents] = useState({})
    // Background-prefetched connection profiles (used for the '@' cold start).
    const [connections, setConnections] = useState([])

    // Bumped on every effect run. A response only applies if its captured id
    // still matches, i.e. no newer query has started in the meantime.
    const requestIdRef = useRef(0)
    // The query the currently-pending request belongs to (extra correctness
    // guard on top of the id, in case the same term is revisited).
    const activeQueryRef = useRef(null)
    const fetchAbortRef = useRef(null)

    // Resolve connection seed sources from settings, falling back to built-in
    // defaults so the feature works even if the settings module hasn't reloaded.
    const mentionCfg = appSetting('editor', 'mention') || {}
    const prefetchEnabled = mentionCfg.prefetch_connections !== false
    const rawSources = mentionCfg.connections_url || DEFAULT_CONNECTIONS_SOURCES
    const connectionsSources = useMemo(() => {
        if (!prefetchEnabled) return null
        return typeof rawSources === 'string' ? [rawSources] : rawSources
    }, [prefetchEnabled, rawSources])

    // Load persisted recents once per user.
    useEffect(() => {
        let alive = true
        readRecents(userId).then((data) => {
            if (alive) setRecents(data)
        })
        return () => { alive = false }
    }, [userId])

    // Prefetch connections off the critical path once the form is open. Uses an
    // in-memory cache shared across instances, a persisted copy for instant
    // first paint, and a background refresh when the cache is stale.
    useEffect(() => {
        if (!userId || !connectionsSources) return
        let alive = true

        const cancelIdle = runWhenIdle(async () => {
            // 1) Instant: serve whatever we already have (memory, then disk).
            const mem = connectionsMem.get(userId)
            if (mem) {
                if (alive) setConnections(mem.list)
            } else {
                const stored = await readJson(CONNECTIONS_KEY(userId))
                if (stored?.list) {
                    connectionsMem.set(userId, stored)
                    if (alive) setConnections(stored.list)
                }
            }

            // 2) Refresh in the background when stale (or never fetched).
            if (!connectionsAreFresh(userId)) {
                const list = await fetchConnections(userId, connectionsSources)
                if (alive && list.length) setConnections(list)
            }
        })

        return () => { alive = false; cancelIdle?.() }
    }, [userId, connectionsSources])

    const reset = useCallback(() => {
        requestIdRef.current += 1
        activeQueryRef.current = null
        fetchAbortRef.current?.abort()
        fetchAbortRef.current = null
        setSuggestions([])
    }, [])

    const recordMention = useCallback((user) => {
        const item = toMentionItem(user)
        if (!item || !indicator) return
        setRecents((prev) => {
            const list = prev[indicator] || []
            // Most-recent first, de-duplicated by profile id.
            const next = [item, ...list.filter((u) => u.value !== item.value)]
                .slice(0, MAX_RECENTS_STORED)
            const updated = { ...prev, [indicator]: next }
            writeJson(RECENTS_KEY(userId), updated)
            return updated
        })
    }, [indicator, userId])

    useEffect(() => {
        // No active mention: invalidate in-flight work and clear the list.
        if (!indicator) {
            reset()
            return
        }

        // NUL separator keeps indicator and term unambiguous.
        const query = `${indicator}\u0000${term}`
        const requestId = (requestIdRef.current += 1)
        activeQueryRef.current = query

        // Bare trigger: build a personalized list from recents, then top up with
        // prefetched connections. Only hit the network when we have neither.
        if (term === '') {
            const recent = recents[indicator] || []
            let merged = recent
            if (indicator === '@' && connections.length) {
                // Recents and connections come from different endpoints, so their
                // profile ids may not align — de-duplicate by id and by url.
                const seen = new Set()
                recent.forEach((u) => { seen.add(String(u.value)); if (u.url) seen.add(u.url) })
                merged = [
                    ...recent,
                    ...connections.filter((u) => !seen.has(String(u.value)) && !seen.has(u.url)),
                ]
            }
            if (merged.length) {
                setSuggestions(normalize(merged))
                return
            }
        }

        const timer = setTimeout(async () => {
            fetchAbortRef.current?.abort()
            const controller = new AbortController()
            fetchAbortRef.current = controller

            const symbol = indicator === '#' ? '%23' : '%40'
            let result = null
            try {
                result = await fetcher(
                    `${url}&symbol=${symbol}&term=${encodeURIComponent(term)}`,
                    false,
                    { ...MENTION_FETCH_OPTIONS, signal: controller.signal }
                )
            } catch (error) {
                if (error?.aborted) return
                result = localMentionCandidates(term, indicator, recents, connections)
            }

            // Drop the response if a newer query has started since.
            if (requestId !== requestIdRef.current) return
            if (activeQueryRef.current !== query) return

            if (!result?.length) {
                result = localMentionCandidates(term, indicator, recents, connections)
            }

            setSuggestions(normalize(result))
        }, DEBOUNCE_MS)

        return () => {
            clearTimeout(timer)
            fetchAbortRef.current?.abort()
            fetchAbortRef.current = null
        }
    }, [url, term, indicator, recents, connections, reset])

    return { suggestions, setSuggestions, reset, recordMention }
}
