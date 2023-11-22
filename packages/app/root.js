"use client"

import React, { useEffect, useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import { useCurrentUser } from 'app/context/user';
import { appSetting, getURI } from 'app/lib/util';
import { connect } from 'app/ui/atoms/socket'; 
import { Platform } from 'react-native'
import { storageClear } from 'app/lib/util';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appStatic } from 'app/lib/app-static'
/*
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
*/
const Layout = React.lazy(() => import('app/components/layout'));
const PageLayout = React.lazy(() => import('app/components/page-layout'));

const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

export function Page404 (props) {
    return  appStatic('page_not_found')
}

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
        <Layout path={props?.path} data={data} uri={data?.uri}>
            <PageLayout path={props?.path} data={data} uri={data?.uri} />
        </Layout>
    );
}
