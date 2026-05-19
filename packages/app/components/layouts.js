"use client"
import Layout from 'app/components/layout';
import { useCurrentUser } from 'app/context/user'
import { getComponent } from 'app/components/registry';
import { appSetting, getLayoutName } from 'app/lib/util'
import Cell from 'app/components/cell';
import { View, Row } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo } from 'react';
import ConfirmEmail from 'app/ui/molecules/confirm_email'
import PageByUrl from 'app/ui/molecules/page-by-url'
import { registerAll } from 'app/components/registry-init';
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { Button, ButtonLink } from 'app/design/controls'
import { useWindowDimensions, Platform } from 'react-native';
import { useSetWindowSize } from 'app/context/measure';
import semver from 'semver';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from 'app/ui/molecules/card'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import {FormModalHost} from 'app/ui/molecules/form_modal';

function WindowSizeSync() {
    const { width, height } = useWindowDimensions();
    const setWindowSize = useSetWindowSize();
    useEffect(() => {
        setWindowSize(Math.round(width), Math.round(height));
    }, [width, height, setWindowSize]);
}

export default function Layouts({ path, data }) {
    const uri = data?.uri
    const url = data?.url
    const isWeb = Platform.OS === 'web';
    if (isWeb)
        registerAll();

    const { currentUser } = useCurrentUser();

    const layout = useMemo(() => {
        return getLayoutName(data, data?.uri?.toString());
    }, [data]);


    const { t } = useTranslation();
    const v = semver.coerce(data.version)?.version || false;
    const minVersion = appSetting('config', 'min_server_version');
    const maxVersion = appSetting('config', 'stable_server_version');
    const appVersion = appSetting('config', 'app_version');
    if (data.version) {

        if (semver.ltr(v, minVersion, { includePrerelease: true })) {
            return (
                <View className="w-full lg:flex-row max-w-7xl mx-auto my-auto">
                    <View className="max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto gap-y-4">
                        <View>
                            <Card padding="p-6  ">
                                <CardHeader>
                                    <CardTitle>{t("version_incompatible_title")}</CardTitle>
                                </CardHeader>
                                <CardContent className="gap-4">
                                    <Text>
                                        {t("version_incompatible_text1", { version: appVersion })}
                                    </Text>
                                    <Text>
                                        {t("version_incompatible_text2", { version: data.version, min_version: minVersion })}
                                    </Text>
                                    <Text>
                                        {t("version_incompatible_text3")}
                                    </Text>
                                </CardContent>
                            </Card>
                        </View>
                    </View>
                </View>
            )
        }
    }
    const isVersionInfo = v && semver.gtr(v, maxVersion, { includePrerelease: true }) && currentUser?.operator;

    return (
        <Layout layout={layout} data={data}>
            <PageLayoutContent layout={layout} path={path} data={data} />
            <WindowSizeSync />
            <FormModalHost/>
            {isVersionInfo && <View className="fixed bottom-16 left-5"><DropdownPopup
                open={true}
                minPopupWidth={320}
                trigger={<Button
                    key="btn"
                    variant="danger"
                    size="base"
                    rounded
                    startDecorator="TriangleAlert"
                />}
            >
                <View className="gap-2">
                    <Text className="text-xs text-secondary-foreground font-medium">
                        {t("version_warning_title")}
                    </Text>
                    <Text className="text-xs text-secondary-foreground ">
                        {t("version_warning_text1", { version: appVersion, server_version: data.version })}
                    </Text>
                    <Text className="text-xs text-secondary-foreground ">
                        {t("version_warning_text2", { version: maxVersion })}
                    </Text>
                    <Text className="text-xs text-secondary-foreground ">
                        {t("version_warning_text3")}
                    </Text>
                </View>
            </DropdownPopup></View>}
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
    const { layoutName, layoutBlocks, isCustomLayout } = layout;

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
                    <Text className='text-card-foreground text-base font-semibold text-center'>Create a profile...</Text>
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

    if (!Component || currentUser === null) {
        return null;
    }

    const Splash = getComponent('molecule', 'splash')
    if (!currentUser && layoutName == 'home' && (data.layout == 'splash' || appSetting('layout', 'use_splash_page')))
        return <Splash data={data} />

    if (isCustomLayout && layoutBlocks) {
        return (
            <Component key={componentKey} layoutName={layoutName} data={data} blocks={layoutBlocks} />
        );
    }

    if (!data || !data.elements) {
        return null;
    }

    const cells = Object.keys(data.elements).map((key) => (
        <Cell key={key} uri={data?.uri} url={data.url} blocks={data.elements[key]} />
    ));

    return (
        <Component key={componentKey} layoutName={layoutName} data={data}>
            {cells}
        </Component>
    );
}
