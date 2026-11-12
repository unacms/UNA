import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Schema } from 'una-api';

import { Avatar, Cover, hueOf, initials } from '../components/avatar';
import { AppContext, type AppContextValue } from './context';
import { forgetFailures, isLocalHost, mediaSrc, RETRY_DELAY_MS } from './media';

afterEach(() => {
    cleanup();
    forgetFailures();
});

const LOCAL = 'http://desktop.localhost:8090';

describe('mediaSrc', () => {
    it('keeps https, image data: and blob: URLs', () => {
        expect(mediaSrc('https://cdn.example/a.jpg', LOCAL)).toBe('https://cdn.example/a.jpg');
        expect(mediaSrc('https://cdn.example/a.jpg', null)).toBe('https://cdn.example/a.jpg');
        expect(mediaSrc('data:image/svg+xml;base64,PHN2Zz4=', null)).toBe('data:image/svg+xml;base64,PHN2Zz4=');
        expect(mediaSrc('data:image/png,abc', null)).toBe('data:image/png,abc');
        expect(mediaSrc('blob:tauri://localhost/1234', null)).toBe('blob:tauri://localhost/1234');
    });

    it('refuses data: that is not an image', () => {
        expect(mediaSrc('data:text/html,<script>alert(1)</script>', LOCAL)).toBeNull();
        expect(mediaSrc('data:,hello', LOCAL)).toBeNull();
    });

    it('takes plain http only from the signed-in site, and only on a local host', () => {
        expect(mediaSrc(`${LOCAL}/storage/a.jpg`, LOCAL)).toBe(`${LOCAL}/storage/a.jpg`);
        expect(mediaSrc(`${LOCAL}/storage/a.jpg`, `${LOCAL}/`)).toBe(`${LOCAL}/storage/a.jpg`);
        expect(mediaSrc('http://127.0.0.1:8088/a.jpg', 'http://127.0.0.1:8088')).toBe('http://127.0.0.1:8088/a.jpg');
        expect(mediaSrc('http://localhost:8088/a.jpg', 'http://localhost:8088')).toBe('http://localhost:8088/a.jpg');
        // another port, another local host, a remote http host, no site at all
        expect(mediaSrc('http://desktop.localhost:8091/a.jpg', LOCAL)).toBeNull();
        expect(mediaSrc('http://other.localhost:8090/a.jpg', LOCAL)).toBeNull();
        expect(mediaSrc('http://community.example/a.jpg', 'http://community.example')).toBeNull();
        expect(mediaSrc(`${LOCAL}/a.jpg`, null)).toBeNull();
    });

    it('in the app, sends a local site picture through the una-media scheme, and nothing else', () => {
        const pic = `${LOCAL}/image_transcoder.php?o=bx_persons_avatar&h=46&s=a1`;
        expect(mediaSrc(pic, LOCAL, 'una-media://localhost/')).toBe(`una-media://localhost/?u=${encodeURIComponent(pic)}`);
        expect(mediaSrc(pic, LOCAL, 'http://una-media.localhost/')).toBe(`http://una-media.localhost/?u=${encodeURIComponent(pic)}`);
        // https and data: never go through it; a picture of another host is refused before it
        expect(mediaSrc('https://cdn.example/a.jpg', LOCAL, 'una-media://localhost/')).toBe('https://cdn.example/a.jpg');
        expect(mediaSrc('data:image/png,abc', LOCAL, 'una-media://localhost/')).toBe('data:image/png,abc');
        expect(mediaSrc('http://other.localhost:8090/a.jpg', LOCAL, 'una-media://localhost/')).toBeNull();
    });

    it('refuses everything else', () => {
        expect(mediaSrc(null, LOCAL)).toBeNull();
        expect(mediaSrc(undefined, LOCAL)).toBeNull();
        expect(mediaSrc('', LOCAL)).toBeNull();
        expect(mediaSrc('/storage/a.jpg', LOCAL)).toBeNull();
        expect(mediaSrc('javascript:alert(1)', LOCAL)).toBeNull();
        expect(mediaSrc('file:///etc/passwd', LOCAL)).toBeNull();
        expect(mediaSrc('ftp://cdn.example/a.jpg', LOCAL)).toBeNull();
        expect(mediaSrc('https://user:pw@cdn.example/a.jpg', LOCAL)).toBeNull();
    });

    it('knows the local hosts auth.rs lets sign in over http', () => {
        expect(isLocalHost('localhost')).toBe(true);
        expect(isLocalHost('127.0.0.1')).toBe(true);
        expect(isLocalHost('Desktop.LOCALHOST')).toBe(true);
        expect(isLocalHost('localhost.example')).toBe(false);
        expect(isLocalHost('notlocalhost')).toBe(false);
    });
});

const lily = { id: '4', kind: 'person', display_name: 'Lily Carter', avatar: `${LOCAL}/lily.jpg` } as Schema<'Profile'>;
const garden = { id: '13', kind: 'group', display_name: 'UNA Network', avatar: null } as unknown as Schema<'Profile'>;

