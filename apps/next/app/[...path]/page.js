import { cookies } from 'next/headers'
import { env } from 'app/lib/env';
import { Page } from './content'
import { useColorScheme } from 'react-native';


const siteTitle = 'NEO';

export async function generateMetadata(props) {
    let path = props.params.path.join('/');
 
    let c = cookies().getAll();
    let cookieString = '';
 
    c.map(function (item) {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
    });
    const opts = {
        headers: {
            cookie: cookieString
        }
    };

    const res = await fetch(env('PROTO') + '//'+ env('HOST') +':'+ env('PORT') +'/api/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path, opts)
    const data = await res.json()

    return {
        title: data?.data?.title,
        description: siteTitle,
        viewport: {
            width: 'device-width',
            initialScale: 1,
            viewportFit: 'viewport-fit',
        },
        manifest: '/manifest.json',
        icons: {
            icon: '/favicon.ico',
        },
        other: {
            'apple-mobile-web-app-capable': 'yes',
            'og:title': data?.data?.title
        },
        themeColor: [
            { media: '(prefers-color-scheme: light)', color: 'rgba(255,255,255,0.8)' },
            { media: '(prefers-color-scheme: dark)', color: 'rgba(17,24,39,0.8)' },
        ],
    }
}

export default async function Path (props) {
    let path = props.params.path.join('/');
 
    let c = cookies().getAll();
    let cookieString = '';
 
    c.map(function (item) {
        cookieString += item.name + '=' + encodeURIComponent(item.value) + '; '
    });
    const opts = {
        headers: {
            cookie: cookieString
        }
    };

    const res = await fetch(env('PROTO') + '//'+ env('HOST') +':'+ env('PORT') +'/api/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + path, opts)
    const data = await res.json()

    return <Page path={'home'} data={data.data} uri={data.data.uri} url ={data.data.url}>{}</Page>
}
