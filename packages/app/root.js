"use client"
import { Text } from 'app/design/typography'
import { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear, decodeText, getDataFromCache, storageSet } from 'app/lib/util';
import { remoteSettings } from 'app/settings-remote';
import Layouts from 'app/components/layouts';
import { appSetting } from 'app/lib/util'

export function Root(props) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    let data = props?.data;

    useEffect(() => {
        
        if (props.settings)
            remoteSettings.data = props.settings;

    }, [currentUser?.notifications]);

    useEffect(() => {
        if (data?.user) {
            if (currentUser?.id != data.user.id) {
                setCurrentUser(data.user);
            }
            if (currentUser && currentUser?.informer != data.user.informer) {
                setCurrentUser({
                    informer: data.user.informer,
                });
            }
        }
        else {
            setCurrentUser(false);
        }

    }, [data?.user]);

    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }
    console.log("************************************************root-render", props?.path)
    return (
        /*<Text>{props?.path}</Text>*/
        <Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} />
    );
}
