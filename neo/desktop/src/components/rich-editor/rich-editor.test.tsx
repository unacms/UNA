import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createUnaApi, type Schema, type UnaApi } from 'una-api';

import { AppContext, type AppContextValue } from '../../lib/context';
import type { Picked, Staging, Uploader } from '../../lib/uploads';
import { normalizeHref } from './link-form';
import { cleanPastedHtml } from './paste';
import { RichEditor } from './rich-editor';
import { findTrigger, localHashtags } from './suggestions';
import { editorOf } from './test-utils';

const SITE = 'https://community.example';
const me = { account: { id: '3', email: 'lily@example.com' }, active_profile_id: '4', profiles: [] } as unknown as Schema<'Me'>;
const lily = { id: '7', display_name: 'Lily Hart', handle: 'lily', url: `${SITE}/u/lily`, avatar: null } as unknown as Schema<'Profile'>;
const lionel = { id: '8', display_name: 'Lionel Ray', handle: null, url: `${SITE}/u/lionel`, avatar: null } as unknown as Schema<'Profile'>;

type Call = { path: string; query: string };

function fakeApi(calls: Call[], people: Schema<'Profile'>[] = [lily, lionel], tags: Schema<'Hashtag'>[] = []): UnaApi {
    return createUnaApi({
        siteUrl: SITE,
        fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            const request = input instanceof Request ? input : new Request(input, init);
            const url = new URL(request.url);
            calls.push({ path: url.pathname.replace(/^\/api\/v2/, ''), query: url.search });
            return new Response(JSON.stringify(url.pathname.endsWith('/hashtags') ? tags : people), { status: 200, headers: { 'Content-Type': 'application/json' } });
        },
    });
}

function wrapper(api: UnaApi) {
    const ctx: AppContextValue = { api, siteUrl: SITE, me, signOut: () => {}, signingOut: false, messageTo: () => {} };
    return function Wrapper({ children }: { children: ReactNode }) {
        return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
    };
}

const uploader = (): Uploader => ({
    pick: async () => ({ files: [], refused: [] }),
    fromFiles: async (files) => ({ files: files.map((f) => ({ file: f, name: f.name, size: f.size, mime: f.type, kind: f.type.startsWith('image/') ? ('image' as const) : ('file' as const) })), refused: [] }),
    fromPaths: async () => ({ files: [], refused: [] }),
    upload: async () => {
        throw new Error('not here');
    },
    cancel: () => {},
    release: () => {},
});

/** The box with its value kept in state, as the composers do. */
function Box(props: Partial<Parameters<typeof RichEditor>[0]> & { onHtml?: (html: string, text: string) => void; initial?: string }) {
    const [value, setValue] = useState(props.initial ?? '');
    return (
        <RichEditor
            mode="mini"
            label="Comment"
            placeholder="Write a comment"
            {...props}
            value={props.value ?? value}
            onChange={(html, text) => {
                setValue(html);
                props.onHtml?.(html, text);
            }}
        />
    );
}

const textbox = () => screen.getByRole('textbox', { name: /./ });
const type = (text: string) => act(() => void editorOf(textbox()).commands.insertContent(text));

afterEach(() => {
    cleanup();
    localStorage.clear();
});

