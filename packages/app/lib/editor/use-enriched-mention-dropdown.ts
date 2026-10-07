'use client'
import { useCallback, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { getTextBeforeCursorFromTiptap, parseMentionTrigger } from 'app/lib/editor/editor-mention-shared'
import { getCaretRect, placeMentionDropdown } from 'app/lib/editor/mention-dropdown-placement'

const isWeb = Platform.OS === 'web'

/**
 * Web side of the enriched editor's mention list:
 *  - drives `setTrigger` from TipTap with the same text-before-cursor rule as
 *    tentap, so suggestions work even when library mention events miss;
 *  - keeps the list pinned to the caret (absolute inside the editor container)
 *    across typing, resize and nested scroll;
 *  - keeps the editor focused while the list is clicked (a blur would end the
 *    mention trigger and clear the list before the click lands).
 *
 * Returns the dropdown placement, or null when there is nothing to show.
 * On native everything is a no-op and the result is always null.
 */
export function useEnrichedMentionDropdown({
    tipTap,
    containerRef,
    dropdownRef,
    hasSuggestions,
    setTrigger,
}: { tipTap: any; containerRef: any; dropdownRef: any; hasSuggestions: any; setTrigger: any }) {
    const [caretPos, setCaretPos] = useState<any>(null)

    const reposition = useCallback(() => {
        const container = containerRef.current
        if (!container?.getBoundingClientRect) return
        try {
            const caretRect = getCaretRect()
            if (!caretRect) return
            setCaretPos(placeMentionDropdown({
                caretRect,
                containerRect: container.getBoundingClientRect(),
                viewportHeight: window.innerHeight,
            }))
        } catch {
            // Selection not available — keep the previous placement.
        }
    }, [containerRef])

    // Trigger detection: parse the text before the caret on every transaction.
    useEffect(() => {
        if (!isWeb || !tipTap) return undefined
        const syncTrigger = () => {
            if (tipTap.isDestroyed) return
            const parsed = parseMentionTrigger(getTextBeforeCursorFromTiptap(tipTap))
            if (parsed) {
                setTrigger(parsed.term, parsed.indicator)
                requestAnimationFrame(reposition)
            } else {
                setTrigger('', '')
            }
        }
        tipTap.on('transaction', syncTrigger)
        tipTap.on('selectionUpdate', syncTrigger)
        return () => {
            tipTap.off('transaction', syncTrigger)
            tipTap.off('selectionUpdate', syncTrigger)
        }
    }, [tipTap, setTrigger, reposition])

    // While the list is visible, follow resize and (captured) nested scroll.
    useEffect(() => {
        if (!isWeb || !hasSuggestions) return undefined
        const onReposition = () => requestAnimationFrame(reposition)
        onReposition()
        window.addEventListener('resize', onReposition)
        window.addEventListener('scroll', onReposition, true)
        return () => {
            window.removeEventListener('resize', onReposition)
            window.removeEventListener('scroll', onReposition, true)
        }
    }, [hasSuggestions, reposition])

    // Preventing mousedown's default keeps focus + the active trigger so onPress fires.
    useEffect(() => {
        if (!isWeb || !hasSuggestions) return undefined
        const node = dropdownRef.current
        if (!node?.addEventListener) return undefined
        const onMouseDown = (e: any) => e.preventDefault()
        node.addEventListener('mousedown', onMouseDown)
        return () => node.removeEventListener('mousedown', onMouseDown)
    }, [dropdownRef, hasSuggestions])

    // Placement is only meaningful while there is a list; deriving (instead of
    // clearing state in an effect) keeps the last position for the frame before
    // the next reposition lands, so a reopened list doesn't jump.
    return hasSuggestions ? caretPos : null
}
