import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../lib/context';
import { RouterProvider } from '../lib/navigation';
import { RouteHistory } from '../lib/router';
import { displayHtml, embedUrlOf, forgetLinkCards, RichText } from './rich-text';

const SITE = 'https://community.example';
const QUILL_MENTION = `<a href="${SITE}/u/lily" title="Lily Hart" dchar="@" data-profile-id="7" class="bx-mention-link">@Lily Hart</a>`;

afterEach(cleanup);

describe('stored HTML on display', () => {
    it('takes no data-* or aria-* attribute from a post but a mention’s profile id', () => {
        const out = displayHtml(
            `<div data-tauri-drag-region data-pane="list" data-own-keys="" aria-hidden="true"><p aria-label="Close" data-id="7">Hi</p><span role="button" tabindex="0">x</span></div><p>${QUILL_MENTION}</p>`,
            SITE,
        );
        expect(out).not.toMatch(/data-tauri|data-pane|data-own-keys|data-id|aria-|role=|tabindex/);
        expect(out).toContain('data-profile-id="7"');
        expect(out).toContain('Hi');
    });

    it('keeps it strict: no styles, handlers, scripts or javascript: links', () => {
        const out = displayHtml('<p style="color:red" onclick="x()">Hi <a href="javascript:alert(1)">bad</a> <img src="https://p.example/a.png" onerror="x()"><script>x()</script></p>', SITE);
        expect(out).not.toMatch(/style|onclick|onerror|script|javascript/);
        expect(out).toContain('Hi bad');
        expect(out).toContain('<img src="https://p.example/a.png" loading="lazy" alt="">');
    });

    it('shows mentions in every way they are written as one kind of link', () => {
        for (const m of [QUILL_MENTION, `<a class="bx-mention-link" data-profile-id="7" href="${SITE}/u/lily">Lily Hart</a>`, `<a class="bx-mention bx-link" data-profile-id="7" href="${SITE}/u/lily">@Lily Hart</a>`]) {
            expect(displayHtml(`<p>${m}</p>`, SITE)).toBe(`<p><a href="${SITE}/u/lily" class="rich-mention" data-profile-id="7">@Lily Hart</a></p>`);
        }
    });

    it('makes hashtags, typed or picked, a search; not in links or code', () => {
        expect(displayHtml('<p>Going #hiking (#trip) <code>#no</code> <a href="https://x.example/#a">x #b</a></p>', SITE)).toBe(
            '<p>Going <a class="rich-hashtag" href="#tag/hiking" data-hashtag="hiking">#hiking</a> (<a class="rich-hashtag" href="#tag/trip" data-hashtag="trip">#trip</a>) <code>#no</code> <a href="https://x.example/#a">x #b</a></p>',
        );
        expect(displayHtml('<p><a class="bx-tag-link" dchar="#" href="https://community.example/tags/hiking">#hiking</a></p>', SITE)).toBe('<p><a href="https://community.example/tags/hiking" class="rich-hashtag" data-hashtag="hiking">#hiking</a></p>');
        // outside the app's navigation (a test, a window without routes) they stay text
        expect(displayHtml('<p>#hiking</p>', SITE, false)).toBe('<p>#hiking</p>');
    });

    it('shows embeds as a link card', () => {
        const card = '<a class="rich-embed-card" href="https://video.example/v/1"><span class="rich-embed-host">video.example</span><span class="rich-embed-url">https://video.example/v/1</span></a>';
        expect(displayHtml('<div class="bx-embed-link" source="https://video.example/v/1">https://video.example/v/1</div>', SITE)).toBe(card);
        expect(displayHtml('<p><img src="https://community.example/storage.php?o=sys_images_editor&amp;f=a.jpg#neo-embed=https%3A%2F%2Fvideo.example%2Fv%2F1"></p>', SITE)).toBe(`<p>${card}</p>`);
        expect(embedUrlOf('https://x/a.jpg#neo-embed=javascript%3Aalert(1)')).toBeNull();
        // another div is its content
        expect(displayHtml('<div class="x">a</div>', SITE)).toBe('a');
        // a relative or fragment link would move the app's page: its words
        expect(displayHtml('<p><a href="/page/x">x</a> <a href="#top">top</a></p>', SITE)).toBe('<p>x top</p>');
    });

    it('shows the site’s inline pictures with their size, and only ones the app loads', () => {
        expect(displayHtml('<p><img src="https://community.example/storage.php?o=sys_images_editor&amp;f=x.png" width="640" height="0" alt="A map" class="big"></p>', SITE)).toBe(
            '<p><img src="https://community.example/storage.php?o=sys_images_editor&amp;f=x.png" width="640" alt="A map" loading="lazy"></p>',
        );
        // plain http from elsewhere: its words
        expect(displayHtml('<p><img src="http://elsewhere.example/a.png" alt="A cat"></p>', SITE)).toBe('<p>A cat</p>');
        // relative to the site
        expect(displayHtml('<p><img src="storage.php?o=sys_images_editor&amp;f=y.png"></p>', SITE)).toContain('src="https://community.example/storage.php?o=sys_images_editor&amp;f=y.png"');
    });

    it('keeps paragraph alignment as the app’s own class', () => {
        expect(displayHtml('<p class="ql-align-center">c</p><p class="text-right">r</p><p class="evil">x</p>', SITE)).toBe('<p class="rich-align-center">c</p><p class="rich-align-right">r</p><p>x</p>');
    });
});

