'use client'
import { useState, useCallback, useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useCurrentUser } from 'app/context/user'
import { useMentionSuggestions } from 'app/lib/editor/use-mention-suggestions'
import { buildMentionSearchUrl } from 'app/lib/editor/editor-mention-shared'

/**
 * Shared mention suggestion state for tentap + enriched.
 *
 * Both engines call `setTrigger(term, indicator)` / `clearTrigger()` from their
 * own detection paths (iframe postMessage vs TipTap/native callbacks), then
 * share fetch, recents, keyboard selection, and recordMention.
 */
export function useEditorMentions({ fieldName, mentions }: { fieldName?: string; mentions?: any[] } = {}) {
    const formContext = useFormContext()
    const { currentUser } = useCurrentUser()
    // [term, indicator] — indicator falsy means inactive
    const [trigger, setTriggerState] = useState(['', ''])

    const objectPrivacyView =
        formContext.watch('object_privacy_view') ||
        formContext.watch('cmt_privacy_view')
    const objectId = formContext.watch('id')

    const mentionUrl = buildMentionSearchUrl({
        fieldName,
        objectPrivacyView,
        objectId,
        mentions,
    })

    const { suggestions, setSuggestions, recordMention } = useMentionSuggestions({
        url: mentionUrl,
        term: trigger[0],
        indicator: trigger[1],
        userId: (currentUser || undefined)?.id,
    })

    const setTrigger = useCallback((term: string, indicator: string) => {
        setTriggerState((prev) => {
            if (prev[0] === term && prev[1] === indicator) return prev
            return [term, indicator || '']
        })
    }, [])

    const clearTrigger = useCallback(() => {
        setTrigger('', '')
    }, [setTrigger])

    const moveSelected = useCallback((dir: 'up' | 'down') => {
        setSuggestions((prev) => {
            const i = prev.findIndex((x) => x.selected)
            if (i === -1) return prev
            const len = prev.length
            const ni = dir === 'up' ? (i - 1 + len) % len : (i + 1) % len
            return prev.map((x, idx) => ({ ...x, selected: idx === ni, index: idx }))
        })
    }, [setSuggestions])

    const selectedSuggestion = suggestions.find((x) => x.selected) || suggestions[0] || null

    // Stable refs for capture-phase key handlers that must not close over stale state.
    const handlersRef = useRef({})
    handlersRef.current = {
        suggestions,
        selectedSuggestion,
        moveSelected,
        clearTrigger,
        trigger,
        recordMention,
    }

    return {
        term: trigger[0],
        indicator: trigger[1],
        active: !!trigger[1],
        suggestions,
        setSuggestions,
        setTrigger,
        clearTrigger,
        moveSelected,
        selectedSuggestion,
        recordMention,
        handlersRef,
        queryToken: trigger[1] ? trigger[1] + trigger[0] : '',
    }
}
