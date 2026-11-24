import { useMemo } from 'react';
import { Platform } from 'react-native';
import { appSetting, parseUrl, parseQueryString } from 'app/lib/util';
import { View } from 'app/design/view';
import { PageTitle } from 'app/ui/molecules/page/page-title';
import { PageCoverBand } from 'app/components/elements/covers/page-cover-band';
import { BlockWrapper } from 'app/components/block-wrapper';
import SearchWindow from 'app/ui/molecules/search-window/search-window';
import { normalizeSearchQuery, searchResultsHref } from 'app/lib/search-window';

/**
 * The results page (`search-keyword`): the search window in the page, opened on the query in its address, as UNA's
 * site shows it. The window keeps the address in step with its query, so a search can be shared as a link.
 */
export default function PageLayout(props) {
    const initialQuery = useMemo(() => {
        const params = parseQueryString(parseUrl(String(props.data?.url ?? '')).queryString);
        return normalizeSearchQuery(params);
    }, [props.data?.url]);

    const onQueryChange = (query) => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return;
        const href = searchResultsHref(query, window.location.pathname);
        if (href !== window.location.pathname + window.location.search)
            window.history.replaceState(window.history.state, '', href);
    };

    return (
        <View className="w-full flex-1">
            {/* The page's cover band above its title, as on the site (desktop). */}
            <PageCoverBand data={props.data} />
            <View className={appSetting('layout', 'max_width_block') + ' mx-auto w-full gap-3 px-3 pt-4 pb-3 sm:px-4'}>
                <PageTitle data={props.data} />
                <BlockWrapper>
                    <SearchWindow initialQuery={initialQuery} mode="page" autoFocus={false} onQueryChange={onQueryChange} />
                </BlockWrapper>
            </View>
        </View>
    );
}
