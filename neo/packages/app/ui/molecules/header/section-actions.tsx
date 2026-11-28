import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NeoButton } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import { useCurrentUser } from 'app/context/user';
import { useIsDesktop } from 'app/context/measure';
import { getHeaderToolbarNeoButtonDefaults } from 'app/lib/util';
import FormModal, { handleFormModal } from 'app/ui/molecules/dialogs/form-modal';
import type { SearchScope } from 'app/lib/search-window';

/** The page's section actions from UNA's page data: its Search (`search`) and the section's Add (`menu.add_*`). */
export type SectionActions = {
    search: SearchScope | null;
    add: { url: string; title: string; icon: string } | null;
};

export function getSectionActions(pageData: any, currentUser: any): SectionActions {
    const search = pageData?.search && typeof pageData.search === 'object' ? (pageData.search as SearchScope) : null;
    const menu = pageData?.menu;
    const add = menu?.add_url && currentUser && menu.add_allowed !== false
        ? { url: String(menu.add_url), title: String(menu.add_title || 'Add'), icon: String(menu.add_icon || 'Plus') }
        : null;
    return { search, add };
}

export function useSectionActions(pageData: any): SectionActions {
    const { currentUser } = useCurrentUser();
    return getSectionActions(pageData, currentUser);
}

/** The section's Add ("Add post", the module's own icon): its create form in a modal, as the section's Add on wider screens. */
export function SectionAddButton({ add, buttonProps }: { add: NonNullable<SectionActions['add']>; buttonProps?: Record<string, unknown> }) {
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    const [pageData, setPageData] = useState<any>(false);

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} url={pageData?.url} modalView={undefined} historyUrl={undefined} />
            <NeoButton
                {...getHeaderToolbarNeoButtonDefaults(isDesktop)}
                image={add.icon}
                borderShape="circle"
                tooltip={t(add.title)}
                accessibilityLabel={t(add.title)}
                {...(buttonProps || {})}
                onPress={() => {
                    setPageData('loading');
                    handleFormModal({ name: 'Add', link: add.url, tooltip: add.title }, null, setPageData);
                }}
            />
        </>
    );
}

/** Global search on phones: Explore with its field focused, the apps' search page. */
export function ExploreSearchButton({ buttonProps }: { buttonProps?: Record<string, unknown> }) {
    const { t } = useTranslation();
    const isDesktop = useIsDesktop();
    return (
        <Link href="/explore?search=1" mode="plain" alt={t('Search')}>
            <NeoButton
                {...getHeaderToolbarNeoButtonDefaults(isDesktop)}
                image="Search"
                borderShape="circle"
                accessibilityLabel={t('Search')}
                {...(buttonProps || {})}
                interactive={false}
            />
        </Link>
    );
}
