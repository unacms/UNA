/**
 * The app's own words in the person's language (i18next, as NEO uses it).
 *
 * The English text is the key: `t('Sign out')`. English needs no file; every other language is
 * one JSON file in src/locales, keyed by the English text. src/locales/locales.test.ts reads the
 * source for these calls and fails when a language lacks a key, keeps one nothing uses, or has
 * a translation with other placeholders than its English.
 *
 *     t('Sign out')
 *     t('Signed in as {{name}}', { name })
 *     tn(count, '{{count}} follower', '{{count}} followers')
 *     t('Open', { context: 'verb' })       // the same English, translated differently: key Open_verb
 *     rich(t('Read the <a>terms</a>'), { a: (text) => <a href={url}>{text}</a> })   (i18n-rich.tsx)
 *
 * The first argument is always a literal, so the test can find it. A number passed as a variable
 * is a quantity and is written the language's way (1,234); pass a year or an id as a string.
 *
 * The language is this computer's, like the theme: chosen in Settings or the system's, kept in
 * localStorage and read before anything is drawn. It never changes while a page lives: choosing
 * another one reloads the window (`chooseLanguage`), so `t` is a plain function that any module
 * may call, at any time, with no hook and nothing to re-render.
 *
 * What the site says (menu items, errors, content) comes from the site, which is asked for the
 * same language (lib/api.ts).
 */
import i18next from 'i18next';

import de from '../locales/de.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import ru from '../locales/ru.json';
import { readStored, writeStored } from './storage';

/** The languages the app has words for; English is the source. Add one: its file, and a line here. */
const RESOURCES: Record<string, Record<string, string>> = { de, es, fr, ru };

export const LANGUAGES = ['en', ...Object.keys(RESOURCES)] as const;
export type Language = string;
/** What Settings keeps: a language, or the system's. */
export type LanguageChoice = 'system' | Language;

/** Each language's name in itself, as a language menu shows it. */
export const LANGUAGE_NAMES: Record<string, string> = { en: 'English', ru: 'Русский', de: 'Deutsch', es: 'Español', fr: 'Français' };

const KEY = 'una-desktop-language';

/**
 * The app's own copy of a language choice: 'system' or the entry of LANGUAGES that equals the
 * value, undefined for anything else. What is kept (localStorage, Settings) is this copy, never
 * the string that came in: a select's value or a stored string can be made to hold anything.
 */
export function knownLanguageChoice(value: unknown): LanguageChoice | undefined {
    if (value === 'system') return 'system';
    return LANGUAGES.find((code) => code === value);
}

export function savedLanguage(): LanguageChoice {
    return knownLanguageChoice(readStored(KEY)) ?? 'system';
}

/**
 * The language to use and the locale to write dates and numbers in. With the system's language,
 * the locale is the system's own tag (en-GB keeps its dates); a chosen language is its own.
 */
export function resolveLanguage(choice: LanguageChoice, preferred: readonly string[]): { language: Language; locale: string } {
    if (choice !== 'system') return { language: choice, locale: choice };
    for (const tag of preferred) {
        const base = tag.toLowerCase().split('-')[0] ?? '';
        if ((LANGUAGES as readonly string[]).includes(base)) return { language: base, locale: tag };
    }
    return { language: 'en', locale: 'en' };
}

function systemLanguages(): readonly string[] {
    if (typeof navigator === 'undefined') return [];
    return navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : [];
}

let current = resolveLanguage(savedLanguage(), systemLanguages());

function numberFormat(): Intl.NumberFormat {
    return new Intl.NumberFormat(current.locale);
}
let numbers = numberFormat();

void i18next.init({
    lng: current.language,
    fallbackLng: 'en',
    resources: Object.fromEntries(Object.entries(RESOURCES).map(([lang, translation]) => [lang, { translation }])),
    // the keys are English sentences: a dot or a colon in one is punctuation
    keySeparator: false,
    nsSeparator: false,
    // inline resources, so `t` works as soon as this module is loaded
    initImmediate: false,
    returnNull: false,
    interpolation: {
        // React escapes what it draws
        escapeValue: false,
        alwaysFormat: true,
        format: (value: unknown) => (typeof value === 'number' ? numbers.format(value) : String(value ?? '')),
    },
});

if (typeof document !== 'undefined') document.documentElement.lang = current.language;

export type Vars = Record<string, string | number> & { context?: string };

/** The language in use (`en`, `ru`, ...). */
export function language(): Language {
    return current.language;
}

/** The locale for `Intl` and `toLocale...String`: never pass `undefined` there. */
export function locale(): string {
    return current.locale;
}

/** `text` in the person's language. `text` is a literal: the English, with `{{name}}` for what varies. */
export function t(text: string, vars?: Vars): string {
    return i18next.t(text, vars ?? {});
}

/**
 * A text with a count in it, in the form the language uses for that count. Both arguments are
 * literals; a language's file has the key `one` with that language's forms (`_one`, `_few`,
 * `_many`, `_other`: what `Intl.PluralRules` lists for it).
 */
export function tn(count: number, one: string, other: string, vars?: Vars): string {
    const all = { ...vars, count };
    // English, and a count form the language's file lacks: the English forms
    if (current.language === 'en' || !i18next.exists(one, all)) return i18next.t(count === 1 ? one : other, { ...all, lng: 'en' });
    return i18next.t(one, all);
}

/**
 * A command's name or what it does, from lib/commands.json (`label`, `help`): the one text that
 * is not a literal where it is said. The check reads that file for these.
 */
export function tCommand(text: string): string {
    return i18next.t(text);
}

/** A number the language's way (1,234 or 1 234). */
export function num(value: number, options?: Intl.NumberFormatOptions): string {
    return options ? new Intl.NumberFormat(current.locale, options).format(value) : numbers.format(value);
}

/** "A, B and C" the language's way. */
export function list(items: readonly string[], type: 'conjunction' | 'disjunction' = 'conjunction'): string {
    return new Intl.ListFormat(current.locale, { style: 'long', type }).format(items);
}

/**
 * Choose a language (Settings): kept, then the window is loaded again in it. Returns false when
 * nothing changes.
 */
export function chooseLanguage(choice: LanguageChoice, reload: () => void = () => window.location.reload()): boolean {
    const known = knownLanguageChoice(choice);
    if (known === undefined || known === savedLanguage()) return false;
    writeStored(KEY, known === 'system' ? null : known);
    reload();
    return true;
}

/** For tests: use a language without loading the page again. */
export function setLanguageForTest(choice: LanguageChoice, preferred: readonly string[] = ['en-US']): void {
    current = resolveLanguage(choice, preferred);
    numbers = numberFormat();
    void i18next.changeLanguage(current.language);
    if (typeof document !== 'undefined') document.documentElement.lang = current.language;
}
