import Root from 'app/root-client'
import { Suspense } from 'react'
import { Loading } from 'app/customization/loading'
// CSS imports removed - already imported in root layout.js
// This prevents Next.js from creating a separate not-found.css bundle
// that gets speculatively preloaded on all pages
import { cache } from 'react'
import { UNA_URL, UNA_API_KEY } from 'app/config';
import { cookies } from 'next/headers'
import { appSetting } from 'app/config';
import { resolveServerLangCode } from '../lib/resolve-lang'

const SITE_TITLE = appSetting('config', 'title');;
// Mirror the resilience tuning used by getRemoteSettings() in packages/app/config.js
// so a slow/stalled backend degrades gracefully instead of hard-crashing the 404 page.
const FETCH_TIMEOUT_MS = 3500;
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 300;

// Guest-safe 404 payload so the page still renders when the backend is unreachable.
const buildFallbackData = () => ({
    data: {
        title: SITE_TITLE,
        description: SITE_TITLE,
        uri: 'home',
        url: '/',
        page_name: 'home',
        page_type: 'home',
        logged: 0,
        blocks: {},
        page_status: 404,
    },
    code: 404,
});

export const getData = cache(async () => {

    const cookieStore = await cookies()
    const cookieString = cookieStore.getAll()
        .map((item) => item.name + '=' + encodeURIComponent(item.value))
        .join('; ');

    const opts = {
        headers: {
            cookie: cookieString,
            authorization: 'Bearer ' + UNA_API_KEY,
        },
        cache: 'no-store'
    };
    const langCode = await resolveServerLangCode();
    let l = UNA_URL + '/api.php' + '?r=system/get_page_by_request/TemplServicePages&params[]=' + 'home';
    if (langCode) {
        l += '&lang=' + encodeURIComponent(langCode);
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const res = await fetch(l, { ...opts, signal: controller.signal });
            const b = await res.json();
            // Backend returned something unexpected (no data envelope) — fall back.
            if (!b || typeof b.data === 'undefined' || b.data === null) {
                return buildFallbackData();
            }
            b.data.page_status = 404;
            if (typeof b.code === 'undefined') {
                b.code = 404;
            }
            return b;
        } catch (error) {
            if (attempt < MAX_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * attempt));
                continue;
            }
            console.error('not-found getData fetch failed after retries:', error);
            return buildFallbackData();
        } finally {
            clearTimeout(timeout);
        }
    }

    return buildFallbackData();
});

export default async function NotFound() {
    const data = await getData();    

    
    return (
        <Suspense fallback={<Loading/>}>
            <Root path={'home'} data={data?.data} uri={data?.data?.uri} url={data?.data?.url} code={data.code}></Root>
        </Suspense>
  )
}