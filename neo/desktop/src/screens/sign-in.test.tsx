import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const discoverSite = vi.hoisted(() => vi.fn());

vi.mock('../lib/native', async (importOriginal) => ({ ...(await importOriginal<typeof import('../lib/native')>()), discoverSite }));

import { SignIn } from './sign-in';

afterEach(() => {
    cleanup();
    discoverSite.mockReset();
    localStorage.clear();
});

const info = {
    name: 'UNA',
    url: 'https://makers.example/',
    api_version: '2.0.0-draft',
    openapi_url: 'https://makers.example/api/v2/openapi.json',
    oauth: null,
    branding: {
        name: 'UNA Makers',
        short_name: 'Makers',
        description: null,
        mark: 'https://makers.example/s/mark.png',
        mark_dark: null,
        logo: null,
        logo_dark: null,
        logo_aspect: null,
        icon: null,
        accent: '#0F766E',
    },
};

describe('sign-in', () => {
    it('takes an address without a scheme and previews the network with its mark', async () => {
        discoverSite.mockResolvedValue(info);
        const { container } = render(<SignIn onSignedIn={() => undefined} />);
        const field = screen.getByLabelText('Network address');
        expect(field.getAttribute('type')).toBe('text');
        fireEvent.change(field, { target: { value: 'makers.example' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

        expect(await screen.findByText('UNA Makers')).toBeTruthy();
        expect(discoverSite).toHaveBeenCalledWith('https://makers.example');
        expect(screen.getByText('makers.example')).toBeTruthy();
        expect(container.querySelector('.sign-in-preview img.site-mark')?.getAttribute('src')).toBe(info.branding.mark);
        // Continue is gone: focus is on the next step's action, and the status says what was found
        expect(document.activeElement?.textContent).toMatch(/Use another network|Sign in with the browser/);
        expect(screen.getByRole('status').textContent).toBe('Found UNA Makers.');
    });

    it('the field is described by the hint before anything fails', () => {
        render(<SignIn onSignedIn={() => undefined} />);
        const field = screen.getByLabelText('Network address');
        expect(field.getAttribute('aria-describedby')).toBe('sign-in-hint');
        expect(document.getElementById('sign-in-hint')?.textContent).toBe('Enter the address of a UNA network you have an account on.');
        expect(field.getAttribute('aria-invalid')).toBeNull();
    });

    it('lists the networks still signed in to as rows with their mark, name, host and account', () => {
        localStorage.setItem('una.siteInfo:https://makers.example', JSON.stringify({ name: 'UNA', branding: info.branding }));
        const onSwitch = vi.fn();
        const { container } = render(
            <SignIn onSignedIn={() => undefined} others={[{ key: 'k1', siteUrl: 'https://makers.example', siteName: 'UNA Makers', accountName: 'Andrey', active: false }]} onSwitch={onSwitch} />,
        );
        const row = screen.getByRole('button', { name: /UNA Makers/ });
        expect(row.textContent).toBe('UNA Makersmakers.example – Andrey');
        expect(container.querySelector('.sign-in-other img.site-mark')?.getAttribute('src')).toBe(info.branding.mark);
        fireEvent.click(row);
        expect(onSwitch).toHaveBeenCalledWith('k1');
    });

    it('a failure is an alert the field points at', async () => {
        discoverSite.mockRejectedValue('nothing there');
        render(<SignIn onSignedIn={() => undefined} />);
        const field = screen.getByLabelText('Network address');
        fireEvent.change(field, { target: { value: 'nowhere.example' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toBe('nothing there');
        expect(field.getAttribute('aria-invalid')).toBe('true');
        expect(field.getAttribute('aria-describedby')).toBe(`sign-in-hint ${alert.id}`);
        // under the field, before Continue
        expect(field.nextElementSibling).toBe(alert);
        // correcting the address takes the error off the field
        fireEvent.change(field, { target: { value: 'nowhere.exampl' } });
        expect(screen.queryByRole('alert')).toBeNull();
        expect(field.getAttribute('aria-invalid')).toBeNull();
        expect(field.getAttribute('aria-describedby')).toBe('sign-in-hint');
    });
});
