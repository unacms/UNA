import { Platform } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButtonLink } from 'app/design/controls';
import type { NeoButtonStyle } from 'app/design/controls/neo-button/neo-button.types';
import Image from 'app/ui/atoms/image';
import { appSetting, decodeTextNode, findIconFromRemote } from 'app/lib/util';
import { isPageCoverHiddenOn } from 'app/lib/page-cover';

/** One link of the home cover (`cover_home.actions`): Sign up (primary) and Log in, for guests. */
export type HomeCoverAction = {
    name?: string;
    title?: string;
    link?: string;
    primary?: boolean;
    /** The button's icon as UNA names it (Artificer's Log in has an arrow); empty for none. */
    icon?: string;
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
    /** The cover picture (the page's, else the site's common cover from Studio > Designer > Cover); empty for none. */
    image?: string;
    /** The template's own art the site shows when there is no picture, light and dark. */
    image_default?: { light?: string; dark?: string };
    actions?: HomeCoverAction[];
};

type HomeCoverProps = {
    cover?: HomeCoverData | null;
    /** The page's `cover_hidden_on` (Studio > Pages > Home > Cover hidden on). */
    hiddenOn?: unknown;
};

// One class per tier and state, written out for the class scanners.
const TIER_VISIBILITY = {
    phone: { shown: 'flex', hidden: 'hidden' },
    tablet: { shown: 'sm:flex', hidden: 'sm:hidden' },
    desktop: { shown: 'lg:flex', hidden: 'lg:hidden' },
} as const;

/**
 * The cover's text colours: white over a picture or the template's art, as UNA's covers (the accent line in UNA's
 * green-to-blue gradient on web, `.neo-home-cover-accent` in global.web.css), and the accent surface's own colours
 * when UNA sends neither (an older UNA).
 */
const TONES = {
    picture: { title: 'text-white', accent: 'text-white neo-home-cover-accent', text: 'text-white', surface: 'bg-neutral-900' },
    // Muted text on the accent surface is under 4.5:1 in dark mode (neutral-400 on accent-900): full foreground there.
    plain: { title: 'text-foreground', accent: 'text-accent-foreground', text: 'text-muted-foreground dark:text-foreground', surface: 'bg-accent' },
} as const;

/** Glass over a picture or the art, as UNA styles every button in a cover; the regular styles on the accent surface. */
const BUTTON_STYLES: Record<'picture' | 'plain', { primary: NeoButtonStyle; other: NeoButtonStyle }> = {
    picture: { primary: 'glassProminent', other: 'glass' },
    plain: { primary: 'borderedProminent', other: 'bordered' },
};

/** The template's art for a cover without a picture: its light version, and its dark one in dark mode. */
function CoverArt({ light, dark }: Readonly<{ light?: string; dark?: string }>) {
    if (!light && !dark) return null;
    const lightSrc = light || dark || '';
    const darkSrc = dark || light || '';
    if (lightSrc === darkSrc) {
        return <Image src={lightSrc} alt="" view="cover" sizes="100vw" className="absolute inset-0 h-full w-full" />;
    }
    return (
        <>
            <View className="absolute inset-0 dark:hidden">
                <Image src={lightSrc} alt="" view="cover" sizes="100vw" className="absolute inset-0 h-full w-full" />
            </View>
            <View className="absolute inset-0 hidden dark:flex">
                <Image src={darkSrc} alt="" view="cover" sizes="100vw" className="absolute inset-0 h-full w-full" />
            </View>
        </>
    );
}

/** The classes that show the cover on the screen sizes Studio leaves it on ("Cover hidden on"). */
function visibilityClasses(hiddenOn: unknown): string {
    return (Object.keys(TIER_VISIBILITY) as (keyof typeof TIER_VISIBILITY)[])
        .map((tier) => TIER_VISIBILITY[tier][isPageCoverHiddenOn(hiddenOn, tier, false) ? 'hidden' : 'shown'])
        .join(' ');
}

/** Hidden in the native apps where Studio hides it in UNA's mobile app ("Cover hidden on: mobile app"). */
function isHiddenInApp(hiddenOn: unknown): boolean {
    return Platform.OS !== 'web' && Array.isArray(hiddenOn) && hiddenOn.includes('mobile-app');
}

function CoverTitle({ title, accent, tone }: Readonly<{ title: string; accent: string; tone: keyof typeof TONES }>) {
    if (!title && !accent) return null;
    const colors = TONES[tone];
    return (
        <Text role="heading" aria-level={1} className={`font-title text-center text-4xl font-bold tracking-tight sm:text-5xl ${colors.title}`}>
            {title}
            {accent ? (
                // Its own line: a line break on native, a block on web (where the break would collapse).
                <Text className={`web:block font-title text-4xl font-bold tracking-tight sm:text-5xl ${colors.accent}`}>
                    {title ? '\n' : ''}{accent}
                </Text>
            ) : null}
        </Text>
    );
}

function CoverActions({ actions, tone }: Readonly<{ actions: HomeCoverAction[]; tone: keyof typeof TONES }>) {
    if (!actions.length) return null;
    const styles = BUTTON_STYLES[tone];
    return (
        <Row className="mt-2 flex-wrap items-center justify-center gap-3">
            {actions.map((action, index) => (
                <NeoButtonLink
                    key={action.name || String(index)}
                    href={action.link}
                    label={action.title}
                    image={action.icon ? findIconFromRemote(action.icon) : undefined}
                    controlSize="large"
                    borderShape="capsule"
                    style={action.primary ? styles.primary : styles.other}
                />
            ))}
        </Row>
    );
}

/**
 * UNA's home cover: the words, Sign up and Log in for guests, over the cover picture with a dark scrim, or on
 * the accent surface when there is none. It sits in the page's content width, rounded like the blocks below it.
 */
export default function HomeCover({ cover, hiddenOn }: Readonly<HomeCoverProps>) {
    if (!cover || isHiddenInApp(hiddenOn)) return null;

    const title = decodeTextNode(cover.title || '');
    const accent = decodeTextNode(cover.title_accent || '');
    const text = decodeTextNode(cover.text || '');
    const actions = (cover.actions || []).filter((action) => action?.link && action?.title);
    if (!title && !accent && !text && !actions.length) return null;

    const art = cover.image ? null : cover.image_default;
    const tone = cover.image || art?.light || art?.dark ? 'picture' : 'plain';
    const rounded = appSetting('theme', 'blocks', 'u-block-rounded-default') || '';

    return (
        <View className={`${visibilityClasses(hiddenOn)} w-full`}>
            <View className={`relative w-full overflow-hidden ${rounded} ${TONES[tone].surface}`}>
                {cover.image ? (
                    <>
                        <Image src={cover.image} alt="" view="cover" sizes="100vw" className="absolute inset-0 h-full w-full" />
                        {/* 55% black keeps white text above 4.5:1 on any picture. */}
                        <View className="absolute inset-0 bg-black/55" />
                    </>
                ) : null}
                {/* The template's art is dark enough for white text without a scrim, as on the site. */}
                <CoverArt light={art?.light} dark={art?.dark} />
                <View className="w-full items-center gap-4 px-6 py-12 sm:py-16 lg:py-20">
                    <CoverTitle title={title} accent={accent} tone={tone} />
                    {text ? (
                        <Text className={`max-w-2xl text-center text-base sm:text-lg ${TONES[tone].text}`}>{text}</Text>
                    ) : null}
                    <CoverActions actions={actions} tone={tone} />
                </View>
            </View>
        </View>
    );
}
