"use client"
import Layout from 'app/components/layout';
import { useCurrentUser } from 'app/context/user'
 import { getComponent } from 'app/components/registry';
import { appSetting, getPageSettings } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo } from 'react';
import ConfirmEmail from 'app/ui/molecules/confirm_email'

import {registerAll} from 'app/components/registry-init';

export default function Layouts({ path, data, uri, url }) {


        registerAll();

    const { currentUser, setCurrentUser } = useCurrentUser();
    const layout = useMemo(() => {
        const isWeb = Platform.OS === 'web';
        return getLayoutName(data, data?.uri?.toString(), isWeb);
    }, [data, data?.uri]);

    return (
        <Layout layout={layout} path={path} data={data} uri={uri} key={`layout${currentUser?.id}`}>
            <PageLayoutContent layout={layout}  path={path} data={data} uri={uri} url={url} />
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

function Wrapper(children) {
    return <View className="flex-1 mx-auto w-full h-full ">{children}</View>;/*animated-view*/
}

function getLayoutName(data, uri, isWeb) {
    if (data?.page_status) {
        return { layoutName: 'default', layoutBlocks: '', isCustomLayout: false };
    }

    const layoutCustomKey = getPageSettings(data?.config, uri);
    
    let layoutKey = '';
    let layoutBlocks = '';
    let isCustomLayout = false;

    if (layoutCustomKey) {
        layoutKey = layoutCustomKey.layout;
        layoutBlocks = layoutCustomKey.blocks;
        isCustomLayout = true;
    }

    const Layout = getComponent('layout', layoutKey)

    if (Layout) {
        return { layoutName: layoutKey, layoutBlocks, isCustomLayout };
    }

    if (data?.cover_block?.profile) {
        return { layoutName: 'profile', layoutBlocks, isCustomLayout };
    }

    if (data?.menu?.items?.length > 0 && !uri.includes('create-')) {
        return { layoutName: 'navigator', layoutBlocks, isCustomLayout };
    }

    if (isWeb) {
        layoutKey = data?.layout;
    }

    if (Layout) {
        return { layoutName: layoutKey, layoutBlocks, isCustomLayout };
    }

    return { layoutName: 'default', layoutBlocks, isCustomLayout };
}

function PageLayoutContent(props) {
   
    const { data, url } = props;
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { layoutName, layoutBlocks, isCustomLayout }  = props.layout;
    if (data?.page_status === 404 || data?.page_status === 403) {
        return <ErrorPage type={data?.page_status} />;
    }

    if (currentUser && !currentUser.confirmed && appSetting('layout', 'lock_unconfirmed')) {
        return <ConfirmEmail url={url} />;
    }


    const Component = getComponent('layout', layoutName);

    if (isCustomLayout && layoutBlocks) {
        return Wrapper(
            <Component key={`ts${data?.timestamp}`} layoutName={layoutName} {...props} blocks={layoutBlocks} />
        );
    }

    if (!data || !data.elements) {
        return null;
    }

    const cells = Object.keys(data.elements).map((key) => (
        <Cell key={key} uri={data?.uri} url={url} blocks={data.elements[key]} />
    ));

    return Wrapper(
        <Component key={`ts${data?.timestamp}`} layoutName={layoutName} {...props}>
            {cells}
        </Component>
    );
}

