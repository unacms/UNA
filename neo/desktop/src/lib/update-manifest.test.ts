import { describe, expect, it } from 'vitest';

// @ts-expect-error a plain ES module of scripts/ (no types)
import { keysFor, manifest } from '../../scripts/update-manifest.mjs';

const base = 'https://github.com/unacms/UNA/releases/download/desktop-v0.2.0';

describe('the update feed (scripts/update-manifest.mjs)', () => {
    it('knows which systems each package is for', () => {
        expect(keysFor('UNA_0.2.0_universal.app.tar.gz')).toEqual({ installer: 'app', keys: ['darwin-aarch64', 'darwin-x86_64'] });
        expect(keysFor('UNA_0.2.0_aarch64.app.tar.gz')).toEqual({ installer: 'app', keys: ['darwin-aarch64'] });
        expect(keysFor('UNA_0.2.0_x64-setup.exe')).toEqual({ installer: 'nsis', keys: ['windows-x86_64'] });
        expect(keysFor('UNA_0.2.0_x64_en-US.msi')).toEqual({ installer: 'msi', keys: ['windows-x86_64'] });
        expect(keysFor('UNA_0.2.0_amd64.AppImage')).toEqual({ installer: 'appimage', keys: ['linux-x86_64'] });
        expect(keysFor('UNA_0.2.0_amd64.deb')).toEqual({ installer: 'deb', keys: ['linux-x86_64'] });
        expect(keysFor('UNA_0.2.0_universal.dmg').keys).toEqual([]);
    });

    it('lists each package under its installer, and the usual one for its system', () => {
        const m = manifest({
            version: '0.2.0',
            notes: '\n- Faster feed\n',
            date: '2026-11-20T10:00:00Z',
            baseUrl: base,
            packages: [
                { name: 'UNA_0.2.0_x64_en-US.msi', signature: 'msi-sig\n' },
                { name: 'UNA_0.2.0_x64-setup.exe', signature: 'nsis-sig' },
                { name: 'UNA_0.2.0_universal.app.tar.gz', signature: 'mac-sig' },
                { name: 'UNA_0.2.0_amd64.deb', signature: 'deb-sig' },
                { name: 'UNA_0.2.0_amd64.AppImage', signature: 'appimage-sig' },
            ],
        });
        expect(m.version).toBe('0.2.0');
        expect(m.notes).toBe('- Faster feed');
        expect(m.pub_date).toBe('2026-11-20T10:00:00Z');
        expect(Object.keys(m.platforms)).toEqual([
            'darwin-aarch64',
            'darwin-aarch64-app',
            'darwin-x86_64',
            'darwin-x86_64-app',
            'linux-x86_64',
            'linux-x86_64-appimage',
            'linux-x86_64-deb',
            'windows-x86_64',
            'windows-x86_64-msi',
            'windows-x86_64-nsis',
        ]);
        expect(m.platforms['windows-x86_64'].signature, 'the setup program, not the msi').toBe('nsis-sig');
        expect(m.platforms['windows-x86_64-msi'].signature).toBe('msi-sig');
        expect(m.platforms['linux-x86_64'].signature, 'the AppImage, not the deb').toBe('appimage-sig');
        expect(m.platforms['darwin-x86_64'].url).toBe(`${base}/UNA_0.2.0_universal.app.tar.gz`);
    });

    it('refuses a feed that cannot work', () => {
        const pkg = { name: 'UNA_0.2.0_amd64.AppImage', signature: 'sig' };
        expect(() => manifest({ version: 'v0.2', baseUrl: base, packages: [pkg] })).toThrow('not a version');
        expect(() => manifest({ version: '0.2.0', baseUrl: 'http://example.com', packages: [pkg] })).toThrow('https');
        expect(() => manifest({ version: '0.2.0', baseUrl: base, packages: [{ ...pkg, signature: ' ' }] })).toThrow('no signature');
        expect(() => manifest({ version: '0.2.0', baseUrl: base, packages: [{ name: 'UNA.dmg', signature: 's' }] })).toThrow('not a package');
        expect(() => manifest({ version: '0.2.0', baseUrl: base, packages: [] })).toThrow('no packages');
    });

    it('puts file names in the address as the release serves them', () => {
        const m = manifest({ version: '0.2.0', baseUrl: `${base}/`, packages: [{ name: 'My App_0.2.0_amd64.AppImage', signature: 's' }] });
        expect(m.platforms['linux-x86_64'].url).toBe(`${base}/My%20App_0.2.0_amd64.AppImage`);
    });
});
