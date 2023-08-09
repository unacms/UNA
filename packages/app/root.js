import { useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';
import Layout from 'app/components/layout';
import { useCurrentUser } from 'app/context/user';
import PageLayout from 'app/components/page-layout';
import { appSetting, getURI, parseUrl } from 'app/lib/util';
import { connect } from 'app/ui/atoms/socket'; 

export function Root (props) {
    let { currentUser, setCurrentUser } = useCurrentUser();

    /* TODO FIX 404 */

    let data = props?.data;

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
    //console.log('0000')
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
