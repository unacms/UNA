'use client';
import dynamic from 'next/dynamic';
import Loading from 'app/ui/atoms/loading';
import { appSetting } from 'app/lib/util';

// TenTap + Tiptap are heavy and Tiptap still cannot SSR through the public API
// (immediatelyRender). `ssr: false` keeps both engines out of the route bundle
// and skips the server render; only the configured engine's chunk is fetched.
const RftTextInner = dynamic(
    () =>
        appSetting('editor', 'engine') === 'enriched'
            ? import('./editor-inner-enriched')
            : import('./editor-inner'),
    { ssr: false, loading: () => <Loading /> },
);

export default function RftText(props) {
    return <RftTextInner {...props} />;
}
