/**
 * A translated sentence with elements inside it: the translator moves the marked words, the
 * code says what each mark is.
 *
 *     rich(t('Read the <a>terms</a> first'), { a: (text) => <a href={url}>{text}</a> })
 *
 * A mark is `<name>words</name>`; marks do not nest. A mark the code has no part for is drawn
 * as its words.
 */
import { Fragment, type ReactNode } from 'react';

export type RichParts = Record<string, (text: string) => ReactNode>;

const MARK = /<([a-z][a-z0-9]*)>(.*?)<\/\1>/gs;

export function rich(text: string, parts: RichParts): ReactNode {
    const out: ReactNode[] = [];
    let at = 0;
    for (const m of text.matchAll(MARK)) {
        const [whole, name = '', inner = ''] = m;
        const start = m.index;
        if (start > at) out.push(text.slice(at, start));
        const part = parts[name];
        out.push(<Fragment key={start}>{part ? part(inner) : inner}</Fragment>);
        at = start + whole.length;
    }
    if (at < text.length) out.push(text.slice(at));
    return out.length === 1 && typeof out[0] === 'string' ? out[0] : <>{out}</>;
}
