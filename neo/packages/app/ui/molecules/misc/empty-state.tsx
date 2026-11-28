import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButtonLink } from 'app/design/controls';
import { Icon } from 'app/ui/atoms/icon';
import { isWeb, hasDropdownActions, flattenMenuItemsForDropdown } from 'app/lib/util';
import emitter, { EVENTS } from 'app/context/emitter';
import { useMenuAddItems } from 'app/components/nav/menu-add';
import GooeyMenu from 'app/ui/molecules/gooey-menu/gooey-menu';
import type { GooeyMenuItem } from 'app/ui/molecules/gooey-menu/gooey-menu.types';
import FormModal, { handleFormModal } from 'app/ui/molecules/dialogs/form-modal';
import { useReduceMotionSetting } from 'app/lib/hooks/use-reduce-motion';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';

/** What UNA sends beside an empty list (BxDolEmptyState): words in the viewer's language, links of the site. */
export type EmptyStateData = {
    /** UNA's icon name (Lucide, as UNA names it: `bell`, `user-plus`). */
    icon?: string;
    title?: string;
    text?: string;
    buttons?: EmptyStateButtonData[];
    /** Set by a page block's Studio override: it wins over a later list response's default. */
    custom?: boolean;
};

type EmptyStateButtonData = { title: string; link: string; style?: 'primary' | 'secondary'; action?: 'compose' | 'create_menu' };

/**
 * A button's action, done in place when the page can: `compose` opens the page's post composer
 * (MultiPostForm listens) instead of following the link. Without a composer the link is followed.
 */
function pressAction(action: string | undefined, event?: { preventDefault?: () => void }) {
    if (action !== 'compose' || emitter.listeners(EVENTS.composer).length === 0) return;
    event?.preventDefault?.();
    emitter.emit(EVENTS.composer, { action: 'open' });
}

type EmptyStateProps = {
    /**
     * @deprecated The list's skeletons are no longer shown under the words: a skeleton list read as still loading.
     * Kept so callers that pass one keep working.
     */
    preview?: ReactNode;
    /** The skeletons were on screen while it loaded: the words fade in as they go. */
    fromSkeletons?: boolean;
    /** UNA's icon, title, text and buttons for this list. */
    state?: EmptyStateData | null;
    /** The title when UNA sends none. */
    fallbackTitle: string;
    /** @deprecated See `preview`. */
    previewScale?: number;
    /** False inside a block beside others (a denied action's message): only as tall as its words. */
    fill?: boolean;
    /**
     * `rows`: in a list of rows (search results), the words as one row of that list, the icon where a row's picture
     * is, over two faint placeholder rows, still (not loading), so the list keeps its shape and nearly its size. As the
     * site's `emptyState(..., 'rows')` (empty_state_rows.html).
     */
    layout?: 'centred' | 'rows';
};

function EmptyStateRows({ state, fallbackTitle }: Readonly<{ state?: EmptyStateData | null; fallbackTitle: string }>) {
    const ghost = (opacity: string, title: string, meta: string) => (
        <Row className={'items-center gap-3 p-2 ' + opacity} aria-hidden>
            <View className="size-10 shrink-0 rounded-xl bg-button" />
            <View className="flex-1 gap-2">
                <View className={'h-2.5 rounded-full bg-button ' + title} />
                <View className={'h-2 rounded-full bg-button ' + meta} />
            </View>
        </Row>
    );
    return (
        <View className="w-full">
            <Row className="items-center gap-3 p-2">
                <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-button" aria-hidden>
                    {state?.icon ? <Icon icon={state.icon} size={20} className="text-muted-foreground" /> : null}
                </View>
                <View className="min-w-0 flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{state?.title || fallbackTitle}</Text>
                    {state?.text ? <Text className="text-xs text-muted-foreground">{state.text}</Text> : null}
                </View>
            </Row>
            {ghost('opacity-60', 'w-2/5', 'w-1/4')}
            {ghost('opacity-40', 'w-1/3', 'w-1/5')}
        </View>
    );
}

const DURATION_MS = 320;

/**
 * The empty state of a list, centred in the space the list would fill, as UNA's site draws one (BxDolEmptyState,
 * messageBox.html): UNA's icon in a neutral circle, the title, a line of text and the buttons (a block's Studio app
 * config can set them). When skeletons were showing while the list loaded, the words fade in as they go; with
 * reduce motion they appear at once.
 */