describe('the rich text box', () => {
    it('is a named multi-line text box with its placeholder, and writes the site’s HTML', () => {
        const onHtml = vi.fn();
        render(<Box onHtml={onHtml} describedBy="hint" />, { wrapper: wrapper(fakeApi([])) });
        const box = screen.getByRole('textbox', { name: 'Comment' });
        expect(box.getAttribute('aria-multiline')).toBe('true');
        expect(box.getAttribute('aria-placeholder')).toBe('Write a comment');
        expect(box.getAttribute('aria-describedby')).toBe('hint');
        type('see example.com');
        expect(onHtml).toHaveBeenLastCalledWith('<p>see <a href="https://example.com">example.com</a></p>', 'see example.com');
        // mini mode has no toolbar
        expect(screen.queryByRole('toolbar')).toBeNull();
    });

    it('shows a stored text, and a new value from outside replaces it', () => {
        const { rerender } = render(<RichEditor mode="mini" label="Text" value='<p>Hi <a class="bx-mention-link" data-profile-id="7" href="https://community.example/u/lily">Lily Hart</a></p>' onChange={() => {}} />, { wrapper: wrapper(fakeApi([])) });
        expect(textbox().textContent).toBe('Hi @Lily Hart');
        rerender(<RichEditor mode="mini" label="Text" value="" onChange={() => {}} />);
        expect(textbox().textContent).toBe('');
    });

    it('takes no typing while read-only, and keeps focus', () => {
        const onHtml = vi.fn();
        render(<Box onHtml={onHtml} readOnly />, { wrapper: wrapper(fakeApi([])) });
        type('x');
        expect(onHtml).not.toHaveBeenCalled();
        expect(textbox().getAttribute('aria-readonly')).toBe('true');
        expect(textbox().getAttribute('contenteditable')).toBe('true');
    });

    it('gives the composer its keys, after its own', () => {
        const onKeyDown = vi.fn((e: KeyboardEvent) => e.key === 'Enter' && !e.shiftKey);
        render(<Box onKeyDown={onKeyDown} />, { wrapper: wrapper(fakeApi([])) });
        fireEvent.keyDown(textbox(), { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
});

describe('mentions', () => {
    it('finds the @ or # the caret ends', () => {
        expect(findTrigger('hi @li', 10)).toEqual({ char: '@', query: 'li', from: 7, to: 10 });
        expect(findTrigger('#tag', 4)).toEqual({ char: '#', query: 'tag', from: 0, to: 4 });
        expect(findTrigger('mail@li', 7)).toBeNull();
        expect(findTrigger('hi @li there', 12)).toBeNull();
    });

    it('suggests people as a listbox the box points to, and adds the one chosen', async () => {
        const calls: Call[] = [];
        const onHtml = vi.fn();
        const onKeyDown = vi.fn(() => true);
        render(<Box onHtml={onHtml} onKeyDown={onKeyDown} />, { wrapper: wrapper(fakeApi(calls)) });
        type('Hi @li');
        const list = await screen.findByRole('listbox', { name: 'People to mention' });
        expect(calls.at(-1)).toEqual({ path: '/search/profiles', query: '?q=li&limit=6' });
        const options = screen.getAllByRole('option');
        expect(options.map((o) => o.querySelector('.rich-suggestion-name')?.textContent)).toEqual(['Lily Hart', 'Lionel Ray']);
        const box = textbox();
        expect(box.getAttribute('aria-controls')).toBe(list.id);
        expect(box.getAttribute('aria-activedescendant')).toBe(options[0]!.id);
        expect(options[0]!.getAttribute('aria-selected')).toBe('true');

        fireEvent.keyDown(box, { key: 'ArrowDown' });
        expect(box.getAttribute('aria-activedescendant')).toBe(options[1]!.id);
        fireEvent.keyDown(box, { key: 'ArrowUp' });
        fireEvent.keyDown(box, { key: 'Enter' });
        // Enter was the list's, not the composer's
        expect(onKeyDown).not.toHaveBeenCalled();
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(box.hasAttribute('aria-activedescendant')).toBe(false);
        expect(onHtml).toHaveBeenLastCalledWith('<p>Hi <a href="https://community.example/u/lily" title="Lily Hart" dchar="@" data-profile-id="7" class="bx-mention-link">@Lily Hart</a> </p>', 'Hi @Lily Hart');
    });

    it('closes with Escape, which goes no further', async () => {
        const onKeyDown = vi.fn(() => true);
        const outer = vi.fn();
        render(
            <div onKeyDown={outer}>
                <Box onKeyDown={onKeyDown} />
            </div>,
            { wrapper: wrapper(fakeApi([])) },
        );
        type('@li');
        await screen.findByRole('listbox');
        fireEvent.keyDown(textbox(), { key: 'Escape' });
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(onKeyDown).not.toHaveBeenCalled();
        expect(outer).not.toHaveBeenCalled();
        // typing on in the same word does not bring it back
        type('o');
        await new Promise((r) => setTimeout(r, 200));
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('asks nobody when mentions are off', async () => {
        const calls: Call[] = [];
        render(<Box mentions={false} />, { wrapper: wrapper(fakeApi(calls)) });
        type('@li');
        await new Promise((r) => setTimeout(r, 200));
        expect(calls).toEqual([]);
        expect(screen.queryByRole('listbox')).toBeNull();
    });
});

describe('hashtags', () => {
    it('offers tags used here lately; a picked one is text', async () => {
        localHashtags.used('hikes');
        localHashtags.used('hiking');
        const onHtml = vi.fn();
        render(<Box onHtml={onHtml} />, { wrapper: wrapper(fakeApi([])) });
        type('Going #hi');
        await screen.findByRole('listbox', { name: 'Hashtags' });
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['#hi', '#hiking', '#hikes']);
        fireEvent.keyDown(textbox(), { key: 'ArrowDown' });
        fireEvent.keyDown(textbox(), { key: 'Enter' });
        expect(onHtml).toHaveBeenLastCalledWith('<p>Going #hiking </p>', 'Going #hiking');
    });

    it('offers the site’s hashtags; a picked one is the site’s tag link', async () => {
        const calls: Call[] = [];
        const onHtml = vi.fn();
        const tags = [{ tag: 'hiking', count: 3, url: `${SITE}/tags/hiking` }];
        render(<Box onHtml={onHtml} />, { wrapper: wrapper(fakeApi(calls, [], tags)) });
        type('Going #hik');
        await screen.findByRole('listbox', { name: 'Hashtags' });
        expect(calls.at(-1)).toEqual({ path: '/hashtags', query: '?q=hik&limit=6' });
        expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['#hik', '#hiking3 posts']);
        fireEvent.keyDown(textbox(), { key: 'ArrowDown' });
        fireEvent.keyDown(textbox(), { key: 'Enter' });
        expect(onHtml).toHaveBeenLastCalledWith(`<p>Going <a class="bx-tag-link" dchar="#" href="${SITE}/tags/hiking">#hiking</a> </p>`, 'Going #hiking');
    });

    it('shows nothing for a tag never used: typing goes on as text', async () => {
        const onKeyDown = vi.fn(() => true);
        render(<Box onKeyDown={onKeyDown} />, { wrapper: wrapper(fakeApi([])) });
        type('#brandnew');
        await new Promise((r) => setTimeout(r, 200));
        expect(screen.queryByRole('listbox')).toBeNull();
        fireEvent.keyDown(textbox(), { key: 'Enter' });
        expect(onKeyDown).toHaveBeenCalled();
    });
});

describe('formatting and links', () => {
    it('has an accessible toolbar in full mode', () => {
        const onHtml = vi.fn();
        render(<Box mode="full" label="Text" onHtml={onHtml} />, { wrapper: wrapper(fakeApi([])) });
        const toolbar = screen.getByRole('toolbar', { name: 'Formatting' });
        const bold = screen.getByRole('button', { name: 'Bold' });
        expect(bold.getAttribute('aria-pressed')).toBe('false');
        expect(bold.getAttribute('tabindex')).toBe('0');
        expect(screen.getByRole('button', { name: 'Italic' }).getAttribute('tabindex')).toBe('-1');
        // arrows move between the buttons
        bold.focus();
        fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Italic' }));
        fireEvent.keyDown(toolbar, { key: 'End' });
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Link' }));

        fireEvent.click(bold);
        type('strong words');
        expect(screen.getByRole('button', { name: 'Bold' }).getAttribute('aria-pressed')).toBe('true');
        expect(onHtml).toHaveBeenLastCalledWith('<p><strong>strong words</strong></p>', 'strong words');
        act(() => void editorOf(textbox()).chain().toggleHeading({ level: 2 }).run());
        expect(onHtml).toHaveBeenLastCalledWith('<h2><strong>strong words</strong></h2>', 'strong words');
    });

    it('adds a link with ⌘K (Ctrl+K elsewhere)', () => {
        const onHtml = vi.fn();
        render(<Box onHtml={onHtml} />, { wrapper: wrapper(fakeApi([])) });
        type('Read ');
        const mac = /Mac/.test(navigator.platform);
        fireEvent.keyDown(textbox(), { key: 'k', metaKey: mac, ctrlKey: !mac });
        const field = screen.getByRole('textbox', { name: 'Link address' });
        fireEvent.change(field, { target: { value: 'una.io/docs' } });
        fireEvent.keyDown(field, { key: 'Enter' });
        expect(screen.queryByRole('textbox', { name: 'Link address' })).toBeNull();
        expect(onHtml).toHaveBeenLastCalledWith('<p>Read <a href="https://una.io/docs">una.io/docs</a></p>', 'Read una.io/docs');
    });

    it('takes web addresses and emails as links, nothing else', () => {
        expect(normalizeHref('https://a.example/x')).toBe('https://a.example/x');
        expect(normalizeHref('www.a.example')).toBe('https://www.a.example');
        expect(normalizeHref('me@a.example')).toBe('mailto:me@a.example');
        expect(normalizeHref('javascript:alert(1)')).toBeNull();
        expect(normalizeHref('just words')).toBeNull();
    });
});

describe('pasting', () => {
    it('cleans pasted HTML down to the mode', () => {
        const pasted = '<div style="color:red" onclick="x()"><b>Bold</b> <a href="javascript:x()">bad</a> <a href="https://ok.example" target="_blank">ok</a><script>x()</script><img src="https://p.example/a.png" onerror="x()"></div>';
        const mini = cleanPastedHtml(pasted, 'mini');
        expect(mini).not.toMatch(/style|onclick|onerror|script|javascript|<b>|<img/);
        expect(mini).toContain('Bold');
        expect(mini).toContain('<a href="https://ok.example">ok</a>');
        const full = cleanPastedHtml(pasted, 'full');
        expect(full).toContain('<b>Bold</b>');
        expect(full).toContain('<img src="https://p.example/a.png">');
        expect(full).not.toMatch(/style|onclick|onerror|script|javascript|target/);
    });

    it('reads pasted rich HTML into the mode’s text', () => {
        const onHtml = vi.fn();
        render(<Box onHtml={onHtml} />, { wrapper: wrapper(fakeApi([])) });
        const html = '<h1 style="font-size:40px">Title</h1><p>see <strong>this</strong> <a href="https://x.example">link</a></p>';
        fireEvent.paste(textbox(), { clipboardData: { getData: (t: string) => (t === 'text/html' ? html : t === 'text/plain' ? 'Title see this link' : ''), files: [], types: ['text/html', 'text/plain'] } });
        expect(onHtml).toHaveBeenLastCalledWith('<p>Title</p><p>see this <a href="https://x.example">link</a></p>', 'Title\nsee this link');
    });

    const png = () => new File(['x'], 'shot.png', { type: 'image/png' });
    const pasteFiles = (files: File[]) => fireEvent.paste(textbox(), { clipboardData: { getData: () => '', files, types: ['Files'] } });

    it('gives pasted pictures to the composer’s attachments in mini mode', async () => {
        const attach = vi.fn((s: Staging) => s);
        const outer = vi.fn();
        render(
            <div onPaste={outer}>
                <Box images={{ uploader: uploader(), attach }} />
            </div>,
            { wrapper: wrapper(fakeApi([])) },
        );
        pasteFiles([png()]);
        await waitFor(() => expect(attach).toHaveBeenCalledTimes(1));
        expect(attach.mock.calls[0]![0].files.map((f) => f.name)).toEqual(['shot.png']);
        // the composer's own paste handler does not take them a second time
        expect(outer).not.toHaveBeenCalled();
    });

    it('says when pictures can’t go in the text yet', async () => {
        const announce = vi.fn();
        render(<Box mode="full" label="Text" announce={announce} images={{ uploader: uploader(), refusal: 'Pictures can’t be added to a post’s text yet.' }} />, { wrapper: wrapper(fakeApi([])) });
        pasteFiles([png()]);
        await waitFor(() => expect(announce).toHaveBeenCalledWith('Pictures can’t be added to a post’s text yet.'));
    });

    it('puts pasted pictures in the text through uploadInline in full mode', async () => {
        const onHtml = vi.fn();
        const uploadInline = vi.fn(async (_file: Picked) => ({ src: 'https://community.example/storage.php?o=sys_images_editor&f=1.png', width: 320, height: 200 }));
        render(<Box mode="full" label="Text" onHtml={onHtml} images={{ uploader: uploader(), uploadInline }} />, { wrapper: wrapper(fakeApi([])) });
        pasteFiles([png()]);
        await waitFor(() => expect(onHtml).toHaveBeenLastCalledWith('<p><img src="https://community.example/storage.php?o=sys_images_editor&amp;f=1.png" width="320" height="200"></p>', ''));
        expect(uploadInline.mock.calls[0]![0]).toMatchObject({ name: 'shot.png', kind: 'image' });
    });
});
