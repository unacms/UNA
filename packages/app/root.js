"use client"
import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { useRouter, redirectTo } from 'app/lib/hooks/router'
import Layouts from 'app/components/layouts';
import { useSetScrollDirection, useSetScrollValue } from 'app/context/jotai/layout';
import { Loading } from 'app/customization/loading';


export function Root(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const data = props?.data;
    // ################## CODE FOR NATIVE VERSION
    /*useEffect(() => {
        
        if (props.settings)
            remoteSettings.data = props.settings;

    }, [currentUser?.notifications]);*/


    const setScrollDirection = useSetScrollDirection();
    const setScrollValue = useSetScrollValue();
    
    useEffect(() => {
        // Сброс scroll состояния при смене данных страницы
        setScrollDirection(0);
        setScrollValue(0);
    }, [props?.path, props?.data?.url, setScrollDirection, setScrollValue]);

    useEffect(() => {
        if (data?.user) {
            if (currentUser?.id != data.user.id) {
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
            setCurrentUser(false);
            storageClear();
        }

    }, [data?.user]);

    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }
    const router = useRouter();

  
    if (currentUser === null) {
        return <Loading />;
    }

    if (data.redirect){
        redirectTo(router, data.redirect)
        return null
    }

    return (
        <Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} />
    );
}
