'use client';
import { lazy, Suspense, useState, useEffect } from 'react';
import Loading from 'app/ui/atoms/loading';
import { appSetting } from 'app/lib/util';

const EditorInner = lazy(() => import('./editor-inner'));
const EditorInnerEnriched = lazy(() => import('./editor-inner-enriched'));

export default function RftText(props) {
    // enriched-html web uses Tiptap under the hood and crashes during SSR
    // (immediatelyRender cannot be passed through the public API) — render
    // the editor only after client mount.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const engine = appSetting('editor', 'engine');
    const Inner = engine === 'enriched' ? EditorInnerEnriched : EditorInner;

    if (!mounted) return <Loading />;

    return (
        <Suspense fallback={<Loading />}>
            <Inner {...props} />
        </Suspense>
    );
}
