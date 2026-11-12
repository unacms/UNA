import Html from 'app/ui/atoms/html'
import type { BlockNoticeProps } from './block-notice.types'

/** A block footer's notice: small, muted, centred, wrapped lines balanced. */
export default function BlockNotice({ html }: Readonly<BlockNoticeProps>) {
    return (
        <Html
            data={html}
            customClassName="u-vanilla-html-small"
            className="w-full text-center text-balance text-xs! leading-[1.125rem]! text-muted-foreground! [&_a]:text-muted-foreground! [&_a]:underline [&_a]:underline-offset-2"
        />
    )
}
