import { describe, expect, it } from 'vitest';

import { ApiError } from './api';
import { errorMessage } from './errors';

describe('errorMessage', () => {
    it('gives an Error’s message, whatever kind of Error it is', () => {
        expect(errorMessage(new Error('The site answered 500'))).toBe('The site answered 500');
        expect(errorMessage(new TypeError('Load failed'))).toBe('Load failed');
        expect(errorMessage(new ApiError('A title needs at least 3 characters', 422, 'invalid'))).toBe('A title needs at least 3 characters');
        expect(errorMessage(new DOMException('The operation was aborted', 'AbortError'))).toBe('The operation was aborted');
    });

    it('keeps an Error’s message as it is, an empty one too', () => {
        expect(errorMessage(new Error(''))).toBe('');
        expect(errorMessage(new Error(''), 'No answer')).toBe('');
    });

    it('gives a string as it is: a Rust command rejects with its message', () => {
        expect(errorMessage('UNA couldn’t read your sign-in from the keychain: locked')).toBe('UNA couldn’t read your sign-in from the keychain: locked');
        expect(errorMessage('', 'No answer')).toBe('');
    });

    it('reads an error made elsewhere by its message', () => {
        expect(errorMessage({ message: 'window not found' })).toBe('window not found');
        expect(errorMessage(Object.create({ message: 'inherited' }))).toBe('inherited');
    });

    it('says the fallback for anything without words', () => {
        for (const e of [undefined, null, 0, 42, false, Symbol('x'), {}, [], { message: 404 }, { error: 'no' }, () => 'no']) {
            expect(errorMessage(e)).toBe('Something went wrong');
            expect(errorMessage(e, 'Not uploaded')).toBe('Not uploaded');
        }
    });
});
