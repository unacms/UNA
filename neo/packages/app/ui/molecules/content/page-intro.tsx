import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text, H1 } from 'app/design/typography';
import Illustration from 'app/ui/molecules/content/illustration';
import { staticComponents } from 'app/customization/static';
import { JoinTextBuiltIn } from 'app/default/static';
import { appStatic } from 'app/lib/app-static';
import { landingText } from 'app/lib/landing-text';
import { introOwn, unaPicture } from 'app/lib/intro-block';

export type PageIntroProps = {
    /** The block's content item data, as UNA sends it: `name`, `title`, `text`, `picture`. */
    data?: { name?: unknown; title?: unknown; text?: unknown; picture?: unknown } | null;
};

/** The static components core ships for a project's own picture, to tell a project's from them. */
const BUILT_IN_PICTURES: Record<string, unknown> = { join_text: JoinTextBuiltIn };

const asText = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * A page's intro: the picture, title and text of UNA's intro block (the Sign up page's
 * `system:create_account_intro`), the same on the site (`block_join_intro.html`). UNA sends it as
 * a `static` item that names `page_intro` (components/elements/static.js draws this for it), so an
 * app from before the block draws nothing in its place and keeps its own Sign up page.
 *
 * The title is the page's heading. Left-aligned from `lg`, where the page's columns stand side by
 * side (components/page-layout/universal.js), and centred below it, where the page is one column.
 * The site does the same at its own column breakpoint.
 *
 * A project's own picture (its `join_text` in customization/static.js) and its own words (the
 * `create_account_page_*` keys in customization/translation.js) win over UNA's, as they did when
 * the Sign up page layout drew them (`introOwn`).
 */
export default function PageIntro({ data }: Readonly<PageIntroProps>) {
    const { t, i18n } = useTranslation();
    const own = introOwn(data?.name);

    const title = own ? landingText(t, i18n, own.titleKey, data?.title, '') : asText(data?.title);
    const text = own ? landingText(t, i18n, own.textKey, data?.text, '') : asText(data?.text);

    const picture = unaPicture(data?.picture);
    const hasOwnPicture =
        own !== null && (staticComponents as Record<string, unknown>)[own.picture] !== BUILT_IN_PICTURES[own.picture];

    return (
        <View className="w-full items-center lg:items-start gap-6">
            {own !== null && (hasOwnPicture || !picture) ? (
                // A project's own picture, or core's for a UNA that sends none the app can draw.
                appStatic(own.picture, undefined)
            ) : picture ? (
                <View className="aspect-square w-48 max-w-full">
                    <Illustration picture={picture} />
                </View>
            ) : null}
            {title ? (
                <H1 isfirst islast className="text-center lg:text-start text-balance">
                    {title}
                </H1>
            ) : null}
            {text ? (
                <Text
                    accessible={true}
                    accessibilityRole="text"
                    className="max-w-xl text-secondary-foreground text-center lg:text-start text-base sm:text-lg text-pretty"
                >
                    {text}
                </Text>
            ) : null}
        </View>
    );
}
