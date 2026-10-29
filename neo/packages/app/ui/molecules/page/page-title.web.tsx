import { decodeTextNode } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { isPageCoverShown } from 'app/lib/page-cover';
import type { PageTitleProps } from './page-title.types';

/**
 * The page's title above its blocks, on desktop, where the header holds the site menu instead
 * (phones and tablets show the title in the header). Like the header title it follows the
 * page's cover for this viewer (Studio → Pages → page → Cover).
 */
export function PageTitle({ data }: Readonly<PageTitleProps>) {
    const { currentUser } = useCurrentUser();
    if (!data?.name || data.page_status) return null;
    if (!isPageCoverShown(data.cover, Boolean(currentUser))) return null;
    return (
        <h1 className="hidden lg:block font-main text-4xl font-bold tracking-tight leading-tight text-foreground">
            {decodeTextNode(data.name)}
        </h1>
    );
}
