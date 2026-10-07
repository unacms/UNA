import { useFetch } from 'app/lib/hooks/use-fetch'
import { appSetting } from 'app/lib/util'
import { View } from 'app/design/view'
import Html from 'app/ui/atoms/html'
import Embed from 'app/ui/molecules/content/embed'

/** Embed-button link in a post body: UNA embed card / player (same API as the `embed` form field). */
export default function InlineEmbed({ url }) {
    // Encoded: the URL is a query value (`params[]=`), its own `&` would split it.
    const { data: response } = useFetch(`/api.php?r=${appSetting('urls', 'embeds_new')}${encodeURIComponent(url)}`)

    // Until UNA answers (or when it can't embed the URL) keep the plain link.
    if (!response?.data)
        return <Html data={`<p><a href="${url.replace(/"/g, '&quot;')}">${url.replace(/</g, '&lt;')}</a></p>`} />

    return (
        <View className='w-full my-3'>
            <Embed data={{ url, ...response.data }} />
        </View>
    )
}
