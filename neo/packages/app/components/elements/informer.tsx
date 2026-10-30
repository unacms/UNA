import { Text} from 'app/design/typography'
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user'
import { appSetting, cn, stripTags } from 'app/lib/util';
import { BlockWrapper } from 'app/components/block-wrapper'
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

// The tints of UNA's informers (.bx-informer-msg-* in tailwind.css): the plate, its edge and text, the icon's circle.
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

/**
 * The page with the viewer's informers (`data.user.informer`) as the first block of its top cell, for the profile
 * layout: the conductor joins cell_top and cell_center into its main column.
 */
export function withInformerBlock<T extends { user?: any; elements?: Record<string, any> } | null | undefined>(data: T): T {
    const informer = visibleInformers(data?.user?.informer, data?.user);
    if (!data || !informer.length) return data;
    const top = Array.isArray(data.elements?.cell_top) ? data.elements.cell_top : [];
    const block = { id: 'informer', designbox_id: 0, source: 'system:informer', content: [{ type: 'informer', data: informer }] };
    return { ...data, elements: { ...data.elements, cell_top: [block, ...top] } };
}

const actionHref = (url: string) => (/^(https?:)?\/\//i.test(url) || url.startsWith('/') ? url : `/${url}`);

interface ElementInformerProps {
    data?: InformerItem[];
    blockWrapperProps?: any;
}

/**
 * One message, like UNA's: a block's corners and padding (`theme.blocks`), the 36px icon, the first line of text and
 * the 36px button lined up at the top. The button stays on the right while the text has room for 15rem beside it,
 * and goes under the text when it does not.
 */
function InformerMessage({ item }: { item: InformerItem }) {
    const blocks = appSetting('theme', 'blocks') || {};
    const tone = toneOf(item.type);

    return (
        <View className={cn('w-full flex-row items-start gap-3 border', blocks['u-block-rounded'], blocks['u-block-pad'], tone.box)}>
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
    );
}

/** The viewer's informers, 16px apart, in a wrapper with `className`; nothing when there are none. */
export function InformerList({ className }: { className?: string }) {
    const { currentUser } = useCurrentUser();
    const items = visibleInformers(currentUser ? currentUser.informer : undefined, currentUser);
    if (!items.length)
        return null;

    return (
        <View className={cn('w-full gap-4', className)}>
            {items.map((item, index) => <InformerMessage key={item.id || 'informer' + index} item={item} />)}
        </View>
    );
}

// The viewer's informers at the top of the page's content (layout.web.js), in its default padding (`p-4`, as the
// blocks below) and the blocks' width, like UNA's above its blocks. Home puts them in its centre column itself
// (InformerList), profiles as a page block (`data` holds the informers, withInformerBlock), which renders inline.
export default function ElementInformer({ data, blockWrapperProps }: ElementInformerProps) {
    const { currentUser } = useCurrentUser();

    if (!Array.isArray(data))
        return <InformerList className={cn('mx-auto px-4 pt-4', appSetting('layout', 'max_width_block'))} />;

    const items = visibleInformers(data, currentUser);
    if (!items.length)
        return null

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                {items.map((item, index) => <InformerMessage key={item.id || 'informer' + index} item={item} />)}
            </View>
        </BlockWrapper>
    );
}
