import { afterEach, describe, expect, it, vi } from 'vitest';

import { readStored, readStoredJson, removeStored, writeStored, writeStoredJson } from './storage';

afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
});

/** A storage that refuses everything, as a private window's or a full one does. */
function blockStorage() {
    const refuse = () => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
    };
    return {
        getItem: vi.spyOn(Storage.prototype, 'getItem').mockImplementation(refuse),
        setItem: vi.spyOn(Storage.prototype, 'setItem').mockImplementation(refuse),
        removeItem: vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(refuse),
    };
}

describe('readStored, writeStored and removeStored', () => {
    it('keep a string, read it back and take it out', () => {
        expect(readStored('k')).toBeNull();
        writeStored('k', 'rail');
        expect(localStorage.getItem('k')).toBe('rail');
        expect(readStored('k')).toBe('rail');
        removeStored('k');
        expect(localStorage.getItem('k')).toBeNull();
        expect(readStored('k')).toBeNull();
    });

    it('keep an empty string as a value of its own', () => {
        writeStored('k', '');
        expect(readStored('k')).toBe('');
    });

    it('take the key out when null is written', () => {
        writeStored('k', '1');
        writeStored('other', '1');
        writeStored('k', null);
        expect(localStorage.getItem('k')).toBeNull();
        expect(localStorage.getItem('other')).toBe('1');
        // taking out what is not there is nothing
        removeStored('k');
        expect(localStorage.length).toBe(1);
    });

    it('never throw when the storage refuses: a read finds nothing, a write keeps nothing', () => {
        localStorage.setItem('k', 'kept');
        const storage = blockStorage();
        expect(readStored('k')).toBeNull();
        expect(() => writeStored('k', 'new')).not.toThrow();
        expect(() => writeStored('k', null)).not.toThrow();
        expect(() => removeStored('k')).not.toThrow();
        expect(storage.getItem).toHaveBeenCalledTimes(1);
        expect(storage.setItem).toHaveBeenCalledTimes(1);
        expect(storage.removeItem).toHaveBeenCalledTimes(2);
        vi.restoreAllMocks();
        expect(localStorage.getItem('k')).toBe('kept');
    });

    it('never throw where there is no storage at all', () => {
        vi.stubGlobal('localStorage', undefined);
        expect(readStored('k')).toBeNull();
        expect(() => writeStored('k', '1')).not.toThrow();
        expect(() => removeStored('k')).not.toThrow();
        expect(readStoredJson('k')).toBeUndefined();
        expect(() => writeStoredJson('k', { a: 1 })).not.toThrow();
    });
});

describe('readStoredJson and writeStoredJson', () => {
    it('keep a value as JSON and read it back', () => {
        writeStoredJson('k', { sidebar: 240, list: [1, 2] });
        expect(localStorage.getItem('k')).toBe('{"sidebar":240,"list":[1,2]}');
        expect(readStoredJson('k')).toEqual({ sidebar: 240, list: [1, 2] });
        writeStoredJson('k', ['a', 'b']);
        expect(readStoredJson('k')).toEqual(['a', 'b']);
    });

    it('tell nothing kept (undefined) from a kept null, false or 0', () => {
        expect(readStoredJson('k')).toBeUndefined();
        writeStoredJson('k', null);
        expect(readStoredJson('k')).toBeNull();
        writeStoredJson('k', false);
        expect(readStoredJson('k')).toBe(false);
        writeStoredJson('k', 0);
        expect(readStoredJson('k')).toBe(0);
    });

    it('read what is not JSON as nothing kept', () => {
        localStorage.setItem('k', '{"sidebar":');
        expect(readStoredJson('k')).toBeUndefined();
        localStorage.setItem('k', '');
        expect(readStoredJson('k')).toBeUndefined();
        localStorage.setItem('k', 'rail');
        expect(readStoredJson('k')).toBeUndefined();
    });

    it('never throw when the storage refuses or the value can’t be written as JSON', () => {
        const loop: { self?: unknown } = {};
        loop.self = loop;
        expect(() => writeStoredJson('k', loop)).not.toThrow();
        expect(localStorage.getItem('k')).toBeNull();
        localStorage.setItem('k', '{"a":1}');
        blockStorage();
        expect(readStoredJson('k')).toBeUndefined();
        expect(() => writeStoredJson('k', { a: 2 })).not.toThrow();
        vi.restoreAllMocks();
        expect(localStorage.getItem('k')).toBe('{"a":1}');
    });
});
