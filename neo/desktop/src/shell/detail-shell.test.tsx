import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const native = vi.hoisted(() => ({ copy: vi.fn(async (_text: string) => undefined) }));
vi.mock('../lib/native', async (importOriginal) => ({ ...(await importOriginal<typeof import('../lib/native')>()), copyText: native.copy }));

const nav = vi.hoisted(() => ({ forget: vi.fn() }));
vi.mock('../lib/navigation', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../lib/navigation')>()),
    useNavigation: () => ({ forget: nav.forget }),
}));

const opened = vi.hoisted(() => ({ open: vi.fn(), available: true }));
vi.mock('../lib/open-in-window', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../lib/open-in-window')>()),
    useOpenInWindow: () => (opened.available ? opened.open : null),
}));

const menus = vi.hoisted(() => ({ shown: [] as unknown[] }));
vi.mock('../lib/native-menu', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../lib/native-menu')>()),
    showMenu: vi.fn(async (entries: unknown[]) => {
        menus.shown.push(entries);
    }),
}));

vi.mock('./pane', async (importOriginal) => {
    const real = await importOriginal<typeof import('./pane')>();
    return {
        ...real,
        // the pane's own behaviour has its tests; here: what the frame puts in it
        Pane: ({ title, actions, children }: { title: string; actions: React.ReactNode; children: React.ReactNode }) => (
            <section aria-label={title}>
                <div role="toolbar">{actions}</div>
                {children}
            </section>
        ),
        CloseDetailButton: () => <button type="button">Close details</button>,
    };
});

import { ApiError } from '../lib/api';
import { useCopyLink } from '../lib/copy-link';
import { DetailShell, type DetailQuery, focusMoreButton } from './detail-shell';

type Item = { title: string; url?: string };

const loaded = (data: Item): DetailQuery<Item> => ({ data, error: null, isError: false, isLoading: false, isFetching: false, refetch: vi.fn() });

function Frame(props: Partial<Parameters<typeof DetailShell<Item>>[0]> & { query: DetailQuery<Item> }) {
    const item = props.query.isError ? undefined : props.query.data;
    return (
        <DetailShell<Item>
            detail={{ kind: 'poll', id: '7' }}
            noun="poll"
            icon="vote"
            item={item}
            title={item?.title ?? 'Poll'}
            announcement={{ text: '', seq: 0 }}
            announce={vi.fn()}
            className="thread poll-detail"
            {...props}
        >
            {(shown) => <p>Drawn: {shown.title}</p>}
        </DetailShell>
    );
}

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    menus.shown.length = 0;
    opened.available = true;
});

