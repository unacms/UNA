import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSetInformerStripHeight } from 'app/context/jotai/layout';
import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { useCurrentUser, useCurrentUserStore } from 'app/context/user'
import { appSetting, cn, stripTags } from 'app/lib/util';
import { NeoButtonLink } from 'app/design/controls'
import { Icon } from 'app/ui/atoms/icon'

// Shown in their own place: the confirm-email screen and the context switcher.
const HIDDEN_IDS = new Set(['sys-account-unconfirmed-email', 'sys-switch-profile-context']);
// "Your account doesn't have a profile yet": shown, with its Create profile action, unless the site requires a
// profile, when every page is profile creation already (`profile_required`, components/layouts.js).
const PROFILE_MESSAGE_ID = 'sys-account-profile-system';

/** One UNA informer message (BxDolInformer). */
export interface InformerItem {
    id?: string;
    msg?: string;
    /** BX_INFORMER_ALERT 1, BX_INFORMER_INFO 2, BX_INFORMER_ERROR 3. */
    type?: string | number;
    /** Lucide icon name. */
    icon?: string;
    /** The message's action: a page UNA names relative to the site (`account-profile-switcher`). */
    action_url?: string;
    action_title?: string;
}

// The tints of UNA's informers (.bx-informer-msg-* in tailwind.css): the row, the line under it and its text, the icon's circle.
const TONES = {
    alert: {
        box: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-500/10 dark:border-yellow-500/25',
        text: 'text-yellow-800 dark:text-yellow-200',
        dot: 'bg-yellow-100 dark:bg-yellow-500/20',
        icon: 'text-yellow-700 dark:text-yellow-300',
        glyph: 'TriangleAlert',
    },
    info: {
        box: 'bg-accent-50 border-accent-200 dark:bg-accent-500/10 dark:border-accent-500/25',
        text: 'text-accent-800 dark:text-accent-200',
        dot: 'bg-accent-100 dark:bg-accent-500/20',
        icon: 'text-accent-700 dark:text-accent-300',
        glyph: 'Info',
    },
    error: {
        box: 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/25',
        text: 'text-red-800 dark:text-red-200',
        dot: 'bg-red-100 dark:bg-red-500/20',
        icon: 'text-red-700 dark:text-red-300',
        glyph: 'CircleAlert',
    },
};

const toneOf = (type: InformerItem['type']) => {
    const code = Number(type);
    if (code === 1) return TONES.alert;
    if (code === 3) return TONES.error;
    return TONES.info;
};

/** The messages NEO shows of `list` (a viewer's `informer`) for `user`. */
export function visibleInformers(list: InformerItem[] | undefined, user: { profile_required?: boolean } | false | null | undefined): InformerItem[] {
    return (list || []).filter((item) => (
        item?.msg && !HIDDEN_IDS.has(item.id ?? '') && !(item.id === PROFILE_MESSAGE_ID && user && user.profile_required)
    ));
}

const actionHref = (url: string) => (/^(https?:)?\/\//i.test(url) || url.startsWith('/') ? url : `/${url}`);

/**
 * One message, a row of the strip as UNA's (informer.html): its tint from edge to edge with a line under it, its
 * content as wide as the page and 16px in, as the header's. The 36px icon, the first line of text and the 36px button
 * line up at the top; the button stays on the right while the text has room for 15rem beside it, and goes under the
 * text when it does not.
 */
function InformerMessage({ item, topInset = 0 }: { item: InformerItem; topInset?: number }) {
    const tone = toneOf(item.type);

    return (
        <View className={cn('w-full border-b', tone.box)} style={topInset > 0 ? { paddingTop: topInset } : undefined}>
            <View className={cn('w-full mx-auto px-4 py-3 flex-row items-start gap-3', appSetting('layout', 'max_width_block'))}>
                <View className={cn('w-9 h-9 shrink-0 rounded-full items-center justify-center', tone.dot)} aria-hidden>
                    <Icon icon={item.icon || tone.glyph} size={20} className={tone.icon} />
                </View>
                <View className="flex-1 min-w-0 flex-row flex-wrap items-start gap-x-4 gap-y-3">
                    <Text className={cn('flex-1 basis-60 min-w-0 py-2 text-sm leading-5 font-medium', tone.text)}>{stripTags(item.msg ?? '')}</Text>
                    {item.action_url && item.action_title ? (
                        <NeoButtonLink href={actionHref(item.action_url)} label={item.action_title} style="borderedProminent" controlSize="small" />
                    ) : null}
                </View>
            </View>
        </View>
    );
}

/** Whether `user` has informers to show in the strip. */
export const hasInformerStrip = (user: any): boolean => visibleInformers(user ? user.informer : undefined, user).length > 0;
/** Whether the strip shows: below desktop it is above the page header, which then leaves the top inset to it. */
export const useHasInformerStrip = (): boolean => hasInformerStrip(useCurrentUser().currentUser);
/** The same, read once (no re-render), for code outside a component's render. */
export const hasInformerStripNow = (): boolean => hasInformerStrip(useCurrentUserStore.getState().currentUser);

/**
 * The viewer's informers as one strip. On desktop web it is right under the header, before the page's cover, tabs and
 * blocks, as UNA's (first in `<main>`, layout.web.js). Below desktop, where the header carries the page's title, it is
 * above the header: the web's first thing on the page (the header's fixed layer moves down by what of it is still in
 * view, page-header.web.js), the apps' first thing on screen, over the header, taking the status bar's inset
 * (`topInset`, layout.js). Nothing when there are none.
 */
export function InformerStrip({ topInset = 0 }: { topInset?: number }) {
    const { currentUser } = useCurrentUser();
    const items = visibleInformers(currentUser ? currentUser.informer : undefined, currentUser);
    // Web: its height for what is fixed to the window under it (the header below desktop, Home's side columns:
    // useInformerStripVisibleHeight).
    const setHeight = useSetInformerStripHeight();
    const hasItems = items.length > 0;
    useEffect(() => {
        if (!hasItems) setHeight(0);
        return () => setHeight(0);
    }, [hasItems, setHeight]);

    if (!hasItems)
        return null;

    return (
        <View
            role="status"
            className="w-full"
            onLayout={Platform.OS === 'web' ? (e: any) => setHeight(Math.round(e.nativeEvent.layout.height)) : undefined}
        >
            {items.map((item, index) => <InformerMessage key={item.id || 'informer' + index} item={item} topInset={index === 0 ? topInset : 0} />)}
        </View>
    );
}

export default InformerStrip;

