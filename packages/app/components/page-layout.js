import { componentsMap } from 'app/components/page-layout/_map';
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo } from 'react';
import { storageClear } from 'app/lib/util';
import { Modal } from 'app/design/controls'
import ConfirmEmail from 'app/ui/molecules/confirm_email'
import { Text } from 'app/design/typography'

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
    return <View className="flex-1 mx-auto w-full h-full animated-view">{children}</View>;
}

export function getLayoutName(data, uri, isWeb) {
    if (data.page_status) {
        return { layoutName: 'default', layoutBlocks: '', isCustomLayout: false };
    }

    const layoutCustomKey = appSetting('layouts', uri);
    let layoutKey = '';
    let layoutBlocks = '';
    let isCustomLayout = false;

    if (layoutCustomKey) {
        layoutKey = layoutCustomKey.layout;
        layoutBlocks = layoutCustomKey.blocks;
        isCustomLayout = true;
    }

    if (componentsMap[layoutKey]) {
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

    if (componentsMap[layoutKey]) {
        return { layoutName: layoutKey, layoutBlocks, isCustomLayout };
    }

    return { layoutName: 'default', layoutBlocks, isCustomLayout };
}

export default function PageLayout(props) {
   
    const { data, url } = props;
    const isWeb = Platform.OS == 'web'
    let { currentUser, setCurrentUser } = useCurrentUser();

    if (data.page_status === 404 || data.page_status === 403) {
        return <ErrorPage type={data.page_status} />;
    }

    if (currentUser && !currentUser.confirmed && appSetting('layout', 'lock_unconfirmed')) {
        return <ConfirmEmail url={url} />;
    }

    const { layoutName, layoutBlocks, isCustomLayout } = useMemo(() => {
        const isWeb = Platform.OS === 'web';
        return getLayoutName(data, data?.uri?.toString(), isWeb);
    }, [data, data?.uri]);

    const Component = componentsMap[layoutName];

    if (isCustomLayout && layoutBlocks) {
        return Wrapper(
            <Component key={`ts${data?.timestamp}`} layoutName={layoutName} {...props} blocks={layoutBlocks} />
        );
    }

    if (!data || !data.elements) {
        return null;
    }

    const cells = Object.keys(data.elements).map((key) => (
        <Cell key={key} uri={data.uri} url={url} blocks={data.elements[key]} />
    ));

    return Wrapper(
        <Component key={`ts${data?.timestamp}`} layoutName={layoutName} {...props}>
            {cells}
        </Component>
    );
}
