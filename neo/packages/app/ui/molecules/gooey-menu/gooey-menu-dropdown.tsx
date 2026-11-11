import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import type { GooeyMenuProps } from './gooey-menu.types';

type GooeyMenuDropdownProps = GooeyMenuProps & {
    /** Open as it mounts (web: the gooey menu's "More" hands over to this list). */
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
};

/**
 * Every action as a regular dropdown under the primary "+" capsule: the whole GooeyMenu on iOS
 * and Android (the liquid effect is web only), and on web the list behind the droplets' "More".
 */
export default function GooeyMenuDropdown({ items, label, onSelect, icon = 'Plus', defaultOpen, onOpenChange }: Readonly<GooeyMenuDropdownProps>) {
    return (
        <DropdownMenu
            items={items.map((item) => ({ id: item.id, title: item.title, icon: item.icon, link: item.link }))}
            onSelect={(item: any, event: unknown) => {
                const picked = items.find((candidate) => candidate.id === item?.id) ?? item;
                onSelect(picked, event);
            }}
            defaultOpen={defaultOpen}
            onOpenChange={onOpenChange}
            buttonProps={{
                style: 'borderedProminent',
                controlSize: 'regular',
                borderShape: 'capsule',
                image: icon,
                accessibilityLabel: label,
                tooltip: label,
            }}
        />
    );
}
