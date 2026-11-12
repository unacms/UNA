import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { LANGUAGE_NAMES, LANGUAGES } from '../lib/i18n';
import { expectedKeys, extract, extractFrom, pluralForms, slots, untranslated, untranslatedIn, type Extracted } from './extract';

const DIR = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
const extracted = extract();

function read(source: string, path = 'x.tsx'): Extracted {
    const into: Extracted = { plain: new Map(), plural: new Map(), problems: [] };
    extractFrom(join(DIR, '..', path), source, into);
    return into;
}

describe('reading the source for its words', () => {
    it('finds t() and tn() of lib/i18n, under whatever name', () => {
        const got = read(`
            import { t, tn as plural } from '../lib/i18n';
            const a = t('Sign out');
            const b = t(\`Signed in as {{name}}\`, { name });
            const c = t('Open', { context: 'verb' });
            const d = plural(n, '{{count}} file', '{{count}} files');
            const e = <p title={t("It's here")}>{t('Open')}</p>;
        `);
        expect([...got.plain]).toEqual([
            ['Sign out', 'Sign out'],
            ['Signed in as {{name}}', 'Signed in as {{name}}'],
            ['Open_verb', 'Open'],
            ["It's here", "It's here"],
            ['Open', 'Open'],
        ]);
        expect([...got.plural]).toEqual([['{{count}} file', '{{count}} files']]);
        expect(got.problems).toEqual([]);
    });

    it('leaves another t alone', () => {
        const got = read(`
            const t = (s: string) => s;
            t('Not ours');
            tasks.map((t) => t('x'));
        `);
        expect(got.plain.size).toBe(0);
        expect(got.problems).toEqual([]);
    });

    it('reports a call it cannot read', () => {
        const got = read(`
            import { t, tn } from './lib/i18n';
            t(label);
            t(\`Hello \${name}\`);
            t('Open', { context: kind });
            t('Open', vars);
            tn(n, one, 'files');
            tn(n, '{{count}} file', '{{count}} files');
            tn(n, '{{count}} file', '{{count}} file(s)');
        `);
        expect(got.problems).toEqual([
            'x.tsx:3 t() takes the English as a literal',
            'x.tsx:4 t() takes the English as a literal',
            'x.tsx:5 t() takes its variables as an object literal, with a literal context',
            'x.tsx:6 t() takes its variables as an object literal, with a literal context',
            'x.tsx:7 tn() takes both English forms as literals',
            "x.tsx:9 tn('{{count}} file') has another plural elsewhere",
        ]);
    });

    it('knows what varies in a text', () => {
        expect(slots('Read the <a>terms</a>, {{name}}: {{ count }} of {{count}}')).toEqual({ vars: ['count', 'name'], marks: ['a'] });
        expect(slots('Plain. 1 < 2')).toEqual({ vars: [], marks: [] });
    });

    it('asks a language for each of its count forms', () => {
        expect(pluralForms('en')).toEqual(['one', 'other']);
        expect(pluralForms('ru')).toEqual(['one', 'few', 'many', 'other']);
        const got = read(`import { tn } from './lib/i18n'; tn(n, '{{count}} file', '{{count}} files');`);
        expect([...expectedKeys(got, 'ru')]).toEqual([
            ['{{count}} file_one', '{{count}} file'],
            ['{{count}} file_few', '{{count}} files'],
            ['{{count}} file_many', '{{count}} files'],
            ['{{count}} file_other', '{{count}} files'],
        ]);
    });
});

describe('English written straight into what is drawn', () => {
    it('is found between tags and in the attributes people read or hear', () => {
        const found = untranslatedIn(
            join(DIR, '..', 'x.tsx'),
            `
            const a = <p className="note">Saved to drafts</p>;
            const b = <button aria-label="Close the pane" title={busy ? 'Working on it' : label} data-kind="Not words" />;
            const c = <p>{count > 1 ? 'Several files' : t('One file')}</p>;
            const d = <img alt={\`Photo by \${name}\`} />;
            const e = <input placeholder={hint || 'Search people'} />;
            `,
        );
        expect(found).toEqual(['x.tsx:2 Saved to drafts', 'x.tsx:3 Close the pane', 'x.tsx:3 Working on it', 'x.tsx:4 Several files', 'x.tsx:5 `Photo by ${name}`', 'x.tsx:6 Search people']);
    });

    it('leaves t(), symbols, site data and lines marked i18n-ok alone', () => {
        const found = untranslatedIn(
            join(DIR, '..', 'x.tsx'),
            `
            const a = <p title={t('Saved')}>{t('Saved to drafts')}</p>;
            const b = <span aria-hidden="true">·</span>;
            const c = <p>{post.title}</p>;
            const d = <input placeholder="community.example" />; // i18n-ok
            {/* i18n-ok */}
            const e = <kbd>Enter</kbd>;
            `,
        );
        expect(found).toEqual([]);
    });
});

describe("the app's words", () => {
    it('are all literals the reader can follow', () => {
        expect(extracted.problems).toEqual([]);
    });

    it('are never English written straight into what is drawn', () => {
        expect(untranslated()).toEqual([]);
    });

    it('have a file for each language the app offers, and a name for it', () => {
        expect(files.map((f) => f.replace('.json', '')).sort()).toEqual(LANGUAGES.filter((l) => l !== 'en').sort());
        for (const language of LANGUAGES) expect(LANGUAGE_NAMES[language], language).toBeTruthy();
    });

    describe.each(files)('%s', (file) => {
        const language = file.replace('.json', '');
        const have = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as Record<string, string>;
        const expected = expectedKeys(extracted, language);

        it('has every text the app shows', () => {
            expect([...expected.keys()].filter((key) => !(key in have))).toEqual([]);
        });

        it('has nothing the app no longer shows', () => {
            expect(Object.keys(have).filter((key) => !expected.has(key))).toEqual([]);
        });

        it('keeps what varies in each text: its {{names}} and its <marks>', () => {
            const wrong: string[] = [];
            for (const [key, value] of Object.entries(have)) {
                const english = expected.get(key);
                if (english === undefined) continue;
                if (typeof value !== 'string' || !value.trim()) {
                    wrong.push(`${key}: empty`);
                    continue;
                }
                const from = slots(english);
                const to = slots(value);
                // a count form may spell its number out ("one file"), so it may leave {{count}} out
                const counted = extracted.plural.has(key.replace(/_[a-z]+$/, '')) && !extracted.plain.has(key);
                const varsOk = counted ? to.vars.every((v) => v === 'count' || from.vars.includes(v)) && from.vars.every((v) => v === 'count' || to.vars.includes(v)) : to.vars.join() === from.vars.join();
                if (!varsOk) wrong.push(`${key}: {{${to.vars.join(', ')}}} for {{${from.vars.join(', ')}}}`);
                if (to.marks.join() !== from.marks.join()) wrong.push(`${key}: <${to.marks.join(', ')}> for <${from.marks.join(', ')}>`);
            }
            expect(wrong).toEqual([]);
        });
    });
});
