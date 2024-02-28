"use client"

import React, { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import { Platform } from 'react-native'
import { storageClear, decodeText } from 'app/lib/util';
import { appSetting, getURI } from 'app/lib/util';
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import Layouts from 'app/components/layouts'
import { remoteSettings } from 'app/settings-remote';
import { subscribe } from 'app/ui/atoms/socket';
import { getRemoteSettings } from 'app/config';

//const Layouts = React.lazy(() => import('app/components/layouts'));

const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

export function Page404(props) {
    const r = appSetting('layout', 'redirect_on_not_found');
    const redirectdRef = useRef()
    useEffect(() => {
        if (r) {
            redirectdRef.current.redirect(r);
        }
    }, []);
    return (
        <>
            <Redirect ref={redirectdRef} />
            {!r && appStatic('page_not_found')}
        </>
    );
}

export function Page403(props) {

    const r = appSetting('layout', 'redirect_on_forbidden');
    const redirectdRef = useRef()
    useEffect(() => {
        if (r) {
            redirectdRef.current.redirect(r);
        }
    }, []);
    return (
        <>
            <Redirect ref={redirectdRef} />
            {!r && appStatic('page_not_allowed')}
        </>
    );
}

export function Root(props) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    let data = props?.data;

    const isWeb = Platform.OS == 'web'

    useEffect(() => {
        if (isWeb) {
            document.title = decodeText(data?.title);
            metaAdder('property="og:title"', decodeText(data?.title))
        }
        if (props.settings)
            remoteSettings.data = props.settings;

    }, []);


    useEffect(() => {
        subscribe('sys_api_0' , 'config_changed', updateSettings);
    }, [])

    const updateSettings = (data) => {
        (async () => {
            remoteSettings.data = await getRemoteSettings();
        })();
    }


    useEffect(() => {
        if (data?.user) {
            if (currentUser?.id != data.user.id) {
                let b = Object.assign({}, data.user)

                setCurrentUser(b);
                storageClear();
            }
            if (currentUser?.notifications && currentUser?.notifications != data.user.notifications) {
                let b = currentUser;
                b.notifications = data.user.notifications
                setCurrentUser(b);
            }
        }
        else {
            // if (currentUser != null){
            setCurrentUser(false);
            storageClear();
            //}
        }

    }, [data?.user]);

    if (props.code == 404 || data?.page_status == 404) {
        return <Page404 />
    }

    if (data?.page_status == 403) {
        return <Page403 />
    }


    return (
        <Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} />
    );
}