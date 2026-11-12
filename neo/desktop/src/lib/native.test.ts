import { describe, expect, it } from 'vitest';

import { sessionLabel, signedInText } from './native';

describe('what is said of a network', () => {
    it('names the network signed in to once the browser sign-in has finished, by its name or its address', () => {
        expect(signedInText({ siteUrl: 'http://network2.localhost:8092', siteName: 'Riverside Network', accountName: 'Andrey' })).toBe(`Signed in to ${sessionLabel({ siteUrl: 'http://network2.localhost:8092', siteName: 'Riverside Network', accountName: 'Andrey' })}`);
        expect(signedInText({ siteUrl: 'http://network2.localhost:8092' })).toMatch(/^Signed in to network2\.localhost:8092/);
    });
});
