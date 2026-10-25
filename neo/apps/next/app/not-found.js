import NotFoundClient from './not-found-client'
import { appSetting } from 'app/config'
// CSS imports removed - already imported in root layout.js
// This prevents Next.js from creating a separate not-found.css bundle
// that gets speculatively preloaded on all pages

// Static, like the rest of this file. Next adds `noindex` to every 404 itself.
export const metadata = {
    title: appSetting('config', 'title'),
}

// No server data here: Next renders the root not-found into every page's RSC
// payload, so anything fetched here is paid for on every request. The home
// page chrome is loaded on the client, only when a 404 is shown.
export default function NotFound() {
    return <NotFoundClient />
}
