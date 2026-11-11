/** One action of a GooeyMenu: a round icon button once the menu opens. */
export type GooeyMenuItem = {
    id: string;
    /** The action's name: its accessible name and its tooltip. */
    title: string;
    /** Lucide icon name. */
    icon?: string;
    link?: string;
};

export type GooeyMenuProps = {
    items: GooeyMenuItem[];
    /** The trigger's accessible name and tooltip ("Create", "Create new update"). */
    label: string;
    onSelect: (item: GooeyMenuItem, event?: unknown) => void;
    /** Lucide icon of the trigger. Default "Plus" (turned into a cross while open on web). */
    icon?: string;
    /** A secondary action: the neutral button surface instead of the primary colour. */
    secondary?: boolean;
};
