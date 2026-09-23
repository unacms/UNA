// Props shared by html.tsx (native) and html.web.tsx.
import type { Ref } from 'react'

export type HtmlProps = {
    /** UNA HTML string. */
    data?: string | null
    /** Replaces the default `u-vanilla-html` class (web); `u-vanilla-html-small` shrinks text (native). */
    customClassName?: string
    className?: string
    innerRef?: Ref<any>
    /**
     * Web only: every link opens in a new tab — for content whose links are
     * destinations (an agent's answer), where leaving the page loses the thread.
     */
    linksInNewTab?: boolean
}
