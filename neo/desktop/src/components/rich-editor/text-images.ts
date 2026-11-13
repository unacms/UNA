/**
 * The pictures of a form's text (a post's, a discussion's), and the form's hold while one is on
 * its way.
 */
import { useMemo, useRef, useState } from 'react';

import { useApp } from '../../lib/context';
import { t } from '../../lib/i18n';
import { makeUploader, type Uploader } from '../../lib/uploads';
import { inlineUploader } from './images';

/** Said where a form is held for a picture of its text. */
export const uploadsHold = () => `${t('Wait until the uploads are done')}.`;

/**
 * The pictures of a form's text: the site's editor storage (POST /uploads/inline). The editor
 * puts a picture in the text only when its upload is done, so the form is told while one is on
 * its way (`pending` for what it shows, `busy()` for a press before it is drawn again): from the
 * paste or the drop being made ready until the editor has had the site's answer. A form that
 * sent its text meanwhile would send it without the picture.
 */
export function useTextImages(uploader?: Uploader) {
    const { api } = useApp();
    const count = useRef(0);
    const [pending, setPending] = useState(0);
    const sink = useMemo(() => {
        const base = uploader ?? makeUploader(api);
        const counted =
            <A extends unknown[], R>(run: (...args: A) => Promise<R>) =>
            (...args: A): Promise<R> => {
                setPending(++count.current);
                const done = run(...args);
                const over = () => setPending(--count.current);
                // one turn later than who waits for it (the editor, which then starts the upload or puts the picture in)
                const settled = () => undefined;
                void done.then(settled, settled).then(over);
                return done;
            };
        return { uploader: { ...base, fromFiles: counted((...args: Parameters<Uploader['fromFiles']>) => base.fromFiles(...args)), fromPaths: counted((...args: Parameters<Uploader['fromPaths']>) => base.fromPaths(...args)) }, uploadInline: counted(inlineUploader(base)), busy: () => count.current > 0 };
    }, [uploader, api]);
    return useMemo(() => ({ ...sink, pending }), [sink, pending]);
}

export type TextImages = ReturnType<typeof useTextImages>;
