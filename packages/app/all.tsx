import { fetcher } from 'app/lib/util';
import Layout from 'app/components/layout';
import Page from 'app/components/page';
import PageError from 'app/components/pages/error';

import { View, Text } from 'dripsy'
import { TextLink } from 'solito/link'

export default function (props) {
    
    if (200 == parseInt(props.status)) {
        return (
            <Layout uri={props.path}>
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
export async function getData(path, token, origin) {
    if (!path)
	    path = 'home';
    path = path.startsWith('/') ? path.substr(1) : path;    
    path = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path;
    
    // TODO: pass GET&POST params
    const data = await fetcher(token || origin ? [path, token, '', origin] : path)
    return { props: { uri:(path.length ? path[0] : 'home'), ...data } }
}

/*
// this function is called in Next as serverSideProps and in Expo to get data dynamically
export async function getData(path) {
  // Fetch data from external API
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${path}`)
  const data = await res.json()

  // Pass data to the page via props
  return { props: { path, data } }
}
*/
