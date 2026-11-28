import { View, Row } from 'app/design/view';
import Menu from 'app/components/menu';
import { BlockWrapper } from 'app/components/block-wrapper'
import { appSetting } from 'app/lib/util'
import { isDrawnCounter, type CounterMenuItem } from 'app/lib/counter-items'
import { countersModeParams, isCountStat, isStatShown, menuCountersMode } from 'app/lib/counters-mode'

type ActionItem = CounterMenuItem & { name?: string };

type ActionsMenu = {
    counters?: unknown;
    items?: ActionItem[];
    [key: string]: unknown;
};

type Props = {
    data: ActionsMenu;
    blockWrapperProps?: Record<string, unknown>;
};

/** Actions a content page leaves to other places (its owner's menu). */
const HIDDEN_PREFIXES = ['edit-', 'add-images-to-album', 'delete-', 'move-image'];

/**
 * A content page's actions and, at the end of their line, its stats: the same menu's counts, as UNA's site
 * shows them (`menu_actions_stats.html`). What the stats keep follows the menu's Counters (`isStatShown`):
 * every count beside labels, the reactions summary beside counts, nothing beside button groups.
 */
export default function ElementEntityActions({ data, blockWrapperProps }: Props) {
    const mode = menuCountersMode(data) || 'group'

    const items = (data.items || []).filter(
        (item) => !HIDDEN_PREFIXES.some((prefix) => item.name?.startsWith(prefix))
    )
    const menuData = { ...data, items }

    // A counter at zero stays mounted: its widget follows the object's state and shows the first reaction as it
    // comes, as a feed item's stats do (`CounterMenu`).
    const stats = mode === 'group' ? [] : items.filter(
        (item) => item.display_type === 'element' && isCountStat(item) && isDrawnCounter(item) && isStatShown(item, mode)
    )
    const counters = (appSetting('feed', 'counters_menu') || {}) as Record<string, unknown>

    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className="w-full flex-wrap-reverse items-center justify-between gap-x-2 gap-y-1">
                <View className="min-w-0">
                    <Menu
                        {...menuData}
                        alignItems="start"
                        autoSize={true}
                        autoFilter={false}
                        // The look of the buttons is UNA's (Studio > Navigation > the actions menu > "Button style" /
                        // "Button size"). The defaults are for a menu UNA leaves on Automatic.
                        params={{
                            className: 'gap-x-2',
                            button_variant_default: 'default',
                            button_size_default: 'small',
                            button_rounded: false,
                            button_full_width: false,
                            // UNA's Counters for the menu (Studio > Navigation): button groups unless it says otherwise.
                            ...countersModeParams(mode),
                        }}
                    />
                </View>
                {stats.length > 0 && (
                    <Menu
                        {...data}
                        items={stats}
                        displayType="button"
                        params={{ ...counters, show_action: false, show_counter: true, show_combined: true, show_action_count: false }}
                    />
                )}
            </Row>
        </BlockWrapper>
    );
}
