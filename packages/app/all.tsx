import { fetcher } from 'app/lib/util';
import Layout from 'app/components/layout';
import Page from 'app/components/page';

import { View, Text } from 'dripsy'
import { TextLink } from 'solito/link'

export default function ({uri, data}) {
    return (
        <Layout uri={uri}>
            <Page uri={uri} data={data} />
        </Layout>
    );
}

// this function is called in Next as serverSideProps and in Expo to get data dynamically
export async function getData(path) {
    if (path == '')
	path = 'timeline-view-home'
    path = path.startsWith('/') ? path.substr(1) : path;

    // TODO: pass GET&POST params
    const data = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path)
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
