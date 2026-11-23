import { View } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import { useCurrentUser } from 'app/context/user'
import { PageHeader } from 'app/ui/molecules/header/page-header';
import { HeaderOptionsProvider } from 'app/ui/molecules/header/options';
import { AnalyticsErrorBoundary } from 'app/lib/analytics/error-boundary';
import { ScreenReadyMarker } from 'app/lib/analytics/screen-ready-marker';
import { useEffect } from 'react';
import { getWindowSafeAreaInsets, useIsFocused } from 'app/lib/hooks/router';
import { setAppSidebarUrl } from 'app/context/app-sidebar';
import { InformerStrip } from 'app/components/elements/informer';
import { isNativeTabsEnabled } from 'app/lib/util';

/** A page failed to render: the header and the tab bar stay, so the app can go elsewhere. */
const renderPageError = (error, reset) => appStatic('page_error', { error, reset });

export default function Layout({ data, children, layout }) {

    const { currentUser } = useCurrentUser()

    // The drawer stands outside the tabs: the page on screen tells it its URL, to mark its row and to close on a
    // new page (ui/molecules/sidebar/app-sidebar).
    const focused = useIsFocused();
    const pageUrl = data?.url || '';
    useEffect(() => {
        if (focused) setAppSidebarUrl(pageUrl);
    }, [focused, pageUrl]);
    if (data?.page_status == 503 || currentUser?.page_status == 503) {
        return appStatic('maintenance_mode');
    }

    return (
        <HeaderOptionsProvider>
            <View className={`text-popover-foreground  w-full h-full flex-1 bg-background`}>
                {/* The informer strip above the header, which carries the page's title in the apps: the first thing on
                    screen, under the status bar (it takes the top inset the header and covers leave to it). The header
                    and the page are laid out under it. */}
                <InformerStrip topInset={isNativeTabsEnabled() ? (getWindowSafeAreaInsets().top || 0) : 0} />
                <View className="w-full flex-1 relative">
                    <PageHeader layoutName={layout.layoutName} pageData={data}/>
                    <AnalyticsErrorBoundary fallback={renderPageError} resetKey={data?.url}>
                        {children}
                    </AnalyticsErrorBoundary>
                    <ScreenReadyMarker key={data?.url || ''} />
                </View>
            </View>
        </HeaderOptionsProvider>
    );
}