export default function EmptyState({ fromSkeletons = false, state, fallbackTitle, fill = true, layout = 'centred' }: Readonly<EmptyStateProps>) {
    // Null until the setting is known: the fade waits for it rather than play for someone who turned motion off.
    const reduceMotion = useReduceMotionSetting();
    const wordsOpacity = useAnimatedValue(fromSkeletons ? 0 : 1);

    useEffect(() => {
        if (!fromSkeletons || reduceMotion === null) return;
        if (reduceMotion) {
            wordsOpacity.setValue(1);
            return;
        }
        Animated.timing(wordsOpacity, { toValue: 1, duration: DURATION_MS, easing: Easing.out(Easing.quad), useNativeDriver: !isWeb }).start();
    }, [fromSkeletons, reduceMotion, wordsOpacity]);

    // The create menu's droplets are out (web): the words fade under them.
    const [menuOpen, setMenuOpen] = useState(false);
    const title = state?.title || fallbackTitle;
    const buttons = state?.buttons ?? [];

    if (layout === 'rows') return <EmptyStateRows state={state} fallbackTitle={fallbackTitle} />;

    // On web at least the list's share of a tall window (60svh), so the words sit mid-page, not in its top third.
    return (
        <View className={'w-full items-center justify-center py-8' + (fill ? ' flex-1 min-h-120 web:min-h-[60svh]' : '')} role="status">
            <Animated.View style={{ opacity: wordsOpacity }} className="items-center gap-2 px-6">
                {/* Web: the create menu's droplets fan up over the words, which make way meanwhile. */}
                <View
                    className={'items-center gap-2 web:transition-opacity web:duration-200 ' + (menuOpen ? 'opacity-0' : 'opacity-100')}
                    aria-hidden={menuOpen || undefined}
                >
                    {state?.icon ? (
                        <View className="w-12 h-12 mb-1 rounded-full items-center justify-center bg-button" aria-hidden>
                            <Icon icon={state.icon} size={24} className="text-secondary-foreground" />
                        </View>
                    ) : null}
                    <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
                    {state?.text ? (
                        <Text className="text-center text-sm text-secondary-foreground max-w-105">{state.text}</Text>
                    ) : null}
                </View>
                {buttons.length ? (
                    <Row className="flex-wrap justify-center gap-2 pt-2">
                        {buttons.map((button, index) => (
                            <EmptyStateButton key={button.link + index} button={button} onMenuOpenChange={setMenuOpen} />
                        ))}
                    </Row>
                ) : null}
            </Animated.View>
        </View>
    );
}

/**
 * One of UNA's buttons. `create_menu` is a "+" opening the add-content menu (the header's "+":
 * every type the viewer can create); without that menu it is the link.
 */
function EmptyStateButton({ button, onMenuOpenChange }: Readonly<{ button: EmptyStateButtonData; onMenuOpenChange: (open: boolean) => void }>) {
    const style = button.style === 'secondary' ? 'bordered' : 'borderedProminent';
    if (button.action === 'create_menu') return <CreateMenuButton button={button} onMenuOpenChange={onMenuOpenChange} />;
    return (
        <NeoButtonLink
            href={button.link}
            label={button.title}
            style={style}
            controlSize="regular"
            {...(button.action ? { onPress: (event?: any) => pressAction(button.action, event) } : null)}
        />
    );
}

function CreateMenuButton({ button, onMenuOpenChange }: Readonly<{ button: EmptyStateButtonData; onMenuOpenChange: (open: boolean) => void }>) {
    // The menu only once it has something to create: while it loads, when the menu is off or empty,
    // and when it could not be loaded, the button is its link (the same primary "+" capsule).
    const { items, empty } = useMenuAddItems();
    const [pageData, setPageData] = useState<any>(false);
    if (empty || !hasDropdownActions(items)) {
        return (
            <NeoButtonLink
                href={button.link}
                style="glass"
                controlSize="regular"
                borderShape="circle"
                image="Plus"
                accessibilityLabel={button.title}
                tooltip={button.title}
            />
        );
    }
    // The header "+" menu's items, as droplets of a gooey "+" (a dropdown on iOS and Android).
    const actions: GooeyMenuItem[] = flattenMenuItemsForDropdown(items)
        .filter((item: any) => item && item.type !== 'group_header' && item.type !== 'separator' && item.link)
        .map((item: any, index: number) => ({ id: String(item.id ?? item.name ?? index), title: item.title, icon: item.icon, link: item.link }));
    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} url={pageData?.url} modalView={undefined} historyUrl={undefined} />
            <GooeyMenu
                items={actions}
                label={button.title}
                onOpenChange={onMenuOpenChange}
                onSelect={(item, event) => {
                    setPageData('loading');
                    void handleFormModal(item, event, setPageData, undefined);
                }}
            />
        </>
    );
}
