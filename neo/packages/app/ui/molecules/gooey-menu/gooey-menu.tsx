import GooeyMenuDropdown from './gooey-menu-dropdown';
import type { GooeyMenuProps } from './gooey-menu.types';

/** iOS and Android: the liquid effect is web only (SVG filters), so the actions are a regular dropdown. */
export default function GooeyMenu(props: Readonly<GooeyMenuProps>) {
    return <GooeyMenuDropdown {...props} />;
}
