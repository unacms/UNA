import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButtonLink } from 'app/design/controls';
import Image from 'app/ui/atoms/image';
import { appSetting, decodeTextNode } from 'app/lib/util';
import { isPageCoverHiddenOn } from 'app/lib/page-cover';

/** One link of the home cover (`cover_home.actions`): Sign up (primary) and Log in, for guests. */
export type HomeCoverAction = {
    name?: string;
    title?: string;
    link?: string;
    primary?: boolean;
};

/**
 * The home cover UNA's site shows above the home page's blocks (Studio > Pages > Home > Cover), as UNA sends it
 * with the page (`cover_home`, BxBasePageHome::getCoverHomeAPI) while the cover is on for the viewer and there is
 * no splash.
 */
export type HomeCoverData = {
    title?: string;
    /** Shown after the title on a line of its own, in the accent colour. */
    title_accent?: string;
    text?: string;
    /** The cover picture (the page's, else the site's common cover); empty for none. */
    image?: string;
    actions?: HomeCoverAction[];
};

type HomeCoverProps = {
    cover?: HomeCoverData | null;
    /** The page's `cover_hidden_on` (Studio > Pages > Home > Cover hidden on). */
    hiddenOn?: unknown;
};

// One class per tier and state, written out for the class scanners.
const TIER_VISIBILITY = {
    mobile: { shown: 'flex', hidden: 'hidden' },
    tablet: { shown: 'sm:flex', hidden: 'sm:hidden' },
    desktop: { shown: 'lg:flex', hidden: 'lg:hidden' },
} as const;

const PHONE_TIER = 'phone';

/**
 * UNA's home cover: the words, Sign up and Log in for guests, over the cover picture with a dark scrim, or on
 * the accent surface when there is none. It sits in the page's content width, rounded like the blocks below it.
 */
export default function HomeCover({ cover, hiddenOn }: Readonly<HomeCoverProps>) {
    if (!cover) return null;
    // The native apps count as UNA's mobile app too ("Cover hidden on: mobile app").
    if (Platform.OS !== 'web' && Array.isArray(hiddenOn) && hiddenOn.includes('mobile-app')) return null;

    const title = decodeTextNode(cover.title || '');
    const accent = decodeTextNode(cover.title_accent || '');
    const text = decodeTextNode(cover.text || '');
    const actions = (cover.actions || []).filter((action) => action?.link && action?.title);
    if (!title && !accent && !text && !actions.length) return null;

    const visibility = [
        TIER_VISIBILITY.mobile[isPageCoverHiddenOn(hiddenOn, PHONE_TIER, false) ? 'hidden' : 'shown'],
        TIER_VISIBILITY.tablet[isPageCoverHiddenOn(hiddenOn, 'tablet', false) ? 'hidden' : 'shown'],
        TIER_VISIBILITY.desktop[isPageCoverHiddenOn(hiddenOn, 'desktop', false) ? 'hidden' : 'shown'],
    ].join(' ');

    const hasImage = Boolean(cover.image);
    const rounded = appSetting('theme', 'blocks', 'u-block-rounded-default') || '';

    return (
        <View className={`${visibility} w-full`}>
            <View className={`relative w-full overflow-hidden ${rounded} ${hasImage ? 'bg-neutral-900' : 'bg-accent'}`}>
                {hasImage ? (
                    <>
                        <Image src={cover.image} alt="" view="cover" sizes="100vw" className="absolute inset-0 h-full w-full" />
                        {/* 55% black keeps white text above 4.5:1 on any picture. */}
                        <View className="absolute inset-0 bg-black/55" />
                    </>
                ) : null}
                <View className="w-full items-center gap-4 px-6 py-12 sm:py-16 lg:py-20">
                    {title || accent ? (
                        <Text
                            role="heading"
                            aria-level={1}
                            className={`font-title text-center text-4xl font-bold tracking-tight sm:text-5xl ${hasImage ? 'text-white' : 'text-foreground'}`}
                        >
                            {title}
                            {accent ? (
                                // Its own line: a line break on native, a block on web (where the break would collapse).
                                <Text className={`web:block font-title text-4xl font-bold tracking-tight sm:text-5xl ${hasImage ? 'text-white' : 'text-accent-foreground'}`}>
                                    {title ? '\n' : ''}{accent}
                                </Text>
                            ) : null}
                        </Text>
                    ) : null}
                    {text ? (
                        <Text className={`max-w-2xl text-center text-base sm:text-lg ${hasImage ? 'text-white' : 'text-muted-foreground dark:text-foreground'}`}>
                            {text}
                        </Text>
                    ) : null}
                    {actions.length ? (
                        <Row className="mt-2 flex-wrap items-center justify-center gap-3">
                            {actions.map((action, index) => (
                                <NeoButtonLink
                                    key={action.name || String(index)}
                                    href={action.link}
                                    label={action.title}
                                    controlSize="large"
                                    borderShape="capsule"
                                    style={action.primary
                                        ? (hasImage ? 'glassProminent' : 'borderedProminent')
                                        : (hasImage ? 'glass' : 'bordered')}
                                />
                            ))}
                        </Row>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
