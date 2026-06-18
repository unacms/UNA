'use client';
import { lazy, Suspense, useState, useEffect } from 'react';
import Loading from 'app/ui/atoms/loading';
import { appSetting } from 'app/lib/util';

const EditorInner = lazy(() => import('./editor-inner'));
const EditorInnerEnriched = lazy(() => import('./editor-inner-enriched'));

export default function RftText(props) {
    // enriched-html web использует Tiptap под капотом и падает при SSR
    // (immediatelyRender нельзя пробросить через публичный API) — рендерим
    // редактор только после монтирования на клиенте.
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
