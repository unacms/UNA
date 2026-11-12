import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AnimatedIcon, animationLoader } from './animated-icon';

afterEach(cleanup);

describe('animated icons', () => {
    it('finds the animation of the icons the sidebar uses', async () => {
        for (const name of ['house', 'bell', 'message-circle', 'users-round', 'circle-user-round', 'compass', 'list-checks', 'calendar']) {
            const load = animationLoader(name);
            expect(load, name).not.toBeNull();
            expect((await load!()).name).toBe(name);
        }
        expect(animationLoader('index')).toBeNull();
        expect(animationLoader('no-such-icon')).toBeNull();
        expect(animationLoader('../x')).toBeNull();
    });

    it('draws the still icon until the animation has loaded, then the animated one in its place', async () => {
        const { container } = render(<AnimatedIcon name="bell" fallback="bell" />);
        expect(container.querySelector('[data-xa]')).toBeNull();
        expect(container.querySelector('svg')).not.toBeNull();
        await act(() => animationLoader('bell')!());
        await act(async () => {});
        const svg = container.querySelector('svg[data-xa]');
        expect(svg, 'the animated drawing').not.toBeNull();
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
        expect(svg?.hasAttribute('data-active')).toBe(false);
    });

    it('takes its fill while its row is the current one', async () => {
        const { container, rerender } = render(<AnimatedIcon name="house" fallback="house" active />);
        await act(() => animationLoader('house')!());
        await act(async () => {});
        expect(container.querySelector('svg[data-xa]')?.hasAttribute('data-active')).toBe(true);
        rerender(<AnimatedIcon name="house" fallback="house" active={false} />);
        expect(container.querySelector('svg[data-xa]')?.hasAttribute('data-active')).toBe(false);
    });

    it('stays still for a name with no animation', async () => {
        const { container } = render(<AnimatedIcon name="not-an-icon" fallback="file-text" />);
        await act(async () => {});
        expect(container.querySelector('[data-xa]')).toBeNull();
        expect(container.querySelector('svg')).not.toBeNull();
    });
});
