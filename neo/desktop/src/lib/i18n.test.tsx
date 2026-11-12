import { render } from '@testing-library/react';
import i18next from 'i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { chooseLanguage, knownLanguageChoice, language, LANGUAGES, list, locale, num, resolveLanguage, savedLanguage, setLanguageForTest, t, tn } from './i18n';
import { rich } from './i18n-rich';

beforeAll(() => {
    // words only these tests use, next to what src/locales/ru.json has
    i18next.addResourceBundle(
        'ru',
        'translation',
        {
            'Test: sign out': 'Тест: выйти',
            'Test: signed in as {{name}}': 'Тест: вы вошли как {{name}}',
            'Test: {{count}} follower_one': 'Тест: {{count}} подписчик',
            'Test: {{count}} follower_few': 'Тест: {{count}} подписчика',
            'Test: {{count}} follower_many': 'Тест: {{count}} подписчиков',
            'Test: {{count}} follower_other': 'Тест: {{count}} подписчика',
            'Test: {{count}} reply_one': 'Тест: {{count}} ответ',
            'Test: open_verb': 'Тест: открыть',
            'Test: open': 'Тест: открыто',
            'Test: {{count}} of {{total}}': 'Тест: {{count}} из {{total}}',
        },
        true,
        true,
    );
});

afterEach(() => {
    setLanguageForTest('system');
    localStorage.clear();
});

describe('the language', () => {
    it('is the first of the system languages the app has, with the system tag as the locale', () => {
        expect(resolveLanguage('system', ['ru-RU', 'en-US'])).toEqual({ language: 'ru', locale: 'ru-RU' });
        expect(resolveLanguage('system', ['ja-JP', 'en-GB'])).toEqual({ language: 'en', locale: 'en-GB' });
        expect(resolveLanguage('system', ['RU'])).toEqual({ language: 'ru', locale: 'RU' });
    });

    it('is English where the system has none the app knows', () => {
        expect(resolveLanguage('system', ['ja-JP'])).toEqual({ language: 'en', locale: 'en' });
        expect(resolveLanguage('system', [])).toEqual({ language: 'en', locale: 'en' });
    });

    it('is the one chosen, whatever the system has', () => {
        expect(resolveLanguage('ru', ['en-US'])).toEqual({ language: 'ru', locale: 'ru' });
        expect(resolveLanguage('en', ['ru-RU'])).toEqual({ language: 'en', locale: 'en' });
    });

    it('takes only the system or a language it has as a choice', () => {
        expect(LANGUAGES).toContain('en');
        expect(LANGUAGES).toContain('ru');
        expect(knownLanguageChoice('system')).toBe('system');
        expect(knownLanguageChoice('ru')).toBe('ru');
        expect(knownLanguageChoice('xx')).toBeUndefined();
        expect(knownLanguageChoice('RU')).toBeUndefined();
        expect(knownLanguageChoice(null)).toBeUndefined();
    });

    it('keeps nothing and loads nothing again for a choice that is not a language', () => {
        const reload = vi.fn();
        expect(chooseLanguage('xx', reload)).toBe(false);
        expect(chooseLanguage('<script>', reload)).toBe(false);
        expect(reload).not.toHaveBeenCalled();
        expect(localStorage.length).toBe(0);
    });

    it('is kept, and the window is loaded again when it changes', () => {
        const reload = vi.fn();
        expect(savedLanguage()).toBe('system');
        expect(chooseLanguage('ru', reload)).toBe(true);
        expect(savedLanguage()).toBe('ru');
        expect(reload).toHaveBeenCalledTimes(1);
        expect(chooseLanguage('ru', reload)).toBe(false);
        expect(reload).toHaveBeenCalledTimes(1);
        expect(chooseLanguage('system', reload)).toBe(true);
        expect(savedLanguage()).toBe('system');
        expect(localStorage.length).toBe(0);
    });

    it('ignores a stored value that is not a language', () => {
        localStorage.setItem('una-desktop-language', 'xx');
        expect(savedLanguage()).toBe('system');
    });

    it('is on <html>, for screen readers', () => {
        expect(document.documentElement.lang).toBe('en');
        setLanguageForTest('ru');
        expect(document.documentElement.lang).toBe('ru');
    });
});

