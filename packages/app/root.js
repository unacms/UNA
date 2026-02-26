"use client"
import { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { useRouter, redirectTo } from 'app/lib/hooks/router'
import Layouts from 'app/components/layouts';
import { useSetScrollDirection, useSetScrollValue } from 'app/context/jotai/layout';
import { Loading } from 'app/customization/loading';
import emitter from 'app/context/emitter';
import { Platform } from 'react-native'

export function Root(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const prevUserIdRef = useRef(currentUser?.id);
    const router = useRouter();

    const data = props?.data;
    // ################## CODE FOR NATIVE VERSION
  
    useEffect(() => {
        // Пропускаем: первый рендер (prevUserIdRef ещё не трогали)
        if (prevUserIdRef.current === undefined) {
            prevUserIdRef.current = currentUser?.id;
            return;
        }
        // Пропускаем: значение не изменилось
        if (prevUserIdRef.current === currentUser?.id) return;
        
        prevUserIdRef.current = currentUser?.id;
        
        // Релоад только при смене юзера, не при инициализации
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.reload();
        } else {
            emitter.emit('page', { action: 'reload' });
        }
    }, [currentUser?.id]);


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
