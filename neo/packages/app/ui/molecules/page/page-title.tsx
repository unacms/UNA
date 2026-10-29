import { Platform } from 'react-native';
import { View } from 'app/design/view';
import { H1C } from 'app/design/typography';
import { useCurrentUser } from 'app/context/user';
import { isPageCoverShown } from 'app/lib/page-cover';

type PageTitleProps = {
    data?: { name?: string; cover?: unknown; page_status?: unknown } | null;
};

/**
 * The page's title above its blocks, from tablets up on web. Phones show it in the page
 * header instead, and tablets leave it out of the header because the full logo needs the
 * room. Like the header title it follows the page's cover for this viewer (Studio → Pages →
 * page → Cover). Native keeps the title in its header.
 */
export function PageTitle({ data }: Readonly<PageTitleProps>) {
    const { currentUser } = useCurrentUser();
    if (Platform.OS !== 'web' || !data?.name || data.page_status) return null;
    if (!isPageCoverShown(data.cover, Boolean(currentUser))) return null;
    return (
        <View className="hidden sm:flex">
            <H1C isfirst islast className="lg:text-4xl">{data.name}</H1C>
        </View>
    );
}