describe('the detail frame', () => {
    it('draws the item, and Open in New Window, More and Close in that order', () => {
        render(<Frame query={loaded({ title: 'Lunch?' })} tools={<button type="button">Download</button>} more={() => ({})} />);
        expect(screen.getByText('Drawn: Lunch?')).toBeTruthy();
        const names = screen.getAllByRole('button').map((b) => b.getAttribute('aria-label') ?? b.textContent);
        expect(names).toEqual(['Download', 'Open in New Window', 'More for the poll', 'Close details']);
        expect(screen.getByRole('button', { name: 'More for the poll' }).dataset.more).toBe('poll');
        expect(document.querySelector('.thread.poll-detail [role="status"]')).toBeTruthy();
    });

    it('has no item buttons and a skeleton while it loads', () => {
        const { container } = render(<Frame query={{ ...loaded({ title: 'x' }), data: undefined, isLoading: true }} tools={<button type="button">Download</button>} more={() => ({})} />);
        expect(container.querySelector('.skeleton')).toBeTruthy();
        expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Close details']);
    });

    it('says an item that is gone, and Close forgets it', () => {
        const error = new ApiError('Not found', 404);
        render(<Frame query={{ data: undefined, error, isError: true, isLoading: false, isFetching: false, refetch: vi.fn() }} />);
        expect(screen.getByText('This poll is gone')).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(nav.forget).toHaveBeenCalledWith({ kind: 'poll', id: '7' });
    });

    it('says an item the person may not see as such', () => {
        render(<Frame query={{ data: undefined, error: new ApiError('Forbidden', 403), isError: true, isLoading: false, isFetching: false, refetch: vi.fn() }} inContext />);
        expect(screen.getByText('You can’t see this poll')).toBeTruthy();
        expect(screen.getByText('It is in a group you are not in.')).toBeTruthy();
    });

    it('shows another failure with Try again', () => {
        const refetch = vi.fn();
        render(<Frame query={{ data: undefined, error: new Error('The site answered 502'), isError: true, isLoading: false, isFetching: false, refetch }} />);
        expect(screen.getByRole('alert').textContent).toContain('The site answered 502');
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(refetch).toHaveBeenCalledTimes(1);
    });

    it('builds More: Open in New Window, the lead, Copy Link, then the own entries after a separator', () => {
        const own = [{ text: 'Delete Poll…', run: vi.fn() }];
        const lead = [{ text: 'Download…', run: vi.fn() }];
        render(<Frame query={loaded({ title: 'Lunch?', url: 'https://a.example/p/7' })} more={(item) => ({ link: item.url, lead, own })} />);
        fireEvent.click(screen.getByRole('button', { name: 'More for the poll' }));
        const entries = menus.shown[0] as ({ text: string } | 'separator')[];
        expect(entries.map((e) => (e === 'separator' ? '—' : e.text))).toEqual(['Open in New Window', 'Download…', 'Copy Link', '—', 'Delete Poll…']);
    });

    it('has no separator without own entries, and no Copy Link without a link', () => {
        opened.available = false;
        render(<Frame query={loaded({ title: 'Lunch?' })} more={() => ({ own: [] })} />);
        fireEvent.click(screen.getByRole('button', { name: 'More for the poll' }));
        expect(menus.shown[0]).toEqual([]);
        expect(screen.queryByRole('button', { name: 'Open in New Window' })).toBeNull();
    });

    it('opens the item in a window of its own', () => {
        render(<Frame query={loaded({ title: 'Lunch?' })} />);
        fireEvent.click(screen.getByRole('button', { name: 'Open in New Window' }));
        expect(opened.open).toHaveBeenCalledWith({ kind: 'poll', id: '7' });
    });

    it('sends focus back to More', async () => {
        render(<Frame query={loaded({ title: 'Lunch?' })} more={() => ({})} />);
        focusMoreButton('poll');
        await waitFor(() => expect(document.activeElement?.getAttribute('aria-label')).toBe('More for the poll'));
    });
});

describe('Copy Link', () => {
    function Copier({ announce, fail }: { announce: (t: string) => void; fail?: (t: string) => void }) {
        const copy = useCopyLink(announce, fail);
        return (
            <button type="button" onClick={() => copy('https://a.example/p/7')}>
                Copy
            </button>
        );
    }

    it('copies and says so', async () => {
        const announce = vi.fn();
        render(<Copier announce={announce} />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        await waitFor(() => expect(announce).toHaveBeenCalledWith('Link copied'));
        expect(native.copy).toHaveBeenCalledWith('https://a.example/p/7');
    });

    it('says a failure where the caller shows its errors, or in the live region', async () => {
        native.copy.mockRejectedValueOnce(new Error('no clipboard'));
        const announce = vi.fn();
        const fail = vi.fn();
        render(<Copier announce={announce} fail={fail} />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        await waitFor(() => expect(fail).toHaveBeenCalledWith('Could not copy the link: no clipboard'));
        expect(announce).not.toHaveBeenCalled();
        cleanup();
        native.copy.mockRejectedValueOnce(new Error('no clipboard'));
        render(<Copier announce={announce} />);
        fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
        await waitFor(() => expect(announce).toHaveBeenCalledWith('Could not copy the link: no clipboard'));
    });
});
