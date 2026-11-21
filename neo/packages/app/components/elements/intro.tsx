import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'app/design/view';
import { Text, H1 } from 'app/design/typography';
import { BlockWrapper as BlockWrapperJs } from 'app/components/block-wrapper';
import Illustration from 'app/ui/molecules/content/illustration';
import { staticComponents } from 'app/customization/static';
import { JoinTextBuiltIn } from 'app/default/static';
import { appStatic } from 'app/lib/app-static';
import { landingText } from 'app/lib/landing-text';
import { introOwn, unaPicture } from 'app/lib/intro-block';
import type { ElementProps } from 'app/components/block';

// A JS module: every destructured prop is inferred as required.
const BlockWrapper = BlockWrapperJs as ComponentType<Record<string, any>>;

/** The static components core ships for a project's own picture, to tell a project's from them. */
const BUILT_IN_PICTURES: Record<string, unknown> = { join_text: JoinTextBuiltIn };

/**
 * `intro` element: the picture, title and text UNA's block sends (the Sign up page's
 * `system:create_account_intro`), the same on the site (`block_join_intro.html`).
 *
 * The title is the page's heading. Left-aligned from `lg`, where the page's columns stand side by
 * side (components/page-layout/universal.js), and centred below it, where the page is one column.
 * The site does the same at its own column breakpoint.
 *
 * A project's own picture (its `join_text` in customization/static.js) and its own words (the
 * `create_account_page_*` keys in customization/translation.js) win over UNA's, as they did when
 * the Sign up page layout drew them (`introOwn`).
 */
export default function ElementIntro({ data, blockWrapperProps }: ElementProps) {
    const { t, i18n } = useTranslation();
    const own = introOwn(data?.name);

    const title = own ? landingText(t, i18n, own.titleKey, data?.title, '') : data?.title;
    const text = own ? landingText(t, i18n, own.textKey, data?.text, '') : data?.text;

    const picture = unaPicture(data?.picture);
    const hasOwnPicture =
        Boolean(own) && (staticComponents as Record<string, unknown>)[own!.picture] !== BUILT_IN_PICTURES[own!.picture];

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full items-center lg:items-start gap-6">
                {hasOwnPicture || (own && !picture) ? (
                    // A project's own picture, or core's for a UNA that sends none the app can draw.
                    appStatic(own!.picture, undefined)
                ) : picture ? (
                    <View className="w-48 max-w-full aspect-square">
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
        </BlockWrapper>
    );
}
