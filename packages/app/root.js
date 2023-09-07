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

const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

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

export function Root2 (props) {
    let c = {"status":200,"module":"system","method":"get_page_by_request","params":["about"],"data":{"id":2,"title":"About","uri":"about","url":"about","author":0,"added":0,"module":"system","type":1,"layout":"layout_1_column","cover_block":"","menu_top":"","menu":[],"menu_bottom":"","menu_add":"","elements":{"cell_1":[{"id":24,"module":"system","title":"About","designbox_id":11,"content":"","menu":"","source":""}]},"user":{"id":19,"display_name":"John Doe","url":"\/view-persons-profile\/dr-andrey-yasko-phd","avatar":"https:\/\/ci.una.io\/test3\/s\/bx_persons_pictures\/dhwkek9ttkhrnyfqk7wecr4cvgjpulzy.jpg","info":{"id":19,"account_id":1,"type":"bx_persons","content_id":1,"cfw_value":2147483617,"cfw_items":31,"cfu_items":31,"cfu_locked":0,"status":"active"},"notifications":24,"active":true,"status":"active"}}};
    const [data, setData] = useState(c);

    useEffect(() => {
        // Fetch the data when the component is mounted
        async function fetchData() {
            const result = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]='+props.path);
            setData(result);
           
        }

        fetchData();
    }, [props]); // Re-run the effect if 'props' change

    
    if(data?.data){
        return  <Root path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}></Root>
    }
    
    return <div className='bg-red-500'></div>    
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
