import { createContext, useState, useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import Layout from 'app/components/layout';
import Page from 'app/components/page';
import PageError from 'app/components/pages/error';
import { useCurrentUser } from 'app/context/user';

export default function (props) {

    let { currentUser, setCurrentUser } = useCurrentUser();

    useEffect(() => {
        if (props?.data?.user)
            setCurrentUser(props.data.user);
        else
            setCurrentUser(null);
    }, [props?.data?.user]);

    if (200 == parseInt(props.status)) {
        return (
            <Layout uri={props.path} data={props.data}>
                <Page uri={props.path} data={props.data} />
            </Layout>
        );
    }
    else {
        return (
            <Layout uri={props.path}>
                <PageError uri={props.path} {...props} />
            </Layout>
        );
    }
}

// this function is called in Next as serverSideProps and in Expo to get data dynamically
export async function getData(path, token, origin, headers, callback) {
    if (!path)
	    path = 'home';
    path = path.startsWith('/') ? path.substr(1) : path;    
    if (path.startsWith('expo-development-client'))
        path = 'home'
    path = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path;

    // TODO: pass GET&POST params
    const data = await fetcher(token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path);

    return { props: { uri:(path.length ? path[0] : 'home'), ...data } }
}
