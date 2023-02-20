import React from 'react'
import All, { getData } from 'app/all'
import { useRouter } from 'next/router';

export default function Path (props) {
    const router = useRouter()
    const path = router?.query?.path?.join('/')

    return <All path={path} {...props}>props.children</All>
}

export async function getServerSideProps(context) {
    return getData(context.params?.path?.join('/'));
}
