import { lazy, Suspense } from 'react';
import Loading from 'app/ui/atoms/loading';

const EditorInner = lazy(() => import('./editor-inner'));

export default function RftText(props) {
    return (
        <Suspense fallback={<Loading />}>
            <EditorInner {...props} />
        </Suspense>
    );
}
