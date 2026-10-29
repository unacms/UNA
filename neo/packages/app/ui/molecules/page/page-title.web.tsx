import { decodeTextNode } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { isPageCoverShown } from 'app/lib/page-cover';
import type { PageTitleProps } from './page-title.types';

/**
 * The page's title above its blocks, from tablets up. Phones show it in the page header
 * instead, and tablets leave it out of the header because the full logo needs the room. Like
 * the header title it follows the page's cover for this viewer (Studio → Pages → page →
 * Cover). On tablets it has the header title's size and weight; desktop sets it larger.
 */
export function PageTitle({ data }: Readonly<PageTitleProps>) {
    const { currentUser } = useCurrentUser();
    if (!data?.name || data.page_status) return null;
    if (!isPageCoverShown(data.cover, Boolean(currentUser))) return null;
    return (
        <h1 className="hidden sm:block font-main text-2xl lg:text-4xl font-bold tracking-tight leading-tight text-foreground">
            {decodeTextNode(data.name)}
        </h1>
    );
}
