"use client"
import { Text } from 'app/design/typography'
import React, { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { Platform } from 'react-native'
import { storageClear, decodeText, getDataFromCache, storageSet } from 'app/lib/util';
import { remoteSettings } from 'app/settings-remote';
import { appSetting } from 'app/lib/util'
const dynamic = require('next/dynamic').default;
const Layouts = dynamic(() => import('app/components/layouts'), { ssr: false });


const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

export function Root(props) {
    //return <></>
    let { currentUser, setCurrentUser } = useCurrentUser();
    let data = props?.data;
    const isWeb = Platform.OS == 'web'

    useEffect(() => {

            if (data?.title) {

                if (appSetting('layout', 'add_notifications_count_in_title')) {
                    if (currentUser?.notifications > 0) {
                        document.title = decodeText('(' + currentUser?.notifications + ') ' + data?.title);
                    }
                    else {
                        document.title = decodeText(data?.title);
                    }
                }
                else {
                    document.title = decodeText(data?.title);
                }

            }
            metaAdder('property="og:title"', decodeText(data?.title))
        if (props.settings)
            remoteSettings.data = props.settings;

    }, [currentUser?.notifications]);


    useEffect(() => {

        if (data?.user) {
            if (currentUser?.id != data.user.id) {
               // let b = Object.assign({}, data.user)
                //console.log('data.user', b)
                setCurrentUser(data.user);
                storageClear();
            }
            if (currentUser && currentUser?.informer != data.user.informer) {
                setCurrentUser({
                    informer: data.user.informer,
                });
            }
        }
        else {
            // if (currentUser != null){
            setCurrentUser(false);
            storageClear();
            //}
        }

    }, [data?.user]);


    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }

    return (
        <Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} />
    );
}
