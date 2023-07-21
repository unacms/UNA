import { useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import Layout from 'app/components/layout';
import { useCurrentUser } from 'app/context/user';
import PageLayout from 'app/components/page-layout';
import { appSetting, getURI, parseUrl } from 'app/lib/util';
import { storageKey, storageSet, storageGet } from 'app/lib/util'
import  CurRouter from "app/ui/atoms/router";
import { Platform } from 'react-native'
import { connect } from 'app/ui/atoms/socket'; 

export function Root (props) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    /* TODO FIX 404 */

    let storageKeyValue = storageKey('');

    let data = props?.data;

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    const exitingFunction = () => {
        if (appSetting('cache', 'page')){
            let a = getCookie('pg');
            let b = a? JSON.parse(a) : [];
            if (a) document.cookie = `pg=${JSON.stringify([...new Set([...b, props.data?.url].filter(item => item))])}`;
            if (props?.data)
                storageSet('pg-d', storageKeyValue, props.data)
        }
    };
    if (appSetting('cache', 'page') && Platform.OS === 'web' && !window.location.href.includes('/api.php')){
        let defParams1 = storageGet('pg-d', storageKeyValue);
        if (defParams1){
            data = defParams1;
            data.cached = true;
        }
        else{{
            let a = getCookie('pg');
            if (a){
                let array1 = JSON.parse(a),
                    u = parseUrl(window.location.href),
                    index = array1.indexOf(u.path);
                if (index > -1) {
                    array1.splice(index, 1);
                    console.log('rem');
                    document.cookie = `pg=${JSON.stringify(array1)}`;
                    location.reload();
                    return <></>;
                }
            }
        }}
    }
    useEffect(() => {
        if (data?.user){
            if (currentUser?.id != data.user?.id){
                let b = Object.assign({}, data.user)
                b.pusher = connect();
                setCurrentUser(b);
            }
        }
        else{
            if (currentUser != null){
                setCurrentUser(null);
                
            }
        }

    }, [data?.user]);
    if (Platform.OS === 'web')
        console.log('************ Cache settings ************ Page =', appSetting('cache', 'page'), 'Lists =', appSetting('cache', 'list'));
        
    return (
        <Layout path={props?.path} data={data} uri={data?.uri}>
            {Platform.OS === 'web' && <CurRouter exitingFunction={exitingFunction}  />}
            <PageLayout path={props?.path} data={data} uri={data?.uri} />
            {/*200 == parseInt(props.status) ? <PageLayout path={props?.path} data={props?.data} uri={props?.data?.uri} /> : <PageError uri={props.path} {...props} />*/}
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