describe('English', () => {
    it('is the text itself', () => {
        expect(language()).toBe('en');
        expect(t('Test: sign out')).toBe('Test: sign out');
        expect(t('A sentence. With a dot: and a colon')).toBe('A sentence. With a dot: and a colon');
    });

    it('puts the variables in, numbers the English way', () => {
        expect(t('Test: signed in as {{name}}', { name: 'Zoe <b>' })).toBe('Test: signed in as Zoe <b>');
        expect(t('{{count}} characters at most', { count: 12345 })).toBe('12,345 characters at most');
        expect(t('Year {{year}}', { year: '2026' })).toBe('Year 2026');
    });

    it('picks one or the other form by the count', () => {
        expect(tn(1, 'Test: {{count}} follower', 'Test: {{count}} followers')).toBe('Test: 1 follower');
        expect(tn(0, 'Test: {{count}} follower', 'Test: {{count}} followers')).toBe('Test: 0 followers');
        expect(tn(2500, 'Test: {{count}} follower', 'Test: {{count}} followers')).toBe('Test: 2,500 followers');
        expect(tn(2, '{{count}} of {{total}} file', '{{count}} of {{total}} files', { total: 3 })).toBe('2 of 3 files');
    });

    it('is the plain text for a context', () => {
        expect(t('Test: open', { context: 'verb' })).toBe('Test: open');
    });
});

describe('another language', () => {
    it('has its own words, and English for what it lacks', () => {
        setLanguageForTest('ru');
        expect(language()).toBe('ru');
        expect(locale()).toBe('ru');
        expect(t('Test: sign out')).toBe('Тест: выйти');
        expect(t('Test: signed in as {{name}}', { name: 'Zoe' })).toBe('Тест: вы вошли как Zoe');
        expect(t('Test: no such words {{n}}', { n: 5 })).toBe('Test: no such words 5');
    });

    it('has the forms its counts take', () => {
        setLanguageForTest('ru');
        const say = (n: number) => tn(n, 'Test: {{count}} follower', 'Test: {{count}} followers');
        expect(say(1)).toBe('Тест: 1 подписчик');
        expect(say(3)).toBe('Тест: 3 подписчика');
        expect(say(5)).toBe('Тест: 5 подписчиков');
        expect(say(21)).toBe('Тест: 21 подписчик');
        expect(say(1500).replace(/\s/g, ' ')).toBe('Тест: 1 500 подписчиков');
    });

    it('says a count in English when it lacks the form for it', () => {
        setLanguageForTest('ru');
        expect(tn(1, 'Test: {{count}} reply', 'Test: {{count}} replies')).toBe('Тест: 1 ответ');
        expect(tn(5, 'Test: {{count}} reply', 'Test: {{count}} replies')).toBe('Test: 5 replies');
        expect(tn(5, 'Test: {{count}} vote', 'Test: {{count}} votes')).toBe('Test: 5 votes');
    });

    it('translates the same English by its context', () => {
        setLanguageForTest('ru');
        expect(t('Test: open', { context: 'verb' })).toBe('Тест: открыть');
        expect(t('Test: open')).toBe('Тест: открыто');
        expect(t('Test: sign out', { context: 'none' })).toBe('Тест: выйти');
    });

    it('writes numbers and lists its own way', () => {
        expect(num(1234.5)).toBe('1,234.5');
        expect(list(['A', 'B', 'C'])).toBe('A, B, and C');
        setLanguageForTest('ru');
        expect(num(1234.5).replace(/\s/g, ' ')).toBe('1 234,5');
        expect(list(['A', 'B', 'C'])).toBe('A, B и C');
        expect(list(['A', 'B'], 'disjunction')).toBe('A или B');
    });

    it('keeps the system tag as the locale when the system picks the language', () => {
        setLanguageForTest('system', ['en-GB']);
        expect(language()).toBe('en');
        expect(locale()).toBe('en-GB');
    });
});

describe('a sentence with elements in it', () => {
    it('draws each mark with its part, wherever the translation puts it', () => {
        const parts = { a: (text: string) => <a href="/terms">{text}</a>, b: (text: string) => <strong>{text}</strong> };
        const { container, rerender } = render(<p>{rich('Read the <a>terms</a> and <b>agree</b>.', parts)}</p>);
        expect(container.innerHTML).toBe('<p>Read the <a href="/terms">terms</a> and <strong>agree</strong>.</p>');
        rerender(<p>{rich('<b>Согласитесь</b> с <a>условиями</a>', parts)}</p>);
        expect(container.innerHTML).toBe('<p><strong>Согласитесь</strong> с <a href="/terms">условиями</a></p>');
    });

    it('draws a mark without a part as its words, and plain text as it is', () => {
        const { container, rerender } = render(<p>{rich('One <x>two</x> three', {})}</p>);
        expect(container.textContent).toBe('One two three');
        rerender(<p>{rich('1 < 2 and a <b>', {})}</p>);
        expect(container.textContent).toBe('1 < 2 and a <b>');
    });
});
