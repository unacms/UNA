import { useFetch } from 'app/lib/hooks/use-fetch'
import { appSetting } from 'app/lib/util'
import { isHttpUrl } from 'app/lib/editor/inline-video'
import Link from 'app/ui/atoms/link'
import Embed from 'app/ui/molecules/content/embed'
import InlineMediaFrame from 'app/ui/molecules/content/inline-media-frame'

/** Embed-button link in a post body: UNA embed card / player (same API as the `embed` form field). */
export default function InlineEmbed({ url, width, align }) {
    const safe = isHttpUrl(url)
    // Encoded: the URL is a query value (`params[]=`), its own `&` would split it.
    const { data: response } = useFetch(safe ? `/api.php?r=${appSetting('urls', 'embeds_new')}${encodeURIComponent(url)}` : null)

    if (!safe) return null

    // Until UNA answers (or when it can't embed the URL) keep the plain link.
    if (!response?.data)
        return (
            <InlineMediaFrame width={width} align={align}>
                <Link href={url} asExternal>{url}</Link>
            </InlineMediaFrame>
        )

    return (
        <InlineMediaFrame width={width} align={align}>
            <Embed data={{ url, ...response.data }} />
        </InlineMediaFrame>
    )
}
