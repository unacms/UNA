import { View } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import { useCurrentUser } from 'app/context/user'
import { PageHeader } from 'app/ui/molecules/header/page-header';
import { HeaderOptionsProvider } from 'app/ui/molecules/header/options';
import { AnalyticsErrorBoundary } from 'app/lib/analytics/error-boundary';
import { ScreenReadyMarker } from 'app/lib/analytics/screen-ready-marker';
import { useEffect } from 'react';
import { appSetting } from 'app/lib/util';
import { useIsFocused } from 'app/lib/hooks/router';
import { resolvePageLayout } from 'app/lib/header-layout';
import { setAppSidebarPage } from 'app/context/app-sidebar';

/** A page failed to render: the header and the tab bar stay, so the app can go elsewhere. */
const renderPageError = (error, reset) => appStatic('page_error', { error, reset });

export default function Layout({ data, children, layout }) {

    const { currentUser } = useCurrentUser()

    // The Application layout's sidebar stands outside the tabs: the page on screen tells it its layout and URL
    // (ui/molecules/sidebar/app-sidebar). A page whose data has no layout yet leaves the sidebar as it is.
    const focused = useIsFocused();
    const ownLayout = appSetting('layout', 'page_layout');
    const pageLayout = resolvePageLayout(data?.header, ownLayout);
    const hasLayout = !!data?.header || !!ownLayout;
    const pageUrl = data?.url || '';
    useEffect(() => {
        if (focused && hasLayout) setAppSidebarPage(pageLayout, pageUrl);
    }, [focused, hasLayout, pageLayout, pageUrl]);
    if (data?.page_status == 503 || currentUser?.page_status == 503) {
        return appStatic('maintenance_mode');
    }

    return (
        <HeaderOptionsProvider>
            <View className={`text-popover-foreground  w-full h-full flex-1 bg-background`}>
                <PageHeader layoutName={layout.layoutName} pageData={data}/>
                <AnalyticsErrorBoundary fallback={renderPageError} resetKey={data?.url}>
                    {children}
                </AnalyticsErrorBoundary>
                <ScreenReadyMarker key={data?.url || ''} />
            </View>
        </HeaderOptionsProvider>
    );
}
