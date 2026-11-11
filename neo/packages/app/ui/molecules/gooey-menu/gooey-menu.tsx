import GooeyMenuDropdown from './gooey-menu-dropdown';
import type { GooeyMenuProps } from './gooey-menu.types';

/** iOS and Android: the liquid effect is web only (SVG filters), so the actions are a regular dropdown. */
export default function GooeyMenu({ onOpenChange: _fanned, ...props }: Readonly<GooeyMenuProps>) {
    // A dropdown fans over nothing: `onOpenChange` (the droplets) has no meaning here.
    return <GooeyMenuDropdown {...props} />;
}