describe('embed cards', () => {
    it('fill with the site’s preview of the link', async () => {
        forgetLinkCards();
        const asked: string[] = [];
        const api = createUnaApi({
            siteUrl: SITE,
            fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
                const url = new URL((input instanceof Request ? input : new Request(input, init)).url);
                asked.push(url.pathname + url.search);
                const card = { url: 'https://video.example/v/1', host: 'video.example', state: 'ready', title: 'A <b>video</b>', description: 'About it', site_name: 'Video', image: 'https://video.example/t.jpg' };
                return new Response(JSON.stringify(card), { status: 200, headers: { 'Content-Type': 'application/json' } });
            },
        });
        const ctx = { api, siteUrl: SITE, me: { active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>, signOut: () => {}, signingOut: false, messageTo: () => {} } as AppContextValue;
        const html = '<div class="bx-embed-link" source="https://video.example/v/1">https://video.example/v/1</div>';
        render(
            <AppContext.Provider value={ctx}>
                <RichText html={html} />
                <RichText html={html} />
            </AppContext.Provider>,
        );
        await waitFor(() => expect(document.querySelectorAll('.rich-embed-card.is-filled')).toHaveLength(2));
        const card = document.querySelector('.rich-embed-card')!;
        expect(card.getAttribute('href')).toBe('https://video.example/v/1');
        expect(card.querySelector('.rich-embed-title')?.textContent).toBe('A <b>video</b>');
        expect(card.querySelector('.rich-embed-title b')).toBeNull();
        expect(card.querySelector('img')?.getAttribute('src')).toBe('https://video.example/t.jpg');
        // one request for the link, however often it is shown
        expect(asked).toEqual(['/api/v2/links/preview?url=' + encodeURIComponent('https://video.example/v/1')]);
    });
});

describe('links in the text', () => {
    function renderText(html: string) {
        const history = new RouteHistory({ list: { section: 'home' }, detail: null });
        const ctx = { api: {} as UnaApi, siteUrl: SITE, me: { active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>, signOut: () => {}, signingOut: false, messageTo: () => {} } as AppContextValue;
        const Wrap = ({ children }: { children: ReactNode }) => (
            <AppContext.Provider value={ctx}>
                <RouterProvider history={history}>{children}</RouterProvider>
            </AppContext.Provider>
        );
        render(<RichText html={html} />, { wrapper: Wrap });
        return history;
    }

    it('opens a mentioned profile here', () => {
        const history = renderText(`<p>${QUILL_MENTION}</p>`);
        const outside = { clicked: false };
        const listen = () => (outside.clicked = true);
        document.addEventListener('click', listen);
        fireEvent.click(screen.getByRole('link', { name: '@Lily Hart' }));
        document.removeEventListener('click', listen);
        expect(history.current.list).toEqual({ section: 'profile', profile: '7' });
        // the app's link handler on the document never sees it
        expect(outside.clicked).toBe(false);
    });

    it('searches for a hashtag here', () => {
        const history = renderText('<p>Going #hiking</p>');
        fireEvent.click(screen.getByRole('link', { name: '#hiking' }));
        expect(history.current.list).toEqual({ section: 'search', q: '#hiking', tab: 'posts' });
    });
});
