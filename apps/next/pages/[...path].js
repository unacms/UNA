import { Root, getData } from 'app/root'
import { useRouter } from 'next/router';
import { env } from 'app/lib/env';
import { appSetting } from 'app/lib/util'

const setCookie = require('set-cookie-parser');

export default function Path (props) {
    const router = useRouter()
    const path = router?.query?.path?.join('/')
    return <Root path={path} {...props}></Root>
}

export async function getServerSideProps(context) {
    let params = null;
    
    let {path, ...rest} = context?.query;
    params = JSON.stringify(rest);

    const cookies = context.req.headers.cookie;

    /*const staticPage = appSetting('static_pages', path[0]);

    if (!cookies.includes('logged=1') && staticPage){
        let data = {
            "data": {
              "title": staticPage,
              "uri": path[0],
              "url": path[0],
              "elements": {
              },
            }
        }
        return {props:data}
    }*/

    const data = await getData(
        context.params?.path?.join('/'),
        env('UNA_API_KEY'), 
        undefined, 
        cookies ? { 'Cookie': cookies } : undefined,
        async (r) => {
            if (r.headers.has('Set-Cookie')) {
                var combinedCookieHeader = r.headers.get('Set-Cookie');
                var splitCookieHeaders = setCookie.splitCookiesString(combinedCookieHeader);
                context.res.setHeader('Set-Cookie', splitCookieHeaders);
            }
        }
        ,params
    );
    if (200 !== parseInt(data.props.status))
        context.res.statusCode = parseInt(data.props.status)

    //todo loooged
    context.res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');    
    
    return data;
}