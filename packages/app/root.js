"use client"

import React, { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { connect } from 'app/ui/atoms/socket'; 
import { Platform } from 'react-native'
import { storageClear } from 'app/lib/util';
//import { appStatic } from 'app/lib/app-static'
/*
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
*/
const Layouts = React.lazy(() => import('app/components/layouts'));


const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

/*export function Page404 (props) {
    return appStatic('page_not_found')
}*/

export function Root (props) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    let data = props?.data;

    const isWeb = Platform.OS == 'web'

    useEffect(() => {
        if (isWeb){
            document.title = data?.title;  
            metaAdder('property="og:title"', data?.title)
        }
      }, []);

    useEffect(() => {
        if (data?.user){
            if (currentUser?.id != data.user.id){
                let b = Object.assign({}, data.user)
                b.pusher = connect();
                setCurrentUser(b);
                storageClear();
            }
            if (currentUser?.notifications && currentUser?.notifications != data.user.notifications){
                let b = currentUser;
                b.notifications = data.user.notifications
                setCurrentUser(b);
            }
        }
        else{
            if (currentUser != null){
                setCurrentUser(null);
                storageClear();
            }
        }

    }, [data?.user]);
      return (
        <Layouts path={props?.path} data={data} uri={data?.uri}/>
    );
}
