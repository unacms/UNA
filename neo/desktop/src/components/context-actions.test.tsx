import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type ContextAction, ContextActionButtons, HeroActions, HeroActionsDockedContext } from './context-actions';

afterEach(cleanup);

const requests = (run = vi.fn()): ContextAction => ({ key: 'requests', label: 'Friend requests', icon: 'users', count: { text: '3', spoken: '3 waiting' }, run });
const follow = (over: { busy?: boolean; run?: () => void } = {}): ContextAction => ({ key: 'follow', label: 'Follow', name: 'Follow Lily Carter', icon: 'user-plus', primary: true, run: vi.fn(), ...over });

describe('ContextActionButtons', () => {
    it('says the same in every look: the name, the count', () => {
        for (const look of ['hero', 'toolbar', 'icons'] as const) {
            render(<ContextActionButtons actions={[follow(), requests()]} look={look} />);
            expect(screen.getByRole('button', { name: 'Follow Lily Carter' })).toBeTruthy();
            expect(screen.getByRole('button', { name: 'Friend requests, 3 waiting' })).toBeTruthy();
            cleanup();
        }
    });

    it('draws icons as toolbar buttons, the filled one filled, and a busy one ignores presses', () => {
        const run = vi.fn();
        render(<ContextActionButtons actions={[follow({ busy: true, run })]} look="icons" />);
        const button = screen.getByRole('button', { name: 'Follow Lily Carter' });
        expect(button.className).toBe('tb-btn tb-btn-action tb-btn-primary');
        expect(button.getAttribute('aria-busy')).toBe('true');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        fireEvent.click(button);
        expect(run).not.toHaveBeenCalled();
    });
});

describe('HeroActions', () => {
    it('goes inert while the toolbar shows its copy, and keeps its errors out of that', () => {
        const { container } = render(
            <HeroActionsDockedContext.Provider value>
                <HeroActions actions={[follow()]} errors={<p role="alert">Could not follow</p>} />
            </HeroActionsDockedContext.Provider>,
        );
        expect(container.querySelector('.hero-actions')!.hasAttribute('inert')).toBe(true);
        expect(container.querySelector('[inert] [role="alert"]')).toBeNull();
        expect(screen.getByRole('alert').textContent).toBe('Could not follow');
    });
});
