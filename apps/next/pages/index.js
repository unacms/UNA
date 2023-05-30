import React from 'react'
import { Root, getData } from 'app/root'
import { useRouter } from 'next/router';
import { env } from 'app/lib/env';

const setCookie = require('set-cookie-parser');

export default function Path (props) {
    const router = useRouter()
    const path = router?.query?.path?.join('/')
    return <Root path={path} {...props}>props.children</Root>
}

export async function getServerSideProps(context) {
    const cookies = context.req.headers.cookie;
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
    );
    if (200 !== parseInt(data.props.status))
        context.res.statusCode = parseInt(data.props.status)
    return data;
}