type ClickLike = {
    button?: number
    metaKey?: boolean
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
}

/**
 * Whether a click on a link opens it in this tab: a plain primary click on a
 * link without `target="_blank"`. Ctrl/Cmd, Shift and Alt clicks open a new
 * tab or window, or download, and leave this page where it is.
 */
export function opensInThisTab(event: ClickLike | undefined, target?: string | null): boolean {
    if (target === '_blank') return false
    if (!event) return true
    return (event.button ?? 0) === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
