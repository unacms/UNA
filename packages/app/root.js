import { useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import Layout from 'app/components/layout';

import PageError from 'app/components/page-layout/error';
import { useCurrentUser } from 'app/context/user';
import PageLayout from 'app/components/page-layout';


export function Root (props) {

    let { currentUser, setCurrentUser } = useCurrentUser();

    useEffect(() => {
        if (props?.data?.user){
            if (currentUser?.id != props.data.user?.id){
                setCurrentUser(props.data.user);
            }

        }else{
            setCurrentUser(null);
        }

    }, [props?.data?.user]);

    return (
        <Layout path={props.path} data={props.data} uri={props.data.uri}>
            {200 == parseInt(props.status) ? <PageLayout path={props.path} data={props.data} uri={props.data.uri}/> : <PageError uri={props.path} {...props} />}
        </Layout>
    );
}


// this function is called in Next as serverSideProps and in Expo to get data dynamically
export async function getData(path, token, origin, headers, callback) {
    if (!path || path.startsWith('expo-development-client'))
	    path = 'home';

    path = path.startsWith('/') ? path.substr(1) : path;    
   

    path = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    // TODO: pass GET&POST params
    const data = await fetcher(token || origin || headers || callback ? [path, token, '', origin, headers, callback] : path);
   // console.log("************** load data:", path, "**************", data);
    return { props: { uri:(path.length ? path[0] : 'home'), ...data } }
}
