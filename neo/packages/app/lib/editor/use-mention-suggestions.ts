'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { fetcher } from 'app/lib/fetcher'

// Debounce window for mention lookups. Collapses fast keystrokes into a single
// request and prevents the bare "@" (empty term) query from racing with the
// filtered ones that follow it.
const DEBOUNCE_MS = 150

/** A mention suggestion row: profile id (`value`), display `label`, profile `url`, avatar, module type. */
export type MentionSuggestion = {
    label: string
    value: number | string
    url: string
    url_avatar?: string | null
    type?: string
    badges?: any
    classname?: string
    [key: string]: any
}

function mentionType(item: { module?: string; type?: string; url?: string; slug?: string } = {}) {
    const moduleName = item.module || item.type
    if (moduleName === 'bx_organizations' || moduleName === 'bx_persons') return moduleName
    if (/organization/i.test(`${item.url || ''} ${item.slug || ''}`)) return 'bx_organizations'
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

function deriveSlug(url = '') {
    return (url || '').split(/[?#]/)[0]!.replace(/\/+$/, '').split('/').pop() || ''
}

// Keep API order. Type comes from `module` (org fallback: "organization" in url/slug).
function decorate(item: any) {
    return {
        ...item,
        value: item.value ?? item.id,
        label: item.label ?? item.display_name,
        url_avatar: item.url_avatar ?? item.thumb ?? null,
        type: mentionType(item),
        slug: item.slug || deriveSlug(item.url),
        badges: item.badges ?? item.author_badges ?? null,
    }
}

function normalize(list: any) {
    return (Array.isArray(list) ? list : [])
        .map(decorate)
        .map((item, index) => ({ ...item, index, selected: index === 0 }))
}

/**
 * Mention-suggestion fetching shared by the tentap and enriched editors.
 *
 * The backend answer is authoritative (it decides who may be mentioned in the
 * given content), so suggestions come only from the mention search response:
 * no local recents / connections caches and no local fallback.
 *
 * A monotonic request id + query tag + debounce make the latest request
 * authoritative, so a slow earlier response can't overwrite a newer one.
 *
 * @param {object}  params
 * @param {string}  params.url        Base mention endpoint (already carries m/cid/etc).
 * @param {string}  params.term       Text typed after the indicator.
 * @param {string}  params.indicator  Trigger char ('@' or '#'); falsy when inactive.
 * @returns {{ suggestions: any[], setSuggestions: Function, reset: Function }}
 */
export function useMentionSuggestions({ url, term, indicator }: { url?: string; term?: string; indicator?: string }) {
    const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])

    // Bumped on every effect run. A response only applies if its captured id
    // still matches, i.e. no newer query has started in the meantime.
    const requestIdRef = useRef(0)
    // The query the currently-pending request belongs to (extra correctness
    // guard on top of the id, in case the same term is revisited).
    const activeQueryRef = useRef<string | null>(null)
    const fetchAbortRef = useRef<AbortController | null>(null)

    const reset = useCallback(() => {
        requestIdRef.current += 1
        activeQueryRef.current = null
        fetchAbortRef.current?.abort()
        fetchAbortRef.current = null
        setSuggestions([])
    }, [])

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

        const timer = setTimeout(async () => {
            fetchAbortRef.current?.abort()
            const controller = new AbortController()
            fetchAbortRef.current = controller

            const symbol = indicator === '#' ? '%23' : '%40'
            let result: any = []
            try {
                result = await fetcher(
                    `${url}&symbol=${symbol}&term=${encodeURIComponent(term as string)}`,
                    false,
                    { ...MENTION_FETCH_OPTIONS, signal: controller.signal }
                )
            } catch (error) {
                if ((error as { aborted?: boolean })?.aborted) return
                result = []
            }

            // Drop the response if a newer query has started since.
            if (requestId !== requestIdRef.current) return
            if (activeQueryRef.current !== query) return

            setSuggestions(normalize(result))
        }, DEBOUNCE_MS)

        return () => {
            clearTimeout(timer)
            fetchAbortRef.current?.abort()
            fetchAbortRef.current = null
        }
    }, [url, term, indicator, reset])

    return { suggestions, setSuggestions, reset }
}
