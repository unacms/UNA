import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { COMMANDS } from '../lib/shortcuts';
import { Icon, isIconName } from './icon';

describe('Icon', () => {
    it('knows every icon the commands name', () => {
        const unknown = COMMANDS.filter((c) => c.icon && !isIconName(c.icon)).map((c) => `${c.id}: ${c.icon}`);
        expect(unknown).toEqual([]);
        expect(isIconName('not-an-icon')).toBe(false);
        expect(isIconName('toString')).toBe(false);
    });

    it('is hidden from screen readers unless it is labelled', () => {
        const { container } = render(
            <>
                <Icon name="bell" />
                <Icon name="cloud-off" label="Offline" />
            </>,
        );
        const [plain, labelled] = Array.from(container.querySelectorAll<HTMLElement>('.icon'));
        expect(plain?.getAttribute('aria-hidden')).toBe('true');
        expect(labelled?.getAttribute('role')).toBe('img');
        expect(labelled?.getAttribute('aria-label')).toBe('Offline');
        // the SVG keeps no fixed size or stroke: CSS sets both
        const svg = plain?.querySelector('svg');
        expect(svg?.getAttribute('width')).toBeNull();
        expect(svg?.getAttribute('stroke-width')).toBeNull();
        expect(svg?.getAttribute('focusable')).toBe('false');
    });

    it('mirrors the icons that point along the reading direction', () => {
        const { container } = render(
            <>
                <Icon name="chevron-left" />
                <Icon name="repeat-2" />
                <Icon name="bell" />
            </>,
        );
        const icons = Array.from(container.querySelectorAll('.icon'));
        expect(icons.map((i) => i.classList.contains('icon-flip'))).toEqual([true, true, false]);
    });
});