function signedIn(children: React.ReactNode, siteUrl = LOCAL) {
    return <AppContext.Provider value={{ siteUrl } as AppContextValue}>{children}</AppContext.Provider>;
}

describe('Avatar', () => {
    it('shows the picture of the signed-in site', () => {
        const { container } = render(signedIn(<Avatar profile={lily} size={40} />));
        const img = container.querySelector('img.avatar') as HTMLImageElement;
        expect(img.getAttribute('src')).toBe(`${LOCAL}/lily.jpg`);
        expect(img.getAttribute('alt')).toBe('');
        expect(img.getAttribute('data-shape')).toBe('circle');
        expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    });

    it('a picture that fails to load becomes a coloured monogram, is tried once more, then stays one', () => {
        vi.useFakeTimers();
        try {
            const { container, unmount } = render(signedIn(<Avatar profile={lily} size={40} />));
            // the image is filled in the monogram's colour while it loads
            expect(container.querySelector('img.avatar')?.getAttribute('data-hue')).toBe(String(hueOf('4')));
            fireEvent.error(container.querySelector('img.avatar') as HTMLImageElement);
            const mono = container.querySelector('.avatar-mono') as HTMLElement;
            expect(mono.textContent).toBe('LC');
            expect(mono.getAttribute('aria-hidden')).toBe('true');
            expect(mono.getAttribute('data-hue')).toBe(String(hueOf('4')));
            expect(container.querySelector('img')).toBeNull();
            // a failure may pass (the scheme's 503): one more try
            act(() => {
                vi.advanceTimersByTime(RETRY_DELAY_MS);
            });
            fireEvent.error(container.querySelector('img.avatar') as HTMLImageElement);
            act(() => {
                vi.advanceTimersByTime(RETRY_DELAY_MS * 2);
            });
            expect(container.querySelector('img')).toBeNull();
            unmount();
            // the next one drawn for the same picture does not try again
            const again = render(signedIn(<Avatar profile={lily} size={24} />));
            expect(again.container.querySelector('img')).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    it('a failed picture is forgotten when the session changes, and shown again where it is drawn', () => {
        vi.useFakeTimers();
        try {
            const { container } = render(signedIn(<Avatar profile={lily} size={40} />));
            fireEvent.error(container.querySelector('img.avatar') as HTMLImageElement);
            act(() => {
                vi.advanceTimersByTime(RETRY_DELAY_MS);
            });
            fireEvent.error(container.querySelector('img.avatar') as HTMLImageElement);
            expect(container.querySelector('img')).toBeNull();
            // a switch to another network and back (app.tsx calls this for every new session)
            act(() => {
                forgetFailures();
            });
            expect(container.querySelector('img.avatar')?.getAttribute('src')).toBe(`${LOCAL}/lily.jpg`);
        } finally {
            vi.useRealTimers();
        }
    });

    it('a picture the page may not load is a monogram from the start', () => {
        const { container } = render(signedIn(<Avatar profile={lily} size={40} />, 'https://community.example'));
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('.avatar-mono')?.textContent).toBe('LC');
    });

    it('groups are rounded squares; small avatars take one letter', () => {
        const { container } = render(signedIn(<Avatar profile={garden} size={20} />));
        const mono = container.querySelector('.avatar-mono') as HTMLElement;
        expect(mono.getAttribute('data-shape')).toBe('square');
        expect(mono.textContent).toBe('U');
    });

    it('monograms take the first grapheme of the first two words, in any script', () => {
        expect(initials('Мила Сантос', 40)).toBe('МС');
        expect(initials('نور حداد', 40)).toBe('نح');
        expect(initials('  ella  ', 40)).toBe('E');
        expect(initials('', 40)).toBe('?');
        expect(initials('Zoë 👩‍🚀 Laurent', 40)).toBe('Z👩‍🚀');
    });

    it('the hue is the same for an id everywhere, one of eight', () => {
        expect(hueOf('65')).toBe(hueOf('65'));
        const hues = new Set(Array.from({ length: 200 }, (_, i) => hueOf(String(i))));
        expect([...hues].every((h) => h >= 0 && h < 8)).toBe(true);
        expect(hues.size).toBe(8);
    });
});

describe('Cover', () => {
    it('shows the cover, or a band in the monogram colour without one', () => {
        const { container, rerender } = render(signedIn(<Cover profile={lily} url={`${LOCAL}/cover.jpg`} />));
        expect(container.querySelector('img.cover')?.getAttribute('src')).toBe(`${LOCAL}/cover.jpg`);
        fireEvent.error(container.querySelector('img.cover') as HTMLImageElement);
        // waiting for its second try: the band meanwhile
        expect(container.querySelector('.cover-fallback')?.getAttribute('data-hue')).toBe(String(hueOf('4')));
        rerender(signedIn(<Cover profile={lily} url={null} />));
        expect(container.querySelector('.cover-fallback')?.getAttribute('aria-hidden')).toBe('true');
        expect(screen.queryByRole('img')).toBeNull();
    });
});
