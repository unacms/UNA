import { useState } from 'react';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { BlockWrapper } from 'app/components/block-wrapper';
import { Icon } from 'app/ui/atoms/icon';
import Link from 'app/ui/atoms/link';
import { fetcher } from 'app/lib/fetcher';
import { decodeTextNode } from 'app/lib/util';

/** A step of a UNA onboarding checklist: an item of its menu (BxBaseMenuOnboarding) with the step's `state`. */
export interface OnboardingItem {
    id?: string | number;
    name?: string;
    title?: string;
    /** The item's Info: the step's description. */
    info?: string;
    /** Lucide name: CircleUserRound, Target, GalleryVertical, SquarePen, UserRoundPlus. */
    icon?: string;
    /** A page of the site (`account-profile-switcher`) or a full link (Studio). */
    link?: string;
    /** done, todo, locked (waits for an earlier step), note (tells, isn't a task). */
    state?: string;
    /** The state's name for screen readers ("Done"), empty for a note. */
    state_title?: string;
}

export interface OnboardingData {
    menu?: { object?: string; items?: OnboardingItem[] };
    hide?: { title?: string; request_url?: string };
}

const MARKS: Record<string, { icon: string; className: string }> = {
    done: { icon: 'CircleCheck', className: 'text-green-700 dark:text-green-400' },
    locked: { icon: 'Lock', className: 'text-muted-foreground' },
    todo: { icon: 'ChevronRight', className: 'text-muted-foreground' },
    note: { icon: 'ChevronRight', className: 'text-muted-foreground' },
};

/** An app path for a page of the site, a full link as it is; none for a step that waits. */
function stepHref(item: OnboardingItem): string {
    const link = String(item.link || '');
    if (!link || item.state === 'locked' || link.startsWith('javascript:')) return '';
    if (/^https?:/.test(link) || link.startsWith('/')) return link;
    if (link === 'index.php') return '/';
    return `/${link}`;
}

/**
 * A step as UNA's "List with descriptions" menu template draws it: the item's icon on a 44px tile with the regular
 * button's surface and corners, the title over the item's Info, the state's mark at the end. The row is the link.
 */
function OnboardingStep({ item }: Readonly<{ item: OnboardingItem }>) {
    const mark = MARKS[item.state || 'note'] ?? MARKS.note;
    const href = stepHref(item);
    const row = (
        <View className="flex-row items-center gap-3 rounded-xl p-2">
            <View aria-hidden className="h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-button">
                <Icon icon={item.icon || 'Circle'} size={20} className="text-secondary-foreground" />
            </View>
            <View className="min-w-0 flex-1">
                <Text
                    className="text-base leading-6 font-medium text-foreground"
                    accessibilityLabel={item.state_title ? `${decodeTextNode(item.title || '')}, ${item.state_title}` : undefined}
                >
                    {decodeTextNode(item.title || '')}
                </Text>
                {item.info ? <Text className="text-sm leading-5 text-muted-foreground">{decodeTextNode(item.info)}</Text> : null}
            </View>
            <View aria-hidden>
                <Icon icon={mark.icon} size={20} className={mark.className} />
            </View>
        </View>
    );

    return href ? <Link href={href} className="rounded-xl web:hover:bg-button">{row}</Link> : row;
}

/**
 * UNA's "Get started" block (system/get_block_onboarding): an onboarding checklist, a menu whose items are its steps.
 * The block's title and description (the progress) are the block's own; Hide is the block's header action, as on the
 * site: it tells UNA (system/onboarding_hide) and removes the block.
 */
export default function Onboarding({ data, blockWrapperProps }: Readonly<{ data?: OnboardingData; blockWrapperProps?: any }>) {
    const [hidden, setHidden] = useState(false);
    const items = Array.isArray(data?.menu?.items) ? data.menu.items : [];
    if (hidden || !items.length)
        return null;

    const hide = data?.hide;
    const block = blockWrapperProps?.block;
    const blockWithHide = hide?.title ? {
        ...block,
        menu: {
            items: [{
                name: 'onboarding-hide',
                title: hide.title,
                onPress: () => {
                    setHidden(true);
                    if (hide.request_url)
                        fetcher('/api.php?r=' + hide.request_url).catch((err: unknown) => {
                            console.warn('Onboarding: could not tell UNA the checklist was hidden:', err);
                        });
                },
            }],
        },
    } : block;

    return (
        <BlockWrapper {...blockWrapperProps} block={blockWithHide}>
            <View className="-mx-2 gap-1">
                {items.map((item, index) => <OnboardingStep key={String(item.id ?? item.name ?? index)} item={item} />)}
            </View>
        </BlockWrapper>
    );
}
