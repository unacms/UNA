import { useFetch } from 'app/lib/hooks/use-fetch'
import { appSetting } from 'app/lib/util'
import { isHttpUrl } from 'app/lib/editor/inline-video'
import { View } from 'app/design/view'
import Link from 'app/ui/atoms/link'
import Embed from 'app/ui/molecules/content/embed'

/** Embed-button link in a post body: UNA embed card / player (same API as the `embed` form field). */
export default function InlineEmbed({ url }) {
    const safe = isHttpUrl(url)
    // Encoded: the URL is a query value (`params[]=`), its own `&` would split it.
    const { data: response } = useFetch(safe ? `/api.php?r=${appSetting('urls', 'embeds_new')}${encodeURIComponent(url)}` : null)

    if (!safe) return null

    // Until UNA answers (or when it can't embed the URL) keep the plain link.
    if (!response?.data)
        return (
            <View className='my-3'>
                <Link href={url} asExternal>{url}</Link>
            </View>
        )

    return (
        <View className='w-full my-3'>
            <Embed data={{ url, ...response.data }} />
        </View>
    )
}
