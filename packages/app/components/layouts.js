"use client"
import Layout from 'app/components/layout';
import { useCurrentUser, isWebAuthReady } from 'app/context/user'
import { getComponent } from 'app/components/registry';
import { appSetting, getLayoutName, getPageContentWidth, strToObj } from 'app/lib/util'
import { responsiveClasses } from 'app/lib/responsive-classes'
import Cell from 'app/components/cell';
import { Row } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo } from 'react';
import ConfirmEmail from 'app/ui/molecules/confirm_email'
import PageByUrl from 'app/ui/molecules/page-by-url'
import { registerAll } from 'app/components/registry-init';
import { Text } from 'app/design/typography'
import { ButtonLink } from 'app/design/controls'
import { useWindowDimensions, Platform } from 'react-native';
import { useSetWindowSize } from 'app/context/measure';
import semver from 'semver';
import { Card } from 'app/ui/molecules/card'
import { FormModalHost } from 'app/ui/molecules/form_modal';
import { VersionIncompatible, VersionWarning } from 'app/ui/molecules/version-notice';
import { useTranslation } from 'react-i18next';

function WindowSizeSync() {
    const { width, height } = useWindowDimensions();
    const setWindowSize = useSetWindowSize();
    useEffect(() => {
        setWindowSize(Math.round(width), Math.round(height));
    }, [width, height, setWindowSize]);
}

export default function Layouts({ path, data }) {
    const { t } = useTranslation();
    const uri = data?.uri
    const url = data?.url
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


    const { currentUser } = useCurrentUser();

    const layout = useMemo(() => {
        return getLayoutName(pageData, pageData?.uri?.toString());
    }, [pageData]);


    const v = semver.coerce(data.version)?.version || false;
    const minVersion = appSetting('config', 'min_server_version');
    const maxVersion = appSetting('config', 'stable_server_version');

    if (data.version && semver.ltr(v, minVersion, { includePrerelease: true })) {
        return <VersionIncompatible serverVersion={data.version} />;
    }

    const isVersionInfo = v && semver.gtr(v, maxVersion, { includePrerelease: true }) && currentUser?.operator;

    return (
        <Layout layout={layout} data={pageData}>
            <PageLayoutContent layout={layout} path={path} data={pageData} />
            <WindowSizeSync />
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

function PageLayoutContent({ layout, data }) {
    const { currentUser } = useCurrentUser();
    const { layoutName, layoutBlocks, isCustomLayout, columnLayout = '' } = layout;

    const pageClasses = useMemo(() => ({
        padding: responsiveClasses('padding', data?.config?.padding),
        gap: responsiveClasses('gap', data?.config?.gap),
        width: appSetting('layout', 'max_width'),
        contentWidth: getPageContentWidth(columnLayout || data?.layout || layoutName),
    }), [data?.config, columnLayout, data?.layout, layoutName]);

    const hasProfileInformer = currentUser?.informer?.some(
        item => item.id === "sys-account-profile-system"
    );

    const Component = useMemo(() => {
        return getComponent('layout', layoutName);
    }, [layoutName]);

    const componentKey = useMemo(() => {
        if (layoutName === 'wiki') {
            return `layout-${layoutName}`;
        }

        return `layout-${layoutName}-${data.uri || data.url || ''}-${data?.timestamp || ''}`;
    }, [layoutName, data.uri, data.url, data?.timestamp]);

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
