"use client"
import Layout from 'app/components/layout';
import { useCurrentUser, isWebAuthReady } from 'app/context/user'
import { components } from 'app/components/registry';
import { appSetting, getLayoutName, getPageContentPaddingTiers, getPageContentWidth, getPageData, strToObj } from 'app/lib/util'
import emitter, { EVENTS } from 'app/context/emitter';
import { responsiveClasses } from 'app/lib/responsive-classes'
import Cell from 'app/components/cell';
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo, useState } from 'react';
import PageByUrl from 'app/ui/molecules/page/page-by-url'
import { registerAll } from 'app/components/registry-init';
import { useWindowDimensions, Platform } from 'react-native';
import { useSetWindowSize } from 'app/context/measure';
import { coerceVersion, isBelowRange, isAboveRange } from 'app/lib/server-version';
import { FormModalHost } from 'app/ui/molecules/dialogs/form-modal';
import { UnsavedFormConfirmHost } from 'app/ui/molecules/dialogs/unsaved-form-confirm-host';
import { VersionIncompatible, VersionWarning } from 'app/ui/molecules/system/version-notice';

function WindowSizeSync() {
    const { width, height } = useWindowDimensions();
    const setWindowSize = useSetWindowSize();
    useEffect(() => {
        setWindowSize(Math.round(width), Math.round(height));
    }, [width, height, setWindowSize]);
}

export default function Layouts({ path, data }) {
    const url = data?.url
    const urlRef = useRef(url);
    useEffect(() => {
        urlRef.current = url;
    }, [url]);
    const isWeb = Platform.OS === 'web';
    if (isWeb)
        registerAll();

    const pageData = useMemo(() => {
        if (!data) return data;
        const raw = data.config;
        if (typeof raw !== 'string' || !appSetting('layout', 'user_remote_config')) {
            return data;
        }
        const parsed = strToObj(raw);
        return parsed ? { ...data, config: parsed } : data;
    }, [data]);

    // When connections change, refetch the current page and pass JSON to listeners.
    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.connections, async (payload) => {
            if (payload?.action !== 'changed' || payload?.reload === false) return;
            const pageUrl = urlRef.current;
            if (!pageUrl) return;
            const sResponse = await getPageData(pageUrl);
            if (sResponse?.data) {
                emitter.emit(EVENTS.page, { action: 'updated', data: sResponse.data });
            }
        });
        return () => subscription.remove();
    }, []);


    const { currentUser } = useCurrentUser();

    const layout = useMemo(() => {
        return getLayoutName(pageData, pageData?.uri?.toString());
    }, [pageData]);


    const v = coerceVersion(data.version);
    const minVersion = appSetting('config', 'min_server_version');
    const maxVersion = appSetting('config', 'stable_server_version');

    if (data.version && isBelowRange(data.version, minVersion)) {
        return <VersionIncompatible serverVersion={data.version} />;
    }

    const isVersionInfo = !!v && isAboveRange(data.version, maxVersion) && currentUser?.operator;

    return (
        <Layout layout={layout} data={pageData}>
            <PageLayoutContent layout={layout} path={path} data={pageData} />
            <WindowSizeSync />
            <UnsavedFormConfirmHost />
            <FormModalHost />
            {isVersionInfo ? <VersionWarning serverVersion={data.version} /> : null}
        </Layout>
    )
}

function ErrorPage({ type }) {
    const redirectKey = type === 404 ? 'redirect_on_not_found' : 'redirect_on_forbidden';
    const staticPageKey = type === 404 ? 'page_not_found' : 'page_not_allowed';

    const redirectUrl = useMemo(() => appSetting('layout', redirectKey), [redirectKey]);
    const redirectRef = useRef();

    useEffect(() => {
        if (redirectUrl) {
            redirectRef.current.redirect(redirectUrl);
        }
    }, [redirectUrl]);

    return (
        <>
            <Redirect ref={redirectRef} />
            {!redirectUrl && appStatic(staticPageKey)}
        </>
    );
}

