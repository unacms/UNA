"use client"

import { useEffect, useState } from 'react';
import { fetcher } from 'app/lib/fetcher';
import Layout from 'app/components/layout';
import { useCurrentUser } from 'app/context/user';
import PageLayout from 'app/components/page-layout';
import { appSetting, getURI } from 'app/lib/util';
import { connect } from 'app/ui/atoms/socket'; 
import { Platform } from 'react-native'
import { storageClear } from 'app/lib/util';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appStatic } from 'app/lib/app-static'

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
            if (currentUser?.id != data.user?.id){
                let b = Object.assign({}, data.user)
                b.pusher = connect();
                setCurrentUser(b);
                storageClear();
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



// this function is called in Next as serverSideProps and in Expo to get data dynamically
export async function getData(path, token, origin, headers, callback, params) {
    if (!path || path.startsWith('expo-development-client'))
	    path = 'home';

    path = path.startsWith('/') ? path.substr(1) : path;    
    
    path = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path;

	const uri = getURI(path);
    let settings = appSetting('layouts', uri)
    if (settings && settings?.blocks){
        path = path + '&params[]=' + (Object.values(settings.blocks).map(block => block.name)).join(',')
    }
    else{
        if (params)
            path = path + '&params[]=';
    }

    if (params){
        path = path + '&params[]=' + params
    }
    // TODO: pass GET&POST params
    const t1 = Date.now();
    const data = await fetcher(token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path);
    const diff = Date.now() - t1;
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~ load time:", parseFloat(diff/1000), "sec (", path, ")");
    // console.log("************** load data:", path, "**************", data);
    return { props: { uri:(path.length ? path[0] : 'home'), ...data } }
}
