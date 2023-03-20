import React from 'react'
import All, { getData } from 'app/all'
import { useRouter } from 'next/router';

export default function Path (props) {
    const router = useRouter()
    const path = router?.query?.path?.join('/')
    
    return <All path={path} {...props}>props.children</All>
}

export async function getServerSideProps(context) {
    const cookies = context.req.headers.cookie;
    const data = await getData(
        context.params?.path?.join('/'), 
        process.env.UNA_API_KEY, 
        undefined, 
        cookies ? { 'Cookie': cookies } : undefined
    );
    if (200 !== parseInt(data.props.status))
        context.res.statusCode = parseInt(data.props.status)
    return data;
}