/**
 * The page an account without a profile sees: UNA's account-profile-switcher, rendered
 * like any page (layout padding, block header with icon, title and description) rather
 * than PageByUrl, which embeds bare blocks for inline forms.
 */
function NoProfilePage({ uri }) {
    const [page, setPage] = useState(null);
    useEffect(() => {
        let alive = true;
        getPageData(uri, false).then((sResponse) => {
            if (alive && sResponse?.data) setPage(sResponse.data);
        });
        return () => { alive = false; };
    }, [uri]);
    const layout = useMemo(() => (page ? getLayoutName(page, page.uri?.toString()) : null), [page]);
    if (!page || !layout) return null;
    return <PageLayoutContent layout={layout} data={page} skipProfileLock />;
}

function PageLayoutContent({ layout, data, skipProfileLock = false }) {
    const { currentUser } = useCurrentUser();
    const { layoutName, layoutBlocks, isCustomLayout, columnLayout = '' } = layout;

    // Derived values; React Compiler memoizes them on their real inputs.
    const pageConfig = data?.config;
    const pageClasses = {
        padding: responsiveClasses('padding', pageConfig?.padding ?? getPageContentPaddingTiers(layoutName)),
        gap: responsiveClasses('gap', pageConfig?.gap),
        width: appSetting('layout', 'max_width'),
        contentWidth: getPageContentWidth(layoutName, data?.uri),
    };

    const hasProfileInformer = currentUser?.informer?.some(
        item => item.id === "sys-account-profile-system"
    );

    const Component = components['layout'][layoutName];

    // Keep the wiki shell mounted across doc routes (registry key is layout_1_column_wiki).
    const isWikiLayout = layoutName === 'layout_1_column_wiki' || layoutName === 'wiki';
    const pageUri = data?.uri;
    const pageUrl = data?.url;
    const pageTimestamp = data?.timestamp;
    const componentKey = isWikiLayout
        ? `layout-${layoutName}`
        : `layout-${layoutName}-${pageUri || pageUrl || ''}-${pageTimestamp || ''}`;

    if (data?.page_status === 404 || data?.page_status === 403) {
        return <ErrorPage type={data?.page_status} />;
    }

    const ConfirmEmail = components['molecule']['confirm_email']
    // confirm_pending: email just confirmed, page data not refetched yet (sockets may already report a confirmed user)
    if (currentUser && (!currentUser.confirmed || currentUser.confirm_pending) && appSetting('layout', 'lock_unconfirmed')) {
        return <ConfirmEmail url={data.url} data={data} />;
    }

    if (!skipProfileLock && (hasProfileInformer || currentUser?.membership==2 && data.uri =='home') && appSetting('layout', 'lock_no_profile')) {

        if (currentUser?.menu?.items?.length > 1) {
            // UNA's account-profile-switcher page: its "create profile" block brings the
            // title, description and icon (editable in Studio) and the sys_add_profile menu.
            return <NoProfilePage uri="account-profile-switcher" />;
        }
        else {
            return <PageByUrl url={currentUser?.menu?.items[0].link} />;
        }
    }

    if (!Component || !isWebAuthReady(data, currentUser)) {
        return null;
    }

    const Splash = components['molecule']['splash']
    if (!currentUser && layoutName == 'home' && (data.layout == 'splash' || appSetting('layout', 'use_splash_page')))
        return <Splash data={data} />

    if (isCustomLayout && layoutBlocks) {
        return (
            <Component key={componentKey} layoutName={layoutName} columnLayout={columnLayout} data={data} blocks={layoutBlocks} pageClasses={pageClasses} />
        );
    }

    if (!data || !data.elements) {
        return null;
    }

    const cells = Object.keys(data.elements).map((key) => (
        <Cell key={key} uri={data?.uri} url={data.url} blocks={data.elements[key]} />
    ));

    return (
        <Component key={componentKey} layoutName={layoutName} columnLayout={columnLayout} data={data} pageClasses={pageClasses}>
            {cells}
        </Component>
    );
}
