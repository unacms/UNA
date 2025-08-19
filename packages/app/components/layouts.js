"use client"
import Layout from 'app/components/layout';
import { useCurrentUser } from 'app/context/user'
import { getComponent, isComponent } from 'app/components/registry';
import { appSetting, getPageSettings } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View, Row } from 'app/design/view'
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect, useMemo } from 'react';
import ConfirmEmail from 'app/ui/molecules/confirm_email'
import { registerAll } from 'app/components/registry-init';
import RedirectElement from 'app/components/elements/redirect'
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import Card from 'app/ui/molecules/card'
import { Button } from 'app/design/controls'
export default function Layouts({ path, data, uri, url }) {

    registerAll();

    const { currentUser } = useCurrentUser();
    const layout = useMemo(() => {
        const isWeb = Platform.OS === 'web';
        return getLayoutName(data, data?.uri?.toString(), isWeb);
    }, [data, data?.uri]);

    return (
        <Layout layout={layout} path={path} data={data} uri={uri} key={`layout${currentUser?.id}`}>
            <PageLayoutContent layout={layout} path={path} data={data} uri={uri} url={url} />
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

    const { layout: customLayout = '', blocks: customBlocks = '' } = getPageSettings(data?.config, uri) || {};
    const isCustom = Boolean(customLayout);

    const checks = [
        {
            cond: isCustom,
            name: customLayout,
            blocks: customBlocks,
            custom: true,
        },
        {
            cond: Boolean(data?.cover_block?.profile),
            name: 'profile',
        },
        {
            cond: data?.menu?.items?.length > 0 && !uri.includes('create-'),
            name: 'navigator',
        },
        {
            cond: data?.layout && isComponent('layout', data.layout),
            name: data.layout,
            blocks: customBlocks,
        },
    ];

    for (const { cond, name, blocks = customBlocks, custom = isCustom } of checks) {
        if (cond) {
            return { layoutName: name, layoutBlocks: blocks, isCustomLayout: custom };
        }
    }

    return { layoutName: 'default', layoutBlocks: customBlocks, isCustomLayout: isCustom };
}

function PageLayoutContent(props) {

    const { data, url } = props;
    const { currentUser } = useCurrentUser();
    const { layoutName, layoutBlocks, isCustomLayout } = props.layout;
    if (data?.page_status === 404 || data?.page_status === 403) {
        return <ErrorPage type={data?.page_status} />;
    }

    if (currentUser && !currentUser.confirmed && appSetting('layout', 'lock_unconfirmed')) {
        return <ConfirmEmail url={url} />;
    }

    if (currentUser?.informer?.some(item => item.id == 'sys-account-profile-system')) {
        if (currentUser?.menu?.items?.length > 1) {
            return (<Card className='mx-auto my-4'>
                <Text className='text-card-foreground text-base font-semibold text-center'>Create a profile...</Text>
                <Row className='gap-x-3'>
                    {currentUser.menu.items.map(item => {
                        return (<Link href={item.link} key={item.name}><Button title={item.title} startDecorator={item.icon} /></Link>);
                    })}
                </Row>
            </Card>)
        }
        else {
            return <RedirectElement data={{ uri: currentUser.menu.items[0].link }} />
        }

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

