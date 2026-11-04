'use client'

import Root from 'app/root-client'
import { Loading } from 'app/customization/loading'
import { appSetting } from 'app/config'
import { useFetch } from 'app/lib/hooks/use-fetch'
import { useTranslation } from 'react-i18next'

const SITE_TITLE = appSetting('config', 'title')
const HOME_PAGE_URL = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home'

// Guest-safe 404 payload for when the backend is unreachable.
const FALLBACK_DATA = {
    title: SITE_TITLE,
    description: SITE_TITLE,
    uri: 'home',
    url: '/',
    page_name: 'home',
    page_type: 'home',
    logged: 0,
    blocks: {},
    page_status: 404,
}

/**
 * 404 page with the home page chrome (header, menus). The home data is loaded
 * here, on the client, only when a 404 is actually shown: Next puts the root
 * `not-found` into the RSC payload of every page, so a server-side fetch in
 * not-found.js ran against UNA on every request and doubled the page payload.
 */
export default function NotFoundClient() {
    const { data: response, isLoading } = useFetch(HOME_PAGE_URL)
    const { t } = useTranslation()

    if (isLoading) {
        return <Loading />
    }

    // The home page's chrome, but not its title: the layout writes `title` into the tab.
    const data = { ...(response?.data ?? FALLBACK_DATA), page_status: 404, title: t('Page not found') }

    return <Root path={'home'} data={data} uri={data.uri} url={data.url} code={404} />
}
