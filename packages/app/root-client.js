'use client'
import dynamic from 'next/dynamic'
import { Loading } from 'app/customization/loading'
import { Root } from 'app/root'
// SSR enabled for faster initial page load - server pre-renders the HTML
// The loading fallback only shows during client-side navigation while chunk loads
/*const RootDyn = dynamic(() => import('app/root').then(m => m.Root), {
    ssr: false,
    loading: () => <Loading />,
})*/
export default function RootClient(props) {
    //return <RootDyn {...props} />
    return <Root {...props} />
}