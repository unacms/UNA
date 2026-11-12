import { describe, expect, it } from 'vitest';

import { sendBlocker, takenOf, tookAll, tookSome } from './upload-answers';

const uploads = (over: Partial<{ staging: boolean; blocker: string | null; ids: string[] }> = {}) => ({ staging: () => over.staging ?? false, blocker: over.blocker ?? null, ids: over.ids ?? [] });

describe('sendBlocker', () => {
    it('holds a form while files are being made ready, before anything the tray says', () => {
        expect(sendBlocker(uploads({ staging: true, blocker: 'Remove or retry the upload that failed', ids: ['m1'] }), 'Choose the photos to add.')).toBe('Wait until the uploads are done');
    });

    it('gives the tray’s reason before the one for having no upload', () => {
        expect(sendBlocker(uploads({ blocker: 'Remove or retry the upload that failed' }), 'Choose the photos to add.')).toBe('Remove or retry the upload that failed');
    });

    it('asks for an upload only where the form needs one', () => {
        expect(sendBlocker(uploads(), 'Choose the photos to add.')).toBe('Choose the photos to add.');
        expect(sendBlocker(uploads())).toBeNull();
        expect(sendBlocker(uploads({ ids: ['m1'] }), 'Choose the photos to add.')).toBeNull();
    });
});

describe('what an answer took of the uploads', () => {
    it('is all or none for an all-or-nothing answer', () => {
        expect(tookAll({ data: { id: 'a1' } })).toBe(true);
        expect(tookAll({ error: { status: 403 } })).toBe(false);
        expect(tookAll({})).toBe(false);
    });

    it('is none when refused, all when every one has an entry, else those the entries have', () => {
        expect(tookSome({ error: { status: 403 } }, 2)).toBe(false);
        expect(tookSome({}, 2)).toBe(false);
        expect(tookSome({ data: [{ media: { id: 'm1' } }, { media: { id: 'm2' } }] }, 2)).toBe(true);
        expect(tookSome({ data: [{ media: { id: 'm1' } }, { media: null }] }, 3)).toEqual(['m1']);
        expect(tookSome({ data: [] }, 1)).toEqual([]);
    });

    it('names the ids taken of those the request named', () => {
        expect(takenOf(true, ['m1', 'm2'])).toEqual(['m1', 'm2']);
        expect(takenOf(false, ['m1', 'm2'])).toEqual([]);
        expect(takenOf(['m2'], ['m1', 'm2'])).toEqual(['m2']);
    });
});
