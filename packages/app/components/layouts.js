"use client"
import Layout from 'app/components/layout';
import { useCurrentUser, isWebAuthReady } from 'app/context/user'
import { getComponent } from 'app/components/registry';
import { appSetting, getLayoutName, getPageContentPaddingTiers, getPageContentWidth, getPageData, strToObj } from 'app/lib/util'
import emitter from 'app/context/emitter';
import { responsiveClasses } from 'app/lib/responsive-classes'
import Cell from 'app/components/cell';
import { Row } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo } from 'react';
import ConfirmEmail from 'app/ui/molecules/auth/confirm-email'
import PageByUrl from 'app/ui/molecules/page/page-by-url'
import { registerAll } from 'app/components/registry-init';
import { Text } from 'app/design/typography'
import { ButtonLink } from 'app/design/controls'
import { useWindowDimensions, Platform } from 'react-native';
import { useSetWindowSize } from 'app/context/measure';
import { coerceVersion, isBelowRange, isAboveRange } from 'app/lib/server-version';
import { Card } from 'app/ui/molecules/page/card'
import { FormModalHost } from 'app/ui/molecules/dialogs/form-modal';
import { UnsavedFormConfirmHost } from 'app/ui/molecules/dialogs/unsaved-form-confirm-host';
import { VersionIncompatible, VersionWarning } from 'app/ui/molecules/system/version-notice';
import { OperatorAgentFloat } from 'app/ui/molecules/system/operator-agent';
import { useTranslation } from 'react-i18next';

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
        const subscription = emitter.addListener('connections', async (payload) => {
            if (payload?.action !== 'changed' || payload?.reload === false) return;
            const pageUrl = urlRef.current;
            if (!pageUrl) return;
            const sResponse = await getPageData(pageUrl);
            if (sResponse?.data) {
                emitter.emit('page', { action: 'updated', data: sResponse.data });
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
            <OperatorAgentFloat />
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

function PageLayoutContent({ layout, data }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const { layoutName, layoutBlocks, isCustomLayout, columnLayout = '' } = layout;

    // Derived values; React Compiler memoizes them on their real inputs.
    const pageConfig = data?.config;
    const pageClasses = {
        padding: responsiveClasses('padding', pageConfig?.padding ?? getPageContentPaddingTiers(layoutName)),
        gap: responsiveClasses('gap', pageConfig?.gap),
        width: appSetting('layout', 'max_width'),
        contentWidth: getPageContentWidth(layoutName),
    };

    const hasProfileInformer = currentUser?.informer?.some(
        item => item.id === "sys-account-profile-system"
    );

    const Component = getComponent('layout', layoutName);

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

    if (currentUser && !currentUser.confirmed && appSetting('layout', 'lock_unconfirmed')) {
        return <ConfirmEmail url={data.url} />;
    }

    if ((hasProfileInformer || currentUser?.membership==2 && data.uri =='home') && appSetting('layout', 'lock_no_profile')) {

        if (currentUser?.menu?.items?.length > 1) {
            return (
                <Card className='mx-auto my-4'>
                    <Text className='text-card-foreground text-base font-semibold text-center'>{t('Create a profile to continue')}</Text>
                    <Row className='gap-x-3'>
                        {currentUser.menu.items.map(item => {
                            return (<ButtonLink href={item.link} key={item.name} title={item.title} startDecorator={item.icon} />);
                        })}
                    </Row>
                </Card>
            )
        }
        else {
            return <PageByUrl url={currentUser?.menu?.items[0].link} />;
        }
    }

    if (!Component || !isWebAuthReady(data, currentUser)) {
        return null;
    }

    const Splash = getComponent('molecule', 'splash')
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